import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { allRows, runQuery, getQuery, customQuery } from '../lib/db.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const updates = await customQuery('SELECT * FROM site_updates ORDER BY created_at DESC LIMIT 10');
    res.status(200).json({ updates });
  } catch (err) {
    console.error('Updates GET error:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['owner', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can create updates' });
    }

    const { title, description, details, category } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newUpdate = await runQuery('site_updates', {
      title,
      description: description || '',
      details: details || '',
      category: category || 'general',
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Update created', update: newUpdate });
  } catch (err) {
    console.error('Update POST error:', err);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const adminRoles = ['owner', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can delete updates' });
    }

    const { id } = req.params;
    await runQuery('site_updates', null, 'delete', { column: 'id', value: id });
    res.status(200).json({ message: 'Update deleted' });
  } catch (err) {
    console.error('Update DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

export default router;
