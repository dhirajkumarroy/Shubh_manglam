import crypto from 'crypto';
import { env } from '../../config/env';

/**
 * Computes a SHA-256 hex hash of a raw token (used for refresh tokens, email tokens, password reset tokens).
 * Ensures raw tokens are never stored in the database.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a cryptographically strong random hex token.
 * Default 32 bytes (64 hex characters).
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * AES-256-GCM authenticated encryption for sensitive secrets (like MFA seeds).
 * Format: iv:authTag:encryptedData (all hex encoded).
 */
export const encryptSecret = (plaintext: string): string => {
  const key = Buffer.from(env.MFA_ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an AES-256-GCM encrypted secret.
 */
export const decryptSecret = (ciphertext: string): string => {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted ciphertext format.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = Buffer.from(env.MFA_ENCRYPTION_KEY.padEnd(64, '0').slice(0, 64), 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// =========================================================================
// RFC 6238 Standard TOTP (Time-based One-Time Password) Implementation
// =========================================================================

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 TOTP secret (160 bits / 32 characters).
 */
export const generateTotpSecret = (length: number = 32): string => {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[bytes[i] % 32];
  }
  return secret;
};

/**
 * Decodes a Base32 string to Buffer.
 */
function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates a 6-digit TOTP code for a given secret at a specific counter step.
 * Counter step defaults to Math.floor(Date.now() / 1000 / 30).
 */
export const generateTotpCode = (secret: string, counter?: number): string => {
  const step = counter ?? Math.floor(Date.now() / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(step));

  const keyBuffer = base32ToBuffer(secret);
  const hmac = crypto.createHmac('sha1', keyBuffer).update(counterBuffer).digest();

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
};

/**
 * Verifies a 6-digit TOTP code against a secret with +/- 1 time-step tolerance (90s window).
 */
export const verifyTotpCode = (secret: string, code: string, window: number = 1): boolean => {
  if (!code || code.length !== 6) return false;
  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const expected = generateTotpCode(secret, currentStep + i);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code))) {
      return true;
    }
  }
  return false;
};
