import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await allQuery('images', 'user_id', userId);
    res.status(200).json({ images });
  } catch (err) {
    console.error('Images GET error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename, url, size, mime_type } = req.body;

    if (!filename || !url) {
      return res.status(400).json({ error: 'Filename and URL are required' });
    }

    const newImage = await runQuery('images', {
      user_id: userId,
      filename,
      url,
      size: size || null,
      mime_type: mime_type || 'image/png'
    });

    const imageId = newImage.id || newImage.lastInsertRowid;
    const createdImage = await getQuery('images', 'id', imageId);

    res.status(201).json({ message: 'Image uploaded', image: createdImage });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.get('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await getQuery('images', 'id', imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ image });
  } catch (err) {
    console.error('Image GET error:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await getQuery('images', 'id', imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runQuery('images', {}, 'delete', { column: 'id', value: imageId });
    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Image DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
