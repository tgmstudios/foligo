const crypto = require('crypto');

// Generate a key if not set (should be set in production)
let ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
let ENCRYPTION_KEY_BUFFER;

if (!ENCRYPTION_KEY_RAW) {
  // Generate a 32-byte key and convert to hex (64 chars)
  ENCRYPTION_KEY_BUFFER = crypto.randomBytes(32);
  // Encryption disabled for SSO client secrets (storing as plain text)
  // console.warn('WARNING: ENCRYPTION_KEY not set. Generated a new key. Set ENCRYPTION_KEY in your .env file for production!');
  // console.warn('Generated key (save this to .env):', ENCRYPTION_KEY_BUFFER.toString('hex'));
} else {
  // Handle the key - it could be hex (64 chars) or a raw string
  if (ENCRYPTION_KEY_RAW.length === 64 && /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY_RAW)) {
    // It's a hex string, convert to buffer (32 bytes)
    ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY_RAW, 'hex');
  } else {
    // It's a raw string, hash it to get exactly 32 bytes
    ENCRYPTION_KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();
  }
}

const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      // If it doesn't have the format, assume it's not encrypted
      return text;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If decryption fails, assume it's not encrypted
    return text;
  }
}

module.exports = {
  encrypt,
  decrypt
};

