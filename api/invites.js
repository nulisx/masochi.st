import express from 'express';
import { authenticateToken, requireRole } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const invites = await allQuery('invites', 'id', '>=0');
    res.status(200).json({ invites });
  } catch (err) {
    console.error('Invites GET error:', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  const { code, role = 'user', max_uses = 1, expires_at = null } = req.body;
  if (!code) return res.status(400).json({ error: 'Invite code is required' });

  try {
    const existing = await getQuery('invites', 'code', code);
    if (existing) return res.status(400).json({ error: 'Invite code already exists' });

    const newInvite = await runQuery('invites', {
      code,
      created_by: req.user.id,
      role,
      max_uses,
      uses_count: 0,
      used: 0,
      expires_at
    });

    const inviteId = newInvite.id || newInvite.lastInsertRowid;
    const createdInvite = await getQuery('invites', 'id', inviteId);
    res.status(201).json({ message: 'Invite created', invite: createdInvite });
  } catch (err) {
    console.error('Invites POST error:', err);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

router.put('/:code', authenticateToken, requireRole('admin'), async (req, res) => {
  const { code } = req.params;
  const { role, max_uses, expires_at } = req.body;

  try {
    const invite = await getQuery('invites', 'code', code);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    await runQuery(
      'invites',
      { role: role ?? invite.role, max_uses: max_uses ?? invite.max_uses, expires_at: expires_at ?? invite.expires_at },
      'update',
      { column: 'code', value: code }
    );

    const updatedInvite = await getQuery('invites', 'code', code);
    res.status(200).json({ message: 'Invite updated', invite: updatedInvite });
  } catch (err) {
    console.error('Invites PUT error:', err);
    res.status(500).json({ error: 'Failed to update invite' });
  }
});

router.delete('/:code', authenticateToken, requireRole('admin'), async (req, res) => {
  const { code } = req.params;

  try {
    const invite = await getQuery('invites', 'code', code);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    await runQuery('invites', {}, 'delete', { column: 'code', value: code });
    res.status(200).json({ message: 'Invite deleted' });
  } catch (err) {
    console.error('Invites DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete invite' });
  }
});

export default router;
