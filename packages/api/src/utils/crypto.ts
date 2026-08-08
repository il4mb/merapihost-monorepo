import crypto from 'crypto';
import { env } from '@/config/env';

// Use AES-256-GCM for authenticated encryption
const ALGORITHM = 'aes-256-gcm';

// The key must be exactly 32 bytes (256 bits).
// In production, NEVER hardcode this. Load it from a secure environment variable.
const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypts a plain text string.
 * Returns a formatted string containing the IV, Auth Tag, and Ciphertext.
 */
function encrypt(text) {
    if (!text) return text;

    // Generate a random 16-byte Initialization Vector
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Store all pieces needed for decryption together
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted string back to plain text.
 */
function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };