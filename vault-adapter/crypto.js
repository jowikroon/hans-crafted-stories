/**
 * Shared encryption/decryption using AES-256-GCM.
 * Master key comes from VAULT_MASTER_KEY env var (hex-encoded, 64 chars = 32 bytes).
 */

const crypto = require("node:crypto");

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getMasterKey() {
  const raw = process.env.VAULT_MASTER_KEY;
  if (!raw) throw new Error("VAULT_MASTER_KEY not set");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("VAULT_MASTER_KEY must be 64 hex chars (32 bytes)");
  return buf;
}

function encrypt(plaintext) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(blob) {
  const key = getMasterKey();
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

module.exports = { encrypt, decrypt, getMasterKey };
