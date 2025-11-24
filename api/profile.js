import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { getQuery, runQuery } from '../lib/db.js';

const router = express.Router();

router.all('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

    try {
      if (req.method === 'GET') {
        const profile = await getQuery('profiles', 'user_id', userId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        return res.status(200).json({ profile });
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        // Allow POST as an upsert for clients that prefer POST
        const { bio, avatar_url, theme, custom_css, display_name, socials } = req.body;

        // Try to find existing profile
        const profile = await getQuery('profiles', 'user_id', userId);
        if (!profile) {
          // create a new profile row
          const insert = await runQuery('profiles', {
            user_id: userId,
            bio: bio || null,
            avatar_url: avatar_url || null,
            theme: theme || 'default',
            custom_css: custom_css || null
          });
          const created = await getQuery('profiles', 'id', insert.id || insert.lastInsertRowid);
          // also store display_name on users table if provided
          if (display_name) {
            await runQuery('users', { display_name }, 'update', { column: 'id', value: userId });
          }
          return res.status(201).json({ message: 'Profile created', profile: created });
        }

        // update existing profile
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
      }

      return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Profile API error:', err);
    return res.status(500).json({ error: 'Profile operation failed' });
  }
});

export default router;
