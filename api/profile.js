import { getQuery, allQuery, runQuery } from '../../lib/db';
import { verifyToken } from '../../lib/auth'; // helper to decode JWT

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  const user = await verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  if (req.method === 'GET') {
    const profile = await getQuery('profiles', 'user_id', user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const links = await allQuery('links', 'user_id', user.id);
    res.status(200).json({ profile, links });
  } else if (req.method === 'PUT') {
    const { bio, avatar_url, theme, custom_css } = req.body;
    try {
      await runQuery('profiles', {
        user_id: user.id,
        bio,
        avatar_url,
        theme,
        custom_css
      }, 'update'); // Use 'update' mode in runQuery
      res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
