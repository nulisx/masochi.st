import express from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { runQuery, getQuery, allQuery } from './lib/db.js';

// Import modular API routes
import linksHandler from './api/links.js';
import profileHandler from './api/profile.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve()));

// ---------- Auth middleware ----------
export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const roleHierarchy = { owner: 5, manager: 4, admin: 3, mod: 2, user: 1 };
export const requireRole = (minRole) => (req, res, next) => {
  if (roleHierarchy[req.user.role] < roleHierarchy[minRole])
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};

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

      const existingEmail = await getQuery('users', 'email', email);
      if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await runQuery('users', {
        username,
        email,
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
    const user = await getQuery('users', 'username', username);
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

// ---------- Frontend routes ----------
app.get('/', (req, res) => res.sendFile(path.join(path.resolve(), 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(path.resolve(), 'login', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(path.resolve(), 'register', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(path.resolve(), 'dashboard', 'index.html')));
app.get('/account', (req, res) => res.sendFile(path.join(path.resolve(), 'account', 'account.html')));
app.get('/collectibles', (req, res) => res.sendFile(path.join(path.resolve(), 'collectibles', 'index.html')));
app.get('/integrations', (req, res) => res.sendFile(path.join(path.resolve(), 'integrations', 'index.html')));
app.get('/images', (req, res) => res.sendFile(path.join(path.resolve(), 'images', 'index.html')));

app.use((req, res) => res.status(404).sendFile(path.join(path.resolve(), '404.html')));

// ---------- Start server ----------
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));
