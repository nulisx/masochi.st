import express from 'express';
import { authenticateToken } from '../lib/middleware.js';
import { runQuery, getQuery, allQuery } from '../lib/db.js';
import crypto from 'crypto';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

// On serverless platforms (Vercel) writing into the project directory
// can fail or be ephemeral. Use the system temp directory there and
// fall back to `static/uploads` for local/dev environments.
let uploadDir;
if (process.env.VERCEL || process.env.SERVERLESS) {
  uploadDir = path.join(os.tmpdir(), 'glowi_uploads');
} else {
  uploadDir = path.join(__dirname, '..', 'static', 'uploads');
}

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.warn('Could not create uploads dir', e);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

const s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
const s3Config = { region: s3Region };
if (process.env.S3_ENDPOINT) s3Config.endpoint = process.env.S3_ENDPOINT;
if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  };
}
const s3Client = new S3Client(s3Config);

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const images = await allQuery('images', 'user_id', userId);
    res.status(200).json({ images });
  } catch (err) {
    console.error('Images GET error:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filename, url, size, mime_type } = req.body;

    if (!filename || !url) {
      return res.status(400).json({ error: 'Filename and URL are required' });
    }

    const newImage = await runQuery('images', {
      user_id: userId,
      filename,
      url,
      size: size || null,
      mime_type: mime_type || 'image/png'
    });

    const imageId = newImage.id || newImage.lastInsertRowid;
    const createdImage = await getQuery('images', 'id', imageId);

    res.status(201).json({ message: 'Image uploaded', image: createdImage });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/upload-file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user.id;
    const filename = req.file.originalname;
    // Prefer the public static path so existing front-end expects the same
    // value. Note: on serverless this file may not be publicly served —
    // encourage using S3 presigned uploads in production.
    const urlPath = `/static/uploads/${req.file.filename}`;
    const size = req.file.size;
    const mime_type = req.file.mimetype || 'application/octet-stream';

    const newImage = await runQuery('images', {
      user_id: userId,
      filename,
      url: urlPath,
      size,
      mime_type
    });

    const imageId = newImage.id || newImage.lastInsertRowid;
    const createdImage = await getQuery('images', 'id', imageId);

    res.status(201).json({ message: 'File uploaded', image: createdImage });
  } catch (err) {
    console.error('Multipart upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.post('/presign', authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType are required' });

    const bucket = process.env.S3_BUCKET;
    if (!bucket) return res.status(500).json({ error: 'S3_BUCKET not configured on server' });

    const ext = path.extname(filename) || '';
    const key = `user-${req.user.id}/${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`;

    const putParams = {
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    };

    const command = new PutObjectCommand(putParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    let publicUrl;
    if (process.env.S3_ENDPOINT) {

      const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
      publicUrl = `${endpoint}/${bucket}/${key}`;
    } else {
      publicUrl = `https://${bucket}.s3.${s3Region}.amazonaws.com/${key}`;
    }

    res.status(200).json({ signedUrl, method: 'PUT', publicUrl, key });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Failed to generate presigned url' });
  }
});

router.get('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await getQuery('images', 'id', imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.status(200).json({ image });
  } catch (err) {
    console.error('Image GET error:', err);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await getQuery('images', 'id', imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await runQuery('images', {}, 'delete', { column: 'id', value: imageId });
    res.status(200).json({ message: 'Image deleted' });
  } catch (err) {
    console.error('Image DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
