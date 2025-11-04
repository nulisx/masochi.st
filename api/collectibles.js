import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';

const router = express.Router();

router.get('/:userId/collectibles', async (req, res) => {
  try {
    const { userId } = req.params;
    const collectibles = await allQuery('collectibles', 'user_id', userId);
    res.status(200).json({ collectibles });
  } catch (err) {
    console.error('Collectibles GET error:', err);
    res.status(500).json({ error: 'Failed to fetch collectibles' });
  }
});

router.post('/:userId/collectibles', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, description, image_url, rarity } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newCollectible = await runQuery('collectibles', {
      user_id: userId,
      name,
      description: description || null,
      image_url: image_url || null,
      rarity: rarity || 'common'
    });

    const collectibleId = newCollectible.id || newCollectible.lastInsertRowid;
    const createdCollectible = await getQuery('collectibles', 'id', collectibleId);

    res.status(201).json({ message: 'Collectible claimed', collectible: createdCollectible });
  } catch (err) {
    console.error('Collectible POST error:', err);
    res.status(500).json({ error: 'Failed to claim collectible' });
  }
});

router.get('/:userId/collectibles/:collectibleId', async (req, res) => {
  try {
    const { collectibleId } = req.params;
    const collectible = await getQuery('collectibles', 'id', collectibleId);

    if (!collectible) {
      return res.status(404).json({ error: 'Collectible not found' });
    }

    res.status(200).json({ collectible });
  } catch (err) {
    console.error('Collectible GET error:', err);
    res.status(500).json({ error: 'Failed to fetch collectible' });
  }
});

router.delete('/:userId/collectibles/:collectibleId', authenticateToken, async (req, res) => {
  try {
    const { userId, collectibleId } = req.params;

    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const collectible = await getQuery('collectibles', 'id', collectibleId);

    if (!collectible) {
      return res.status(404).json({ error: 'Collectible not found' });
    }

    if (collectible.user_id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runQuery('collectibles', {}, 'delete', { column: 'id', value: collectibleId });
    res.status(200).json({ message: 'Collectible deleted' });
  } catch (err) {
    console.error('Collectible DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete collectible' });
  }
});

export default router;
