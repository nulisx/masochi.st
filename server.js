import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { body, validationResult } from 'express-validator';
import { runQuery, getQuery, allQuery } from './lib/db.js';
import { authenticateToken, JWT_SECRET } from './lib/middleware.js';
import { hashEmail, generateRecoveryCode } from './lib/crypto-utils.js';
import { rateLimit } from './lib/rate-limit.js';
import crypto from 'crypto';

import linksHandler from './api/links.js';
import profileHandler from './api/profile.js';
import invitesHandler from './api/invites.js';
import imagesHandler from './api/images.js';
import connectionsHandler from './api/connections.js';
import collectiblesHandler from './api/collectibles.js';
import tokenHandler from './api/token.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/assets', express.static(path.join(__dirname, 'static', 'css', 'dash', 'assets')));
app.use('/dash/app', express.static(path.join(__dirname, 'dash-app')));

app.post(
  '/api/auth/register',
  [
    body('username').isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
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

app.post('/api/auth/login', async (req, res) => {
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

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    );
    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    if (err.message && err.message.includes('Access denied')) {
      return res.status(500).json({ error: 'Database access denied. Check DB credentials and allowed hosts.' });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('users', 'id', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.status(200).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        display_name: user.display_name,
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to retrieve user information' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; Path=/; Max-Age=0`
  );
  res.status(200).json({ message: 'Logged out successfully' });
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

app.use('/api/links', linksHandler);
app.use('/api/profile', profileHandler);
app.use('/api/invites', invitesHandler);
app.use('/api/images', imagesHandler);
app.use('/api/connections', connectionsHandler);
app.use('/api', collectiblesHandler);
app.use('/api/token', tokenHandler);

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

function generateInviteCode() {

  const buf = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `INV-${buf}`;
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

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about', 'index.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'pricing', 'index.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register', 'index.html')));
app.get('/login/reset', (req, res) => res.sendFile(path.join(__dirname, 'login', 'reset', 'index.html')));
app.get('/dash', (req, res) => res.sendFile(path.join(__dirname, 'dash', 'index.html')));
app.get('/ic', (req, res) => res.sendFile(path.join(__dirname, 'ic', 'index.html')));

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
}

export default app;
