import request from 'supertest';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import app from '../server.js';
import { runQuery } from '../lib/db.js';

const TEST_USER = {
  username: `ci_test_user_${Date.now()}`,
  password: 'TestPassw0rd!'
};

jest.setTimeout(120000);

describe('Presign integration test (live S3/R2 & DB) - no mocks', () => {
  test('Complete presign -> upload -> register flow', async () => {
    const required = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'DATABASE_URL', 'JWT_SECRET'];
    for (const v of required) {
      if (!process.env[v]) {
        throw new Error(`Environment variable ${v} is required for this integration test`);
      }
    }

    const newUser = await runQuery('users', {
      username: TEST_USER.username,
      email: null,
      password_hash: '$2b$12$invalidplaceholderhashxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      display_name: TEST_USER.username,
      role: 'user'
    });

    const userId = newUser.id || newUser.lastInsertRowid;

    try {
      await runQuery('profiles', {
        user_id: userId,
        bio: '',
        avatar_url: '',
        theme: 'default'
      });
    } catch (e) {

    }

    const token = jwt.sign({ id: userId, username: TEST_USER.username, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/images/presign')
      .set('Cookie', `token=${token}`)
      .send({ filename: 'ci-test-blob.txt', contentType: 'text/plain' })
      .expect(200);

    const body = res.body;
    if (!body || !body.signedUrl || !body.publicUrl) throw new Error('Invalid presign response');

    const putRes = await fetch(body.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'ci-presign-test-payload'
    });
    if (!putRes.ok) throw new Error('Failed to PUT to signed url: ' + putRes.status + ' ' + putRes.statusText);

    const registerRes = await request(app)
      .post('/api/images/upload')
      .set('Cookie', `token=${token}`)
      .send({ filename: 'ci-test-blob.txt', url: body.publicUrl, size: 21, mime_type: 'text/plain' })
      .expect(201);

    const image = registerRes.body.image;
    if (!image || !image.id) throw new Error('Image registration failed');

    await request(app)
      .delete(`/api/images/${image.id}`)
      .set('Cookie', `token=${token}`);
  });
});
