/**
 * File-backed encrypted secret store (Gate 3).
 * Each secret is stored as { name: encryptedBlob } in a JSON file.
 * AEAD encryption via crypto.cjs (AES-256-GCM). Master key: VAULT_MASTER_KEY (64 hex chars).
 *
 * Path: VAULT_FILE env or default ./data/secrets.vault.
 * In Docker use /mnt/data/secrets.vault and mount a volume at /mnt/data.
 */

const fs = require("node:fs");
const path = require("node:path");
const { encrypt, decrypt } = require("./crypto.cjs");

function vaultPath() {
  return process.env.VAULT_FILE || path.join(__dirname, "data", "secrets.vault");
}

function ensureDir() {
  const dir = path.dirname(vaultPath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadAll() {
  const fp = vaultPath();
  if (!fs.existsSync(fp)) return {};
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function saveAll(data) {
  ensureDir();
  fs.writeFileSync(vaultPath(), JSON.stringify(data, null, 2), "utf8");
}

function get(name) {
  const all = loadAll();
  if (!(name in all)) return null;
  return decrypt(all[name]);
}

function set(name, value) {
  const all = loadAll();
  all[name] = encrypt(value);
  saveAll(all);
}

function remove(name) {
  const all = loadAll();
  if (!(name in all)) return false;
  delete all[name];
  saveAll(all);
  return true;
}

function list() {
  return Object.keys(loadAll());
}

function has(name) {
  return name in loadAll();
}

module.exports = { get, set, remove, list, has };
