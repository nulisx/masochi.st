import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let JWT_SECRET;

const secretFile = path.join(process.cwd(), '.jwt-secret');

if (!process.env.JWT_SECRET) {
  try {
    if (fs.existsSync(secretFile)) {
      JWT_SECRET = fs.readFileSync(secretFile, 'utf-8').trim();
      console.log('✅ JWT secret loaded from file');
    } else {
      JWT_SECRET = crypto.randomBytes(64).toString('hex');
      fs.writeFileSync(secretFile, JWT_SECRET, 'utf-8');
      console.log('✅ JWT secret generated and saved');
    }
  } catch (err) {
    console.warn('⚠️ Could not read/write JWT secret file:', err.message);
    JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.log('✅ JWT secret generated (read-only filesystem)');
  }
} else {
  JWT_SECRET = process.env.JWT_SECRET;
  console.log('✅ JWT secret loaded from environment variable');
}

export { JWT_SECRET };

export const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;
  console.log('🔐 authenticateToken middleware | Cookies:', req.cookies ? Object.keys(req.cookies) : 'none', '| Token present:', !!token);
  
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
      console.log('🔐 Token found in Authorization header');
    }
  }
  
  if (!token) {
    console.log('❌ No token found in cookies or headers');
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('✅ Token verified for user:', user.username);
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
