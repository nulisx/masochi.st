import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}
