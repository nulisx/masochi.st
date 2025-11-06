import crypto from 'crypto';

export function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export function verifyEmail(inputEmail, hashedEmail) {
  return hashEmail(inputEmail) === hashedEmail;
}

export function generateRecoveryCode() {
  return crypto.randomBytes(16).toString('hex');
}
