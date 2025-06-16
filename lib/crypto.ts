import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.GOVEE_API_KEY_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('GOVEE_API_KEY_ENCRYPTION_KEY is not set in environment');
}
const KEY = Buffer.from(ENCRYPTION_KEY, 'base64'); // 32 bytes for AES-256
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store iv + tag + encrypted data (all base64)
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

export function decrypt(data: string): string {
  const [ivB64, tagB64, encryptedB64] = data.split(':');
  if (!ivB64 || !tagB64 || !encryptedB64) throw new Error('Invalid encrypted data format');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
} 