import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { authenticateToken } from '../lib/middleware.js';
import { getQuery, runQuery, allQuery } from '../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarDir = path.join(__dirname, '..', 'static', 'cdn', 'avatars');
try {
  fs.mkdirSync(avatarDir, { recursive: true });
} catch (e) {
  console.warn('Could not create avatars dir', e);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const unique = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getQuery('profiles', 'user_id', userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    return res.status(200).json({ profile });
  } catch (err) {
    console.error('Profile GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, avatar_url, theme, custom_css, display_name } = req.body;

    const profile = await getQuery('profiles', 'user_id', userId);
    if (!profile) {
      const insert = await runQuery('profiles', {
        user_id: userId,
        bio: bio || null,
        avatar_url: avatar_url || null,
        theme: theme || 'default',
        custom_css: custom_css || null
      });
      const created = await getQuery('profiles', 'id', insert.id || insert.lastInsertRowid);

      if (display_name) {
        await runQuery('users', { display_name }, 'update', { column: 'id', value: userId });
      }
      return res.status(201).json({ message: 'Profile created', profile: created });
    }

    await runQuery(
      'profiles',
      {
        bio: bio ?? profile.bio,
        avatar_url: avatar_url ?? profile.avatar_url,
        theme: theme ?? profile.theme,
        custom_css: custom_css ?? profile.custom_css
      },
      'update',
      { column: 'user_id', value: userId }
    );

    if (display_name) {
      await runQuery('users', { display_name }, 'update', { column: 'id', value: userId });
    }

    const updatedProfile = await getQuery('profiles', 'user_id', userId);
    return res.status(200).json({ message: 'Profile updated', profile: updatedProfile });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return res.status(500).json({ error: 'Profile update failed' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, avatar_url, theme, custom_css, display_name } = req.body;

    const profile = await getQuery('profiles', 'user_id', userId);
    if (!profile) {
      const insert = await runQuery('profiles', {
        user_id: userId,
        bio: bio || null,
        avatar_url: avatar_url || null,
        theme: theme || 'default',
        custom_css: custom_css || null
      });
      const created = await getQuery('profiles', 'id', insert.id || insert.lastInsertRowid);

      if (display_name) {
        await runQuery('users', { display_name }, 'update', { column: 'id', value: userId });
      }
      return res.status(201).json({ message: 'Profile created', profile: created });
    }

    await runQuery(
      'profiles',
      {
        bio: bio ?? profile.bio,
        avatar_url: avatar_url ?? profile.avatar_url,
        theme: theme ?? profile.theme,
        custom_css: custom_css ?? profile.custom_css
      },
      'update',
      { column: 'user_id', value: userId }
    );

    if (display_name) {
      await runQuery('users', { display_name }, 'update', { column: 'id', value: userId });
    }

    const updatedProfile = await getQuery('profiles', 'user_id', userId);
    return res.status(200).json({ message: 'Profile updated', profile: updatedProfile });
  } catch (err) {
    console.error('Profile POST error:', err);
    return res.status(500).json({ error: 'Profile update failed' });
  }
});

router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarUrl = `/static/cdn/avatars/${req.file.filename}`;

    const profile = await getQuery('profiles', 'user_id', userId);
    if (profile) {
      await runQuery(
        'profiles',
        { avatar_url: avatarUrl },
        'update',
        { column: 'user_id', value: userId }
      );
    } else {
      await runQuery('profiles', {
        user_id: userId,
        avatar_url: avatarUrl,
        bio: '',
        theme: 'default'
      });
    }

    return res.status(200).json({ 
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

router.put('/username', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    if (!username || username.length < 1 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 1-20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    const usernameLower = username.toLowerCase();
    
    const existingUser = await getQuery('users', 'username', usernameLower);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    await runQuery('users', { username: usernameLower }, 'update', { column: 'id', value: userId });

    return res.status(200).json({ 
      message: 'Username updated successfully',
      username: usernameLower
    });
  } catch (err) {
    console.error('Username update error:', err);
    return res.status(500).json({ error: 'Failed to update username' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await getQuery('users', 'id', userId);
    const files = await allQuery('files', 'user_id', userId);
    
    let totalStorage = 0;
    files.forEach(file => {
      totalStorage += file.size || file.file_size || 0;
    });

    const isPremium = user.license_status === 'active' || user.role === 'owner' || user.role === 'admin';
    
    return res.status(200).json({
      uid: user.id,
      storage_used: totalStorage,
      storage_limit: isPremium ? 10 * 1024 * 1024 * 1024 : 1 * 1024 * 1024 * 1024,
      license_status: isPremium ? 'Active' : 'Inactive',
      files_count: files.length
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
