import { authenticateToken } from '../../lib/middleware';
import { runQuery, getQuery, allQuery } from '../../lib/db';

export default async function handler(req, res) {
  // Protect all /links routes
  await authenticateToken(req, res, async () => {
    const userId = req.user.id;

    try {
      // ----------------- GET LINKS -----------------
      if (req.method === 'GET') {
        const links = await allQuery('links', 'user_id', userId);
        return res.status(200).json({ links });
      }

      // ----------------- CREATE LINK -----------------
      if (req.method === 'POST') {
        const { title, url, icon, position } = req.body;
        if (!title || !url)
          return res.status(400).json({ error: 'Title and URL are required' });

        const newLink = await runQuery('links', {
          user_id: userId,
          title,
          url,
          icon: icon || null,
          position: position || null
        });

        // Supabase returns id in newLink.id, SQLite returns lastInsertRowid
        const linkId = newLink.id || newLink.lastInsertRowid;
        const createdLink = await getQuery('links', 'id', linkId);

        return res.status(201).json({ message: 'Link created', link: createdLink });
      }

      // ----------------- UPDATE LINK -----------------
      if (req.method === 'PUT') {
        const { id, title, url, icon, position } = req.body;
        if (!id) return res.status(400).json({ error: 'Link ID is required' });

        const link = await getQuery('links', 'id', id);
        if (!link || link.user_id !== userId)
          return res.status(403).json({ error: 'Not authorized' });

        await runQuery(
          'links',
          { title, url, icon, position },
          'update',
          { column: 'id', value: id }
        );

        const updatedLink = await getQuery('links', 'id', id);
        return res.status(200).json({ message: 'Link updated', link: updatedLink });
      }

      // ----------------- DELETE LINK -----------------
      if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Link ID is required' });

        const link = await getQuery('links', 'id', id);
        if (!link || link.user_id !== userId)
          return res.status(403).json({ error: 'Not authorized' });

        await runQuery('links', {}, 'delete', { column: 'id', value: id });
        return res.status(200).json({ message: 'Link deleted' });
      }

      // ----------------- METHOD NOT ALLOWED -----------------
      return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      console.error('Links API error:', err);
      return res.status(500).json({ error: 'Links operation failed' });
    }
  });
}
