import { getQuery, allQuery, runQuery } from '../../lib/db';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  const user = await verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  try {
    if (req.method === 'GET') {
      // Get all links for user
      const links = await allQuery('links', 'user_id', user.id);
      return res.status(200).json({ links });
    }

    if (req.method === 'POST') {
      // Create a new link
      const { title, url, icon, position } = req.body;
      if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

      const newLink = await runQuery('links', {
        user_id: user.id,
        title,
        url,
        icon: icon || null,
        position: position || null
      });

      return res.status(201).json({ message: 'Link created', link: newLink });
    }

    if (req.method === 'PUT') {
      // Update an existing link
      const { id, title, url, icon, position } = req.body;
      if (!id || (!title && !url && !icon && position === undefined)) {
        return res.status(400).json({ error: 'Invalid update data' });
      }

      const existingLink = await getQuery('links', 'id', id);
      if (!existingLink || existingLink.user_id !== user.id) {
        return res.status(404).json({ error: 'Link not found or unauthorized' });
      }

      const updatedLink = await runQuery(
        'links',
        { id, title, url, icon, position },
        'update'
      );

      return res.status(200).json({ message: 'Link updated', link: updatedLink });
    }

    if (req.method === 'DELETE') {
      // Delete a link
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Link ID required' });

      const existingLink = await getQuery('links', 'id', id);
      if (!existingLink || existingLink.user_id !== user.id) {
        return res.status(404).json({ error: 'Link not found or unauthorized' });
      }

      await runQuery('links', { id }, 'delete');
      return res.status(200).json({ message: 'Link deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Links API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
