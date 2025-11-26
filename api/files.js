import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';
import crypto from 'crypto';
import multer from 'multer';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let uploadDir;
if (process.env.VERCEL || process.env.SERVERLESS) {
  uploadDir = path.join(os.tmpdir(), 'glowi_files');
} else {
  uploadDir = path.join(__dirname, '..', 'static', 'files');
}

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.warn('Could not create files dir', e);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
});

const uploadLitterbox = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }
});

const router = express.Router();

const forbiddenExtensions = ['.exe', '.scr', '.cpl', '.jar', '.doc', '.docx', '.docm'];

function generateFileCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function encryptFile(buffer, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv, authTag };
}

function decryptFile(encrypted, key, iv, authTag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const files = await allQuery('files', 'user_id', userId);
    
    const now = new Date();
    const activeFiles = files.filter(f => {
      if (f.expires_at && new Date(f.expires_at) < now) return false;
      return true;
    });
    
    res.status(200).json({ files: activeFiles });
  } catch (err) {
    console.error('Files GET error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (forbiddenExtensions.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'This file type is not allowed' });
    }
    
    const userId = req.user.id;
    const { password, expires_in, temporary } = req.body;
    const isTemporary = temporary === 'true' || temporary === true;
    
    const codeLength = isTemporary ? 16 : 6;
    let fileCode;
    let attempts = 0;
    let existing;
    do {
      fileCode = generateFileCode(codeLength);
      existing = await getQuery('files', 'code', fileCode);
      attempts++;
    } while (existing && attempts < 20);
    
    if (existing) {
      return res.status(500).json({ error: 'Failed to generate unique file code' });
    }

    const encryptionKey = crypto.randomBytes(32);
    const fileBuffer = fs.readFileSync(req.file.path);
    const { encrypted, iv, authTag } = encryptFile(fileBuffer, encryptionKey);
    
    const encryptedPath = req.file.path + '.enc';
    fs.writeFileSync(encryptedPath, encrypted);
    fs.unlinkSync(req.file.path);
    
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, 12);
    }
    
    let expiresAt = null;
    if (expires_in) {
      const hours = parseInt(expires_in);
      if (!isNaN(hours) && hours > 0) {
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }
    }

    const newFile = await runQuery('files', {
      user_id: userId,
      code: fileCode,
      filename: req.file.originalname,
      original_filename: req.file.originalname,
      file_path: encryptedPath,
      file_url: `/file/${fileCode}`,
      file_size: req.file.size,
      stored_path: encryptedPath,
      size: req.file.size,
      mime_type: req.file.mimetype || 'application/octet-stream',
      encryption_key: encryptionKey.toString('hex'),
      encryption_iv: iv.toString('hex'),
      auth_tag: authTag.toString('hex'),
      password_hash: passwordHash,
      expires_at: expiresAt,
      download_count: 0,
      is_public: true,
      is_private: false,
      view_count: 0,
      bandwidth_used: 0
    });

    const fileId = newFile.id || newFile.lastInsertRowid;
    const createdFile = await getQuery('files', 'id', fileId);
    
    const sanitizedFile = {
      id: createdFile.id,
      code: createdFile.code,
      filename: createdFile.filename,
      size: createdFile.size,
      mime_type: createdFile.mime_type,
      password_protected: !!createdFile.password_hash,
      expires_at: createdFile.expires_at,
      download_count: createdFile.download_count,
      created_at: createdFile.created_at
    };

    res.status(201).json({ 
      message: 'File uploaded successfully',
      file: sanitizedFile,
      download_url: `/file/${fileCode}`
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.post('/litterbox', authenticateToken, uploadLitterbox.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (forbiddenExtensions.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'This file type is not allowed' });
    }
    
    const userId = req.user.id;
    const { password, expires_in } = req.body;
    
    let fileCode;
    let attempts = 0;
    let existing;
    do {
      fileCode = generateFileCode(16);
      existing = await getQuery('files', 'code', fileCode);
      attempts++;
    } while (existing && attempts < 20);
    
    if (existing) {
      return res.status(500).json({ error: 'Failed to generate unique file code' });
    }

    const encryptionKey = crypto.randomBytes(32);
    const fileBuffer = fs.readFileSync(req.file.path);
    const { encrypted, iv, authTag } = encryptFile(fileBuffer, encryptionKey);
    
    const encryptedPath = req.file.path + '.enc';
    fs.writeFileSync(encryptedPath, encrypted);
    fs.unlinkSync(req.file.path);
    
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, 12);
    }
    
    const hours = parseInt(expires_in) || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const newFile = await runQuery('files', {
      user_id: userId,
      code: fileCode,
      filename: req.file.originalname,
      original_filename: req.file.originalname,
      file_path: encryptedPath,
      file_url: `/file/${fileCode}`,
      file_size: req.file.size,
      stored_path: encryptedPath,
      size: req.file.size,
      mime_type: req.file.mimetype || 'application/octet-stream',
      encryption_key: encryptionKey.toString('hex'),
      encryption_iv: iv.toString('hex'),
      auth_tag: authTag.toString('hex'),
      password_hash: passwordHash,
      expires_at: expiresAt,
      download_count: 0,
      is_public: true,
      is_private: false,
      is_temporary: true,
      view_count: 0,
      bandwidth_used: 0
    });

    const fileId = newFile.id || newFile.lastInsertRowid;
    const createdFile = await getQuery('files', 'id', fileId);
    
    const sanitizedFile = {
      id: createdFile.id,
      code: createdFile.code,
      filename: createdFile.filename,
      size: createdFile.size,
      mime_type: createdFile.mime_type,
      password_protected: !!createdFile.password_hash,
      expires_at: createdFile.expires_at,
      download_count: createdFile.download_count,
      created_at: createdFile.created_at
    };

    res.status(201).json({ 
      message: 'Temporary file uploaded successfully',
      file: sanitizedFile,
      download_url: `/file/${fileCode}`
    });
  } catch (err) {
    console.error('LitterBox upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/info/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const file = await getQuery('files', 'code', code);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return res.status(410).json({ error: 'File has expired' });
    }
    
    res.status(200).json({
      filename: file.filename,
      size: file.size,
      mime_type: file.mime_type,
      password_protected: !!file.password_hash,
      expires_at: file.expires_at,
      download_count: file.download_count
    });
  } catch (err) {
    console.error('File info error:', err);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

router.post('/download/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.body || {};
    
    const file = await getQuery('files', 'code', code);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      return res.status(410).json({ error: 'File has expired' });
    }
    
    if (file.password_hash) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requires_password: true });
      }
      
      const validPassword = await bcrypt.compare(password, file.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }
    
    if (!fs.existsSync(file.stored_path)) {
      return res.status(404).json({ error: 'File data not found' });
    }
    
    const encrypted = fs.readFileSync(file.stored_path);
    const key = Buffer.from(file.encryption_key, 'hex');
    const iv = Buffer.from(file.encryption_iv, 'hex');
    const authTag = Buffer.from(file.auth_tag, 'hex');
    
    let decrypted;
    try {
      decrypted = decryptFile(encrypted, key, iv, authTag);
    } catch (decryptErr) {
      console.error('Decryption error:', decryptErr);
      return res.status(500).json({ error: 'Failed to decrypt file' });
    }
    
    await runQuery(
      'files',
      { id: file.id, download_count: (file.download_count || 0) + 1 },
      'update',
      { column: 'id', value: file.id }
    );
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Length', decrypted.length);
    res.send(decrypted);
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

router.get('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const file = await getQuery('files', 'code', code);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    res.status(200).json({ 
      file: {
        id: file.id,
        code: file.code,
        filename: file.filename,
        size: file.size,
        mime_type: file.mime_type,
        password_protected: !!file.password_hash,
        expires_at: file.expires_at,
        download_count: file.download_count,
        created_at: file.created_at
      }
    });
  } catch (err) {
    console.error('File GET error:', err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

router.put('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { password, expires_in, remove_password } = req.body;
    
    const file = await getQuery('files', 'code', code);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updates = { id: file.id };
    
    if (remove_password) {
      updates.password_hash = null;
    } else if (password && password.trim()) {
      updates.password_hash = await bcrypt.hash(password, 12);
    }
    
    if (expires_in !== undefined) {
      if (expires_in === null || expires_in === 0) {
        updates.expires_at = null;
      } else {
        const hours = parseInt(expires_in);
        if (!isNaN(hours) && hours > 0) {
          updates.expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }
      }
    }
    
    await runQuery('files', updates, 'update', { column: 'id', value: file.id });
    
    res.status(200).json({ message: 'File updated' });
  } catch (err) {
    console.error('File update error:', err);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

router.delete('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const file = await getQuery('files', 'code', code);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (fs.existsSync(file.stored_path)) {
      fs.unlinkSync(file.stored_path);
    }
    
    await runQuery('files', {}, 'delete', { column: 'id', value: file.id });
    
    res.status(200).json({ message: 'File deleted' });
  } catch (err) {
    console.error('File DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
