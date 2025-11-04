import bcrypt from 'bcrypt';
import { getQuery, runQuery } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, email, password, inviteCode } = req.body;

  // ----------------- BASIC VALIDATION -----------------
  if (!username || !email || !password || !inviteCode) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (username.length > 20 || username.length < 1 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // ----------------- VALIDATE INVITE -----------------
    const invite = await getQuery('invites', 'code', inviteCode);
    if (!invite || invite.used || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
      return res.status(400).json({ error: 'Invalid or expired invite code' });
    }

    // ----------------- CHECK USER EXISTENCE -----------------
    const existingUser = await getQuery('users', 'username', username);
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const existingEmail = await getQuery('users', 'email', email);
    if (existingEmail) return res.status(400).json({ error: 'Email already exists' });

    // ----------------- HASH PASSWORD -----------------
    const passwordHash = await bcrypt.hash(password, 12);

    // ----------------- CREATE USER -----------------
    const newUser = await runQuery('users', {
      username,
      email,
      password_hash: passwordHash,
      display_name: username,
      role: invite.role
    });

    const userId = newUser.id || newUser.lastInsertRowid;

    // ----------------- CREATE PROFILE -----------------
    await runQuery('profiles', {
      user_id: userId,
      bio: '',
      avatar_url: '',
      theme: 'default',
      custom_css: ''
    });

    // ----------------- UPDATE INVITE USAGE -----------------
    const newUsesCount = (invite.uses_count || 0) + 1;
    const isFullyUsed = newUsesCount >= invite.max_uses ? 1 : 0;

    await runQuery('invites', {
      id: invite.id,
      uses_count: newUsesCount,
      used: isFullyUsed,
      used_by: userId,
      used_at: new Date().toISOString()
    }, 'update', { column: 'id', value: invite.id });

    res.status(200).json({ message: 'Registration successful', userId });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed due to server error' });
  }
}
