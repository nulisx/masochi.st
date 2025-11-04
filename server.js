import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { body, validationResult } from 'express-validator';
import { runQuery, getQuery, allQuery } from './lib/db.js';
import { authenticateToken, JWT_SECRET } from './lib/middleware.js';
import { hashEmail } from './lib/crypto-utils.js';

// Import modular API routes
import linksHandler from './api/links.js';
import profileHandler from './api/profile.js';
import invitesHandler from './api/invites.js';
import imagesHandler from './api/images.js';
import connectionsHandler from './api/connections.js';
import collectiblesHandler from './api/collectibles.js';
import tokenHandler from './api/token.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve()));

// ---------- Auth routes ----------

// Register
app.post(
  '/api/auth/register',
  [
    body('username').isLength({ min: 1, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail(),
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

      const existingUser = await getQuery('users', 'username', username);
      if (existingUser) return res.status(400).json({ error: 'Username already exists' });

      const emailHash = hashEmail(email);
      const existingEmail = await getQuery('users', 'email', emailHash);
      if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await runQuery('users', {
        username,
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

      res.status(200).json({ message: 'Registration successful', userId });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed due to server error' });
    }
  }
);

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await getQuery('users', 'username', username);
    
    if (!user && username.includes('@')) {
      const emailHash = hashEmail(username);
      user = await getQuery('users', 'email', emailHash);
    }
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.setHeader(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    );
    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  res.setHeader(
    'Set-Cookie',
    `token=; HttpOnly; Path=/; Max-Age=0`
  );
  res.status(200).json({ message: 'Logged out successfully' });
});

// ---------- Modular API routes ----------
app.use('/api/links', linksHandler);
app.use('/api/profile', profileHandler);
app.use('/api/invites', invitesHandler);
app.use('/api/images', imagesHandler);
app.use('/api/connections', connectionsHandler);
app.use('/api', collectiblesHandler);
app.use('/api/token', tokenHandler);

// User profile API endpoint for public access
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

// Invite code generation endpoint (for ic.html page)
app.post('/generate_invite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getQuery('users', 'id', userId);
    
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can generate invite codes' });
    }

    const crypto = await import('crypto');
    const inviteCode = crypto.default.randomBytes(4).toString('hex');

    await runQuery('invites', {
      code: inviteCode,
      created_by: userId,
      role: 'user',
      max_uses: 1
    });

    res.status(200).json({ code: inviteCode });
  } catch (err) {
    console.error('Generate invite error:', err);
    res.status(500).json({ error: 'Failed to generate invite code' });
  }
});

// ---------- Frontend routes ----------
app.get('/', (req, res) => res.sendFile(path.join(path.resolve(), 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(path.resolve(), 'login', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(path.resolve(), 'register', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(path.resolve(), 'dashboard', 'index.html')));
app.get('/account', (req, res) => res.sendFile(path.join(path.resolve(), 'account', 'account.html')));
app.get('/collectibles', (req, res) => res.sendFile(path.join(path.resolve(), 'collectibles', 'index.html')));
app.get('/integrations', (req, res) => res.sendFile(path.join(path.resolve(), 'integrations', 'index.html')));
app.get('/images', (req, res) => res.sendFile(path.join(path.resolve(), 'images', 'index.html')));
app.get('/ic', (req, res) => res.sendFile(path.join(path.resolve(), 'ic', 'ic.html')));

// 404 fallback
app.use((req, res) => res.status(404).sendFile(path.join(path.resolve(), '404.html')));

// ---------- Start server ----------
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
