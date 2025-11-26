import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await allQuery('connections', 'user_id', userId);
    res.status(200).json({ connections });
  } catch (err) {
    console.error('Connections GET error:', err);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, username, profile_url } = req.body;

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    const newConnection = await runQuery('connections', {
      user_id: userId,
      platform,
      username: username || null,
      profile_url: profile_url || null
    });

    const connectionId = newConnection.id || newConnection.lastInsertRowid;
    const createdConnection = await getQuery('connections', 'id', connectionId);

    res.status(201).json({ message: 'Connection created', connection: createdConnection });
  } catch (err) {
    console.error('Connection POST error:', err);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.get('/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = await getQuery('connections', 'id', connectionId);

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ connection });
  } catch (err) {
    console.error('Connection GET error:', err);
    res.status(500).json({ error: 'Failed to fetch connection' });
  }
});

router.put('/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { platform, username, profile_url } = req.body;

    const isNumeric = /^\d+$/.test(connectionId);
    let connection;
    
    if (isNumeric) {
      connection = await getQuery('connections', 'id', parseInt(connectionId));
    } else {
      const connections = await allQuery('connections', 'user_id', req.user.id);
      connection = connections.find(c => c.platform === connectionId);
    }

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runQuery(
      'connections',
      {
        platform: platform ?? connection.platform,
        username: username ?? connection.username,
        profile_url: profile_url ?? connection.profile_url
      },
      'update',
      { column: 'id', value: connection.id }
    );

    const updatedConnection = await getQuery('connections', 'id', connection.id);
    res.status(200).json({ message: 'Connection updated', connection: updatedConnection });
  } catch (err) {
    console.error('Connection PUT error:', err);
    res.status(500).json({ error: 'Failed to update connection' });
  }
});

router.delete('/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    const isNumeric = /^\d+$/.test(connectionId);
    let connection;
    
    if (isNumeric) {
      connection = await getQuery('connections', 'id', parseInt(connectionId));
    } else {
      const connections = await allQuery('connections', 'user_id', req.user.id);
      connection = connections.find(c => c.platform === connectionId);
    }

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runQuery('connections', {}, 'delete', { column: 'id', value: connection.id });
    res.status(200).json({ message: 'Connection deleted' });
  } catch (err) {
    console.error('Connection DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

export default router;
