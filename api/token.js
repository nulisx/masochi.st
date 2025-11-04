import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, JWT_SECRET } from '../lib/middleware.js';

const router = express.Router();

router.post('/exchange', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const newToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Token exchanged successfully',
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

export default router;
