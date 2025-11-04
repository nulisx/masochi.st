import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const isProduction = process.env.NODE_ENV === 'production';

let db;
if (isProduction) {
    db = createClient(
        'https://zngfwjhxqrgoikvmwtfx.supabase.co',
        process.env.SUPABASE_KEY
    );
} else {
    db = new Database('database.db');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { username, password } = req.body;

    try {
        let user;
        if (isProduction) {
            const { data, error } = await db.from('users').select('*').eq('username', username).single();
            if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
            user = data;
        } else {
            user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
            httpOnly: true,
            path: '/',
            maxAge: 7 * 24 * 60 * 60
        }));

        res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
}
