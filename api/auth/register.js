import { runQuery, getQuery } from '../../lib/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { username, password } = req.body;
    // Use runQuery/getQuery here
}
