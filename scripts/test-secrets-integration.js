#!/usr/bin/env node
/**
 * Integration test for the secrets system (vault adapter + vaultctl).
 *
 * What it does:
 *   1. Starts the vault adapter server
 *   2. Verifies health endpoint
 *   3. Stores a test secret via vaultctl
 *   4. Checks the secret exists via HTTP
 *   5. Retrieves the secret via vaultctl and verifies value
 *   6. Lists secrets
 *   7. Removes the secret
 *   8. Verifies it's gone
 *   9. Shuts down the server
 *
 * Env:
 *   VAULT_MASTER_KEY — must be set (64 hex chars). Uses a test key if not set.
 *
 * Usage:
 *   node scripts/test-secrets-integration.js
 */

const { execSync, spawn } = require("node:child_process");
const path = require("node:path");
const crypto = require("node:crypto");

const VAULT_DIR = path.join(__dirname, "..", "vault-adapter");
const TEST_PORT = 4099;
const TEST_KEY = crypto.randomBytes(32).toString("hex");
const TEST_VAULT_FILE = path.join(VAULT_DIR, "data", "test-secrets.vault");

const env = {
  ...process.env,
  VAULT_MASTER_KEY: process.env.VAULT_MASTER_KEY || TEST_KEY,
  VAULT_FILE: TEST_VAULT_FILE,
  VAULT_PORT: String(TEST_PORT),
};

let server;
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function vaultctl(args) {
  return execSync(`node "${path.join(VAULT_DIR, "cli.js")}" ${args}`, {
    env,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

async function httpGet(urlPath) {
  const resp = await fetch(`http://localhost:${TEST_PORT}${urlPath}`);
  return { status: resp.status, data: await resp.json() };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cleanup() {
  if (server) {
    server.kill("SIGTERM");
    await sleep(500);
  }
  try {
    require("node:fs").unlinkSync(TEST_VAULT_FILE);
  } catch { /* ignore */ }
}

async function run() {
  console.log("Integration test: secrets system\n");
  console.log(`Using test vault port: ${TEST_PORT}`);
  console.log(`Using test vault file: ${TEST_VAULT_FILE}\n`);

  // 1. Start vault adapter
  console.log("1. Starting vault adapter...");
  server = spawn("node", [path.join(VAULT_DIR, "index.js")], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  await sleep(1500);
  assert("Server started", server.exitCode === null);

  // 2. Health check
  console.log("2. Health check...");
  const health = await httpGet("/health");
  assert("GET /health returns 200", health.status === 200);
  assert("GET /health returns ok:true", health.data.ok === true);

  // 3. Store a test secret via vaultctl
  console.log("3. Storing test secret via vaultctl...");
  try {
    vaultctl("set integration_test_secret dummy_value_12345");
    assert("vaultctl set succeeded", true);
  } catch (e) {
    assert("vaultctl set succeeded", false);
  }

  // 4. Check existence via HTTP
  console.log("4. Checking existence via HTTP...");
  const check = await httpGet("/secret/integration_test_secret");
  assert("GET /secret/integration_test_secret returns 200", check.status === 200);
  assert("Response has exists:true", check.data.exists === true);

  // 5. Retrieve via vaultctl
  console.log("5. Retrieving via vaultctl...");
  try {
    const val = vaultctl("get integration_test_secret");
    assert("vaultctl get returns correct value", val === "dummy_value_12345");
  } catch (e) {
    assert("vaultctl get returns correct value", false);
  }

  // 6. List secrets
  console.log("6. Listing secrets...");
  try {
    const list = vaultctl("list");
    assert("vaultctl list includes integration_test_secret", list.includes("integration_test_secret"));
  } catch (e) {
    assert("vaultctl list includes integration_test_secret", false);
  }

  // 7. Check non-existent secret
  console.log("7. Checking non-existent secret...");
  const missing = await httpGet("/secret/does_not_exist");
  assert("GET /secret/does_not_exist returns 404", missing.status === 404);

  // 8. Remove secret
  console.log("8. Removing secret...");
  try {
    vaultctl("remove integration_test_secret");
    assert("vaultctl remove succeeded", true);
  } catch (e) {
    assert("vaultctl remove succeeded", false);
  }

  // 9. Verify removal
  console.log("9. Verifying removal...");
  const gone = await httpGet("/secret/integration_test_secret");
  assert("Secret is gone (404)", gone.status === 404);

  // Summary
  console.log(`\n${"=".repeat(40)}`);
  console.log(`  Passed: ${passed}  Failed: ${failed}`);
  console.log("=".repeat(40));

  await cleanup();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error("Test error:", e);
  await cleanup();
  process.exit(1);
});
