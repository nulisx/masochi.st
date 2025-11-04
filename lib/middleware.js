import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const roleHierarchy = { owner: 5, manager: 4, admin: 3, mod: 2, user: 1 };
export const requireRole = (minRole) => (req, res, next) => {
  if (roleHierarchy[req.user.role] < roleHierarchy[minRole])
    return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};
