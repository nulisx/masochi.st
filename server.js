import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { body, validationResult } from 'express-validator';
import { runQuery, getQuery, allQuery } from './lib/db.js';
import { authenticateToken, JWT_SECRET } from './lib/middleware.js';
import { verificationMiddleware } from './lib/verify-middleware.js';
import { hashEmail, generateRecoveryCode } from './lib/crypto-utils.js';
import { rateLimit } from './lib/rate-limit.js';
import crypto from 'crypto';
import fs from 'fs';

import linksHandler from './api/links.js';
import profileHandler from './api/profile.js';
import invitesHandler from './api/invites.js';
import imagesHandler from './api/images.js';
import connectionsHandler from './api/connections.js';
import collectiblesHandler from './api/collectibles.js';
import tokenHandler from './api/token.js';
import filesHandler from './api/files.js';
import updatesHandler from './api/updates.js';
import biolinksHandler from './api/biolinks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(verificationMiddleware);

app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !process.env.NODE_ENV === 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});


app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'string' && data.includes('</body>')) {
      const verificationScript = `<link rel="stylesheet" href="/static/css/verification-modal.css"><script src="/static/js/verification-modal.js"><\/script>`;
      data = data.replace('</body>', `${verificationScript}</body>`);
    }
    return originalSend.call(this, data);
  };
  next();
});

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/assets/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/assets', express.static(path.join(__dirname, 'static', 'css', 'dash', 'assets')));
app.use('/dash/app', express.static(path.join(__dirname, 'dash-app'), { index: 'index.html' }));
app.get('/dash/app', (req, res) => res.sendFile(path.join(__dirname, 'dash-app', 'index.html')));

app.get('/api/cdn/images', (req, res) => {
  try {
    const catboxPath = path.join(__dirname, 'static', 'catbox');
    const files = fs.readdirSync(catboxPath).filter(f => /\.(jpeg|jpg|png|gif|webp)$/.test(f));
    const images = files.map(f => `/static/catbox/${f}`);
    res.json({ images });
  } catch (err) {
    console.error('Error reading catbox images:', err);
    res.status(500).json({ error: 'Failed to read images' });
  }
});

app.post(
  '/api/auth/register',
  rateLimit({ windowMs: 15 * 60 * 1000, maxAttempts: 3 }),
  [
    body('username').isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9!@$%&*]+$/),
    body('email').optional({ checkFalsy: true }).isEmail(),
    body('password').isLength({ min: 8 }),
    body('inviteCode').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password, inviteCode } = req.body;

    try {
      const invite = await getQuery('invites', 'code', inviteCode);
      if (!invite || invite.used || (invite.expires_at && new Date(invite.expires_at) < new Date()))
        return res.status(400).json({ error: 'Invalid or expired invite code' });

      const usernameLower = username.toLowerCase();
      const existingUser = await getQuery('users', 'username', usernameLower);
      if (existingUser) return res.status(400).json({ error: 'Username already exists' });

      let emailHash = null;
      if (email && email.trim()) {
        emailHash = hashEmail(email.toLowerCase());
        const existingEmail = await getQuery('users', 'email', emailHash);
        if (existingEmail) return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await runQuery('users', {
        username: usernameLower,
        email: emailHash,
        password_hash: passwordHash,
        display_name: username,
        role: invite.role,
      });

      const userId = newUser.id || newUser.lastInsertRowid;

      await runQuery('profiles', {
        user_id: userId,
        bio: '',
        avatar_url: '',
        theme: 'default',
      });

      const newUsesCount = (invite.uses_count || 0) + 1;
      const isFullyUsed = newUsesCount >= invite.max_uses ? 1 : 0;

      await runQuery(
        'invites',
        { id: invite.id, uses_count: newUsesCount, used: isFullyUsed, used_by: userId, used_at: new Date().toISOString() },
        'update',
        { column: 'id', value: invite.id }
      );

      const recoveryCode = generateRecoveryCode();
      const recoveryCodeHash = await bcrypt.hash(recoveryCode, 12);
      
      await runQuery('recovery_codes', {
        user_id: userId,
        code_hash: recoveryCodeHash
      });

      res.status(200).json({ 
        message: 'Registration successful', 
        userId,
        recoveryCode: recoveryCode
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed due to server error' });
    }
  }
);

function parseUserAgent(ua) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet';
  
  let browser = 'Unknown';
  if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os|macos/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  
  return { device, browser, os };
}

app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, maxAttempts: 5 }), async (req, res) => {
  const { username, identifier, password } = req.body;
  try {
    const input = (username || identifier || '').toLowerCase().trim();

    if (!input || !password) return res.status(400).json({ error: 'Missing credentials' });

    let user = await getQuery('users', 'username', input);

    if (!user && input.includes('@')) {
      const emailHash = hashEmail(input);
      user = await getQuery('users', 'email', emailHash);
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const sessionId = crypto.randomBytes(32).toString('hex');
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || 'Unknown';
    const { device, browser, os } = parseUserAgent(userAgent);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await runQuery('sessions', {
      id: sessionId,
      user_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: device,
      browser: browser,
      os: os,
      expires_at: expiresAt
    });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, sessionId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const profile = await getQuery('profiles', 'user_id', req.user.id);
    
    res.status(200).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        display_name: user.display_name,
        email: user.email,
        role: user.role,
        avatar_url: profile?.avatar_url || '/static/cdn/avatar.png',
        bio: profile?.bio || '',
        theme: profile?.theme || 'default',
        banner_url: profile?.banner_url || ''
      } 
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to retrieve user information' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user.sessionId) {
      await runQuery('sessions', { id: req.user.sessionId }, 'delete', { column: 'id', value: req.user.sessionId });
    }
  } catch (err) {
    console.error('Failed to delete session:', err);
  }
  
  res.clearCookie('token', {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/api/auth/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await allQuery('sessions', 'user_id', req.user.id);
    const now = new Date();
    
    const validSessions = [];
    const expiredSessionIds = [];
    
    for (const s of sessions) {
      if (new Date(s.expires_at) > now) {
        validSessions.push(s);
      } else {
        expiredSessionIds.push(s.id);
      }
    }
    
    if (expiredSessionIds.length > 0) {
      setImmediate(async () => {
        for (const expiredId of expiredSessionIds) {
          try {
            await runQuery('sessions', { id: expiredId }, 'delete', { column: 'id', value: expiredId });
          } catch (e) {
            console.error('Failed to delete expired session:', e);
          }
        }
      });
    }
    
    const activeSessions = validSessions.map(s => ({
      id: s.id,
      ip_address: s.ip_address,
      device_type: s.device_type,
      browser: s.browser,
      os: s.os,
      created_at: s.created_at,
      last_active_at: s.last_active_at,
      is_current: s.id === req.user.sessionId
    }));
    
    res.json({ sessions: activeSessions, count: activeSessions.length });
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.delete('/api/auth/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await getQuery('sessions', 'id', sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.user_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await runQuery('sessions', { id: sessionId }, 'delete', { column: 'id', value: sessionId });
    
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Failed to delete session:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post(
  '/api/auth/reset/verify',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
    keyGenerator: (req) => {
      const email = req.body.email || '';
      return hashEmail(email) + (req.ip || req.connection.remoteAddress);
    }
  }),
  async (req, res) => {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode) {
      return res.status(400).json({ error: 'Email and recovery code are required' });
    }

    try {
      const emailHash = hashEmail(email);
      const user = await getQuery('users', 'email', emailHash);

      if (!user) {
        return res.status(400).json({ error: 'Invalid email or recovery code. Please try again.' });
      }

      const recoveryRecord = await getQuery('recovery_codes', 'user_id', user.id);

      if (!recoveryRecord) {
        return res.status(400).json({ error: 'Invalid email or recovery code. Please try again.' });
      }

      if (recoveryRecord.consumed_at) {
        return res.status(400).json({ error: 'Invalid email or recovery code. Please try again.' });
      }

      const attempts = (recoveryRecord.attempts || 0) + 1;

      if (attempts > 5) {
        return res.status(400).json({ error: 'Invalid email or recovery code. Please try again.' });
      }

      const validCode = await bcrypt.compare(recoveryCode, recoveryRecord.code_hash);

      if (!validCode) {
        await runQuery(
          'recovery_codes',
          {
            id: recoveryRecord.id,
            attempts: attempts,
            last_attempt_at: new Date().toISOString()
          },
          'update',
          { column: 'id', value: recoveryRecord.id }
        );

        return res.status(400).json({ error: 'Invalid email or recovery code. Please try again.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await runQuery('password_resets', {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      });

      await runQuery(
        'recovery_codes',
        { user_id: user.id, consumed_at: new Date().toISOString() },
        'update',
        { column: 'user_id', value: user.id }
      );

      res.status(200).json({
        message: 'Recovery code verified successfully',
        resetToken
      });
    } catch (err) {
      console.error('Password reset verification error:', err);
      res.status(500).json({ error: 'Failed to verify recovery code' });
    }
  }
);

app.post(
  '/api/auth/reset/complete',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 3,
    keyGenerator: (req) => req.body.resetToken || (req.ip || req.connection.remoteAddress)
  }),
  [
    body('resetToken').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input. Password must be at least 8 characters.' });
    }

    const { resetToken, newPassword } = req.body;

    try {
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      const resetRecord = await getQuery('password_resets', 'token_hash', tokenHash);

      if (!resetRecord) {
        return res.status(404).json({ error: 'Invalid or expired reset token' });
      }

      if (resetRecord.used_at) {
        return res.status(400).json({ error: 'Reset token has already been used' });
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await runQuery(
        'users',
        { id: resetRecord.user_id, password_hash: newPasswordHash },
        'update',
        { column: 'id', value: resetRecord.user_id }
      );

      await runQuery(
        'password_resets',
        { id: resetRecord.id, used_at: new Date().toISOString() },
        'update',
        { column: 'id', value: resetRecord.id }
      );

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
      console.error('Password reset completion error:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);


app.post('/api/verify/browser', async (req, res) => {
  try {
    const fingerprint = req.body;
    res.cookie('browser_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 86400000 
    });
    res.json({ success: true, message: 'Browser verified' });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.get('/api/profile/view-count', authenticateToken, rateLimit({ windowMs: 5 * 60 * 1000, maxAttempts: 20 }), async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getQuery('profiles', 'user_id', userId);
    res.json({ view_count: profile?.view_count || 0, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('View count fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch view count' });
  }
});

app.post('/api/links/track-click/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const link = await getQuery('links', 'id', parseInt(linkId));
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const currentClicks = link.click_count || 0;
    await runQuery(
      'links',
      { id: link.id, user_id: link.user_id, title: link.title, url: link.url, click_count: currentClicks + 1, description: link.description },
      'update',
      { column: 'id', value: linkId }
    );

    res.json({ success: true, click_count: currentClicks + 1 });
  } catch (err) {
    console.error('Click tracking error:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

app.post('/api/biolink/track-click/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await getQuery('users', 'username', username.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await getQuery('profiles', 'user_id', user.id);
    const currentClicks = profile?.biolink_clicks || 0;
    
    await runQuery(
      'profiles',
      { ...profile, biolink_clicks: currentClicks + 1 },
      'update',
      { column: 'user_id', value: user.id }
    );

    res.json({ success: true, biolink_clicks: currentClicks + 1 });
  } catch (err) {
    console.error('Biolink click tracking error:', err);
    res.status(500).json({ error: 'Failed to track biolink click' });
  }
});

app.use('/api/links', linksHandler);
app.use('/api/profile', profileHandler);
app.use('/api/invites', invitesHandler);
app.use('/api/images', imagesHandler);
app.use('/api/connections', connectionsHandler);
app.use('/api', collectiblesHandler);
app.use('/api/token', tokenHandler);
app.use('/api/files', filesHandler);
app.use('/api/biolinks', biolinksHandler);
app.use('/api/updates', updatesHandler);

app.get('/api/biolink/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await getQuery('users', 'username', username.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await getQuery('profiles', 'user_id', user.id);
    const links = await allQuery('links', 'user_id', user.id);
    const connections = await allQuery('connections', 'user_id', user.id);

    
    try {
      const currentViews = profile?.view_count || 0;
      await runQuery(
        'profiles',
        { user_id: user.id, view_count: currentViews + 1 },
        'update',
        { column: 'user_id', value: user.id }
      );
    } catch (viewErr) {
      console.warn('⚠️ Failed to update view count:', viewErr.message);
    }

    res.status(200).json({
      user: {
        username: user.username,
        display_name: user.display_name
      },
      profile: {
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || '/static/cdn/avatar.png',
        theme: profile?.theme || 'default',
        view_count: (profile?.view_count || 0) + 1
      },
      links: links.map(l => ({
        title: l.title,
        url: l.url,
        order: l.order
      })),
      connections: connections.map(c => ({
        platform: c.platform,
        username: c.username,
        url: c.profile_url
      }))
    });
  } catch (err) {
    console.error('Biolink API error:', err);
    res.status(500).json({ error: 'Failed to fetch biolink data' });
  }
});

app.get('/api/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getQuery('users', 'id', userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await getQuery('profiles', 'user_id', userId);
    const links = await allQuery('links', 'user_id', userId);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name
      },
      profile,
      links
    });
  } catch (err) {
    console.error('User API error:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

const adminRoles = ['owner', 'admin', 'manager', 'mod'];

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !adminRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    const users = await customQuery(`
      SELECT u.id, u.username, u.display_name, u.role, u.created_at, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);

    res.status(200).json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/files', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !adminRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    const files = await customQuery(`
      SELECT f.*, u.username
      FROM files f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT 100
    `);

    res.status(200).json({ files });
  } catch (err) {
    console.error('Admin files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'Glow';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

app.post('/generate_invite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getQuery('users', 'id', userId);
    
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can generate invite codes' });
    }

    let inviteCode;
    let attempts = 0;
    let existing;

    do {
      inviteCode = generateInviteCode();
      existing = await getQuery('invites', 'code', inviteCode);
      attempts++;
    } while (existing && attempts < 20);

    if (existing) {
      console.error('Invite generation: exhausted attempts for unique code');
      return res.status(500).json({ error: 'Failed to generate unique invite code' });
    }

    try {
      await runQuery('invites', {
        code: inviteCode,
        created_by: userId,
        role: 'user',
        max_uses: 1
      });
    } catch (err) {
      console.error('Error storing invite code:', err);
      return res.status(500).json({ error: 'Failed to save invite code' });
    }

    res.status(200).json({ code: inviteCode });
  } catch (err) {
    console.error('Generate invite error:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

app.patch('/api/admin/membership', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user?.role || 'user';
    if (!['owner', 'manager', 'admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { username, expiry, storage_limit } = req.body;
    
    if (!username || !expiry || !storage_limit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const targetUser = await getQuery('users', 'username', username.toLowerCase());
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const expiryDate = new Date(expiry).toISOString();
    
    await runQuery(
      'users',
      {
        file_hosting_enabled: 1,
        file_hosting_expiry: expiryDate,
        storage_limit: storage_limit
      },
      'update',
      { column: 'id', value: targetUser.id }
    );

    res.status(200).json({ 
      success: true, 
      message: `File hosting access granted to ${username}`,
      user: {
        username: targetUser.username,
        file_hosting_enabled: true,
        file_hosting_expiry: expiryDate,
        storage_limit: storage_limit
      }
    });
  } catch (err) {
    console.error('Membership update error:', err);
    res.status(500).json({ error: 'Failed to grant file hosting access', details: err.message });
  }
});

app.post('/api/verify/browser', async (req, res) => {
  try {
    const fingerprint = req.body;
    res.status(200).json({ verified: true });
  } catch (err) {
    res.status(200).json({ verified: true });
  }
});

app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'verify', 'index.html')));

app.post('/api/profile/view/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await getQuery('users', 'username', username.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await getQuery('profiles', 'user_id', user.id);
    if (profile) {
      const currentViews = profile.view_count || 0;
      await runQuery(
        'profiles',
        { user_id: user.id, view_count: currentViews + 1 },
        'update',
        { column: 'user_id', value: user.id }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Profile view error:', err);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

app.get('/api/profile/views', authenticateToken, async (req, res) => {
  try {
    const profile = await getQuery('profiles', 'user_id', req.user.id);
    res.status(200).json({ views: profile?.view_count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get view count' });
  }
});

app.get('/api/bio/settings', authenticateToken, async (req, res) => {
  try {
    const profile = await getQuery('profiles', 'user_id', req.user.id);
    if (profile && profile.bio_settings) {
      res.status(200).json(profile.bio_settings);
    } else {
      res.status(200).json({});
    }
  } catch (err) {
    console.error('Get bio settings error:', err);
    res.status(500).json({ error: 'Failed to get bio settings' });
  }
});

app.post('/api/bio/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    const profile = await getQuery('profiles', 'user_id', req.user.id);
    
    if (profile) {
      await runQuery(
        'profiles',
        { user_id: req.user.id, bio_settings: settings },
        'update',
        { column: 'user_id', value: req.user.id }
      );
    } else {
      await runQuery(
        'profiles',
        { user_id: req.user.id, bio_settings: settings },
        'insert'
      );
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Save bio settings error:', err);
    res.status(500).json({ error: 'Failed to save bio settings' });
  }
});

app.delete('/api/bio/settings', authenticateToken, async (req, res) => {
  try {
    const profile = await getQuery('profiles', 'user_id', req.user.id);
    if (profile) {
      await runQuery(
        'profiles',
        { user_id: req.user.id, bio_settings: {} },
        'update',
        { column: 'user_id', value: req.user.id }
      );
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete bio settings error:', err);
    res.status(500).json({ error: 'Failed to reset bio settings' });
  }
});

// File Report Endpoints
app.get('/api/admin/file-reports/awaiting', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin', 'mod'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    const reports = await customQuery(`
      SELECT * FROM file_reports 
      WHERE status = 'pending' 
      ORDER BY created_at DESC 
      LIMIT 50
    `).catch(() => []);

    res.status(200).json({ reports: reports || [] });
  } catch (err) {
    console.error('Get pending reports error:', err);
    res.status(200).json({ reports: [] });
  }
});

app.get('/api/admin/file-reports/approved', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin', 'mod'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    const reports = await customQuery(`
      SELECT * FROM file_reports 
      WHERE status = 'approved' 
      ORDER BY updated_at DESC 
      LIMIT 50
    `).catch(() => []);

    res.status(200).json({ reports: reports || [] });
  } catch (err) {
    console.error('Get approved reports error:', err);
    res.status(200).json({ reports: [] });
  }
});

app.post('/api/admin/file-reports/approve/:id', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin', 'mod'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    
    await customQuery(`
      UPDATE file_reports 
      SET status = 'approved', updated_at = NOW(), reviewed_by = ? 
      WHERE id = ?
    `, [req.user.id, req.params.id]).catch(() => null);

    res.status(200).json({ success: true, message: 'Report approved' });
  } catch (err) {
    console.error('Approve report error:', err);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

app.post('/api/admin/file-reports/decline/:id', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin', 'mod'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { customQuery } = await import('./lib/db.js');
    
    await customQuery(`
      UPDATE file_reports 
      SET status = 'declined', updated_at = NOW(), reviewed_by = ? 
      WHERE id = ?
    `, [req.user.id, req.params.id]).catch(() => null);

    res.status(200).json({ success: true, message: 'Report declined' });
  } catch (err) {
    console.error('Decline report error:', err);
    res.status(500).json({ error: 'Failed to decline report' });
  }
});

app.patch('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { role } = req.body;
    const roleHierarchy = { user: 0, mod: 1, admin: 2, manager: 3, owner: 4 };
    const userLevel = roleHierarchy[user.role] || 0;
    const targetLevel = roleHierarchy[role] || 0;

    if (userLevel <= targetLevel) {
      return res.status(403).json({ error: 'Cannot change role to equal or higher level' });
    }

    await runQuery(
      'users',
      { id: req.params.id, role },
      'update',
      { column: 'id', value: req.params.id }
    );

    res.status(200).json({ success: true, message: `Role changed to ${role}` });
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({ error: 'Failed to change role' });
  }
});

app.post('/api/admin/users/:id/ban', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { reason } = req.body;
    await runQuery(
      'users',
      { id: req.params.id, is_banned: 1, ban_reason: reason },
      'update',
      { column: 'id', value: req.params.id }
    );

    res.status(200).json({ success: true, message: 'User banned' });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

app.delete('/api/admin/users/:id/ban', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user || !['owner', 'manager', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await runQuery(
      'users',
      { id: req.params.id, is_banned: 0, ban_reason: null },
      'update',
      { column: 'id', value: req.params.id }
    );

    res.status(200).json({ success: true, message: 'User unbanned' });
  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about', 'index.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'pricing', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register', 'index.html')));
app.get('/login/reset', (req, res) => res.sendFile(path.join(__dirname, 'login', 'reset', 'index.html')));
app.get('/login/loading', (req, res) => res.sendFile(path.join(__dirname, 'login', 'loading.html')));
app.get('/dash', authenticateToken, (req, res) => {
  console.log('✅ /dash accessed by authenticated user:', req.user.username);
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

app.get('/dashboard', authenticateToken, (req, res) => {
  console.log('✅ /dashboard accessed by authenticated user:', req.user.username);
  res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});
app.get('/ic', (req, res) => res.sendFile(path.join(__dirname, 'ic', 'index.html')));
app.get('/uploads', (req, res) => res.sendFile(path.join(__dirname, 'static', 'html', 'files-hosting.html')));
app.get('/faq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq.html')));
app.get('/lbfaq', (req, res) => res.sendFile(path.join(__dirname, 'public', 'lbfaq.html')));
app.get('/faq/files', (req, res) => res.sendFile(path.join(__dirname, 'static', 'html', 'faq-files.html')));
app.get('/faq/litterbox', (req, res) => res.sendFile(path.join(__dirname, 'static', 'html', 'faq-litterbox.html')));

app.get('/@:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await getQuery('users', 'username', username.toLowerCase());
        if (!user) {
            return res.status(404).sendFile(path.join(__dirname, '404.html'));
        }
        
        
        try {
            const profile = await getQuery('profiles', 'user_id', user.id);
            const currentViews = profile?.view_count || 0;
            await runQuery(
                'profiles',
                { user_id: user.id, view_count: currentViews + 1 },
                'update',
                { column: 'user_id', value: user.id }
            );
        } catch (viewErr) {
            console.warn('⚠️ Failed to update profile view count:', viewErr.message);
        }
        
        res.sendFile(path.join(__dirname, 'profile', 'index.html'));
    } catch (error) {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
});


app.get('/file/:code', async (req, res) => {
    res.sendFile(path.join(__dirname, 'file', 'index.html'));
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
}

export default app;
