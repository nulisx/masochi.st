import express from 'express';
import { authenticateToken, requireRole } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';

const router = express.Router();

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'Glow';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function canCreateRole(userRole, targetRole) {
  const roleHierarchy = { user: 0, mod: 1, admin: 2, manager: 3, owner: 4 };
  const userLevel = roleHierarchy[userRole] || 0;
  const targetLevel = roleHierarchy[targetRole] || 0;
  
  if (userRole === 'owner') return true;
  if (userRole === 'manager') return ['admin', 'mod'].includes(targetRole);
  if (userRole === 'admin') return targetRole === 'mod';
  return false;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user?.role || 'user';
    if (!['owner', 'manager', 'admin', 'mod'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const invites = await allQuery('invites', 'id', '>=0');
    res.status(200).json({ invites });
  } catch (err) {
    console.error('Invites GET error:', err);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user?.role || 'user';
    const { role = 'user' } = req.body;

    if (!['owner', 'manager', 'admin', 'mod'].includes(userRole)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!canCreateRole(userRole, role)) {
      return res.status(403).json({ error: `You cannot create ${role} invite codes` });
    }

    let code;
    let attempts = 0;
    let existing = true;
    
    while (existing && attempts < 10) {
      code = generateInviteCode();
      existing = await getQuery('invites', 'code', code);
      attempts++;
    }

    if (existing) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    const newInvite = await runQuery('invites', {
      code,
      created_by: req.user.id,
      role,
      max_uses: 1,
      uses_count: 0,
      used: 0,
      expires_at: null
    });

    const inviteId = newInvite.id || newInvite.lastInsertRowid;
    const createdInvite = await getQuery('invites', 'id', inviteId);
    res.status(201).json({ message: 'Invite created', invite: createdInvite });
  } catch (err) {
    console.error('Invites generate error:', err);
    res.status(500).json({ error: 'Failed to generate invite' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { code, role = 'user', max_uses = 1, expires_at = null } = req.body;
  if (!code) return res.status(400).json({ error: 'Invite code is required' });

  try {
    const userRole = req.user?.role || 'user';
    if (!canCreateRole(userRole, role)) {
      return res.status(403).json({ error: `You cannot create ${role} invite codes` });
    }

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

router.put('/:code', authenticateToken, async (req, res) => {
  const { code } = req.params;
  const { role, max_uses, expires_at } = req.body;

  try {
    const userRole = req.user?.role || 'user';
    const invite = await getQuery('invites', 'code', code);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    if (invite.created_by !== req.user.id && userRole !== 'owner') {
      return res.status(403).json({ error: 'Cannot modify invite' });
    }

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

router.delete('/:code', authenticateToken, async (req, res) => {
  const { code } = req.params;

  try {
    const userRole = req.user?.role || 'user';
    const invite = await getQuery('invites', 'code', code);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    if (invite.created_by !== req.user.id && userRole !== 'owner') {
      return res.status(403).json({ error: 'Cannot delete invite' });
    }

    await runQuery('invites', {}, 'delete', { column: 'code', value: code });
    res.status(200).json({ message: 'Invite deleted' });
  } catch (err) {
    console.error('Invites DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete invite' });
  }
});

export default router;
