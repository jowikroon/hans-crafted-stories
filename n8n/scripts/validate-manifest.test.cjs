#!/usr/bin/env node
/**
 * Unit tests for the manifest schema validator.
 * Run: node n8n/scripts/validate-manifest.test.cjs
 */

const path = require("node:path");
const { validate } = require("./validate-manifest.cjs");

const MANIFEST_PATH = path.resolve(__dirname, "..", "secrets.manifest.yml");

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

console.log("Unit tests: secrets.manifest.yml schema validation\n");

// Test 1: File exists
const result = validate(MANIFEST_PATH);
assert("Manifest file found", result.errors.filter((e) => e.includes("File not found")).length === 0);

// Test 2: Valid with no errors
assert("Manifest is valid (no errors)", result.valid === true);
if (result.errors.length > 0) {
  console.error("  Errors:", result.errors);
}

// Test 3: Has version
assert("Has version field", result.manifest && result.manifest.version !== undefined);

// Test 4: At least 3 variables
assert("At least 3 variables", result.manifest && result.manifest.variables.length >= 3);

// Test 5: At least 5 secrets
assert("At least 5 secrets", result.manifest && result.manifest.secrets.length >= 5);

// Test 6: All secrets have valid source (ENV | VAULT_REF | N8N_CRED)
if (result.manifest) {
  const allowed = ["ENV", "VAULT_REF", "N8N_CRED", "VAULT"];
  const allValid = result.manifest.secrets.every((s) => allowed.includes(s.source));
  assert("All secrets have valid source (ENV/VAULT_REF/N8N_CRED)", allValid);
}

// Test 7: Required secrets present
if (result.manifest) {
  const names = result.manifest.secrets.map((s) => s.name);
  assert("Has N8N_API_KEY", names.includes("N8N_API_KEY"));
  assert("Has SUPABASE_SERVICE_ROLE_KEY", names.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert("Has COMMANDER_WEBHOOK_TOKEN", names.includes("COMMANDER_WEBHOOK_TOKEN"));
}

// Test 8: At least 3 workflows
assert("At least 3 workflows", result.manifest && result.manifest.workflows.length >= 3);

// Test 9: Policy section present and valid
assert("Has policy section", result.manifest && result.manifest.policy);
assert("Policy has redaction_patterns", result.manifest?.policy?.redaction_patterns?.length > 0);
assert("Policy has allowed_sources", result.manifest?.policy?.allowed_sources?.length > 0);
assert("Policy has forbidden_patterns", result.manifest?.policy?.forbidden_patterns?.length > 0);
assert("Policy allowed_sources includes ENV", result.manifest?.policy?.allowed_sources?.includes("ENV"));
assert("Policy forbidden_patterns includes 'Bearer '", result.manifest?.policy?.forbidden_patterns?.some((p) => p.includes("Bearer")));

// Test 10: Non-existent file returns invalid
const badResult = validate("/tmp/does-not-exist-12345.yml");
assert("Non-existent file returns invalid", badResult.valid === false);
assert("Error mentions 'File not found'", badResult.errors[0] && badResult.errors[0].includes("File not found"));

// Summary
console.log(`\n${"=".repeat(40)}`);
console.log(`  Passed: ${passed}  Failed: ${failed}`);
console.log("=".repeat(40));

process.exit(failed > 0 ? 1 : 0);
