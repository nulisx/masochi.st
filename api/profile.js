import { authenticateToken } from '../../lib/middleware';
import { getQuery, runQuery } from '../../lib/db';

export default async function handler(req, res) {
  await authenticateToken(req, res, async () => {
    const userId = req.user.id;

    try {
      // ----------------- GET PROFILE -----------------
      if (req.method === 'GET') {
        const profile = await getQuery('profiles', 'user_id', userId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        return res.status(200).json({ profile });
      }

      // ----------------- UPDATE PROFILE -----------------
      if (req.method === 'PUT') {
        const { bio, avatar_url, theme, custom_css } = req.body;

        const profile = await getQuery('profiles', 'user_id', userId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

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

        const updatedProfile = await getQuery('profiles', 'user_id', userId);
        return res.status(200).json({ message: 'Profile updated', profile: updatedProfile });
      }

      // ----------------- METHOD NOT ALLOWED -----------------
      return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
      console.error('Profile API error:', err);
      return res.status(500).json({ error: 'Profile operation failed' });
    }
  });
}
