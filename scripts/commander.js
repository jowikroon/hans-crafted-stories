#!/usr/bin/env node
/**
 * Commander AI — single-command entrypoint for the self-healing secrets system.
 *
 * Usage:
 *   node scripts/commander.js secrets:heal [--target all] [--mode apply|dry-run]
 *
 * Or via npm:
 *   npm run commander -- secrets:heal
 *
 * Env (loaded from config/all-credentials.export.env via dotenv-cli):
 *   N8N_BASE_URL / N8N_URL   — n8n instance
 *   COMMANDER_WEBHOOK_TOKEN   — shared secret for webhook auth
 */

const { safeLog, safeError, redactObject } = require("./lib/redact");

const N8N_BASE = (
  process.env.N8N_BASE_URL || process.env.N8N_URL || ""
).replace(/\/$/, "");
const TOKEN = process.env.COMMANDER_WEBHOOK_TOKEN || "";

if (!N8N_BASE) {
  safeError("N8N_BASE_URL or N8N_URL not set. Load config/all-credentials.export.env.");
  process.exit(1);
}

async function callWebhook(path, body = {}) {
  const url = `${N8N_BASE}/webhook/${path}`;
  safeLog(`POST ${url}`);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-COMMANDER-TOKEN": TOKEN,
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  return data;
}

function printReport(label, data) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(60));
  console.log(JSON.stringify(redactObject(data), null, 2));
}

async function secretsHeal(mode) {
  const dryRun = mode === "dry-run";

  // Step 1: Verify
  safeLog("Step 1/3: Running secrets registry verify...");
  let verifyReport;
  try {
    verifyReport = await callWebhook("secrets-registry-verify");
  } catch (e) {
    safeError("Verify failed:", e.message);
    safeLog("Hint: ensure the secrets_registry_verify workflow is imported and active in n8n.");
    process.exit(1);
  }
  printReport("VERIFY REPORT", verifyReport);

  const allMissing = verifyReport.all_missing || verifyReport.missing || [];
  if (allMissing.length === 0) {
    safeLog("\nAll secrets present. Nothing to provision.");
    return verifyReport;
  }

  safeLog(`\nMissing secrets: ${allMissing.join(", ")}`);

  if (dryRun) {
    safeLog("[dry-run] Would call provisioner with missing secrets. Stopping.");
    return verifyReport;
  }

  // Step 2: Provision
  safeLog("Step 2/3: Running secrets provisioner...");
  let provisionReport;
  try {
    provisionReport = await callWebhook("secrets-provisioner", { missing: allMissing });
  } catch (e) {
    safeError("Provisioner failed:", e.message);
    process.exit(1);
  }
  printReport("PROVISIONER REPORT", provisionReport);

  // Step 3: Reconcile & retry
  safeLog("Step 3/3: Running reconcile & retry...");
  let reconcileReport;
  try {
    reconcileReport = await callWebhook("n8n-reconcile-retry");
  } catch (e) {
    safeError("Reconcile failed:", e.message);
    process.exit(1);
  }
  printReport("RECONCILE REPORT", reconcileReport);

  if (reconcileReport.ok) {
    safeLog("\nAll secrets reconciled. System healthy.");
  } else {
    safeError("\nSome secrets still missing. Review the report above and see:");
    safeError("  docs/runbooks/missing-secrets.md");
    process.exit(1);
  }

  return reconcileReport;
}

// --- CLI parsing ---
const args = process.argv.slice(2);
const command = args[0];
const modeFlag = args.find((a) => a.startsWith("--mode="));
const mode = modeFlag ? modeFlag.split("=")[1] : "apply";

if (!command) {
  console.log("Commander AI — Self-Healing Secrets System\n");
  console.log("Usage:");
  console.log("  commander secrets:heal [--mode=apply|dry-run]");
  console.log("  commander secrets:verify");
  console.log("\nExamples:");
  console.log("  npm run commander -- secrets:heal --mode=apply");
  console.log("  npm run commander -- secrets:heal --mode=dry-run");
  process.exit(0);
}

(async () => {
  try {
    switch (command) {
      case "secrets:heal":
        await secretsHeal(mode);
        break;
      case "secrets:verify": {
        const report = await callWebhook("secrets-registry-verify");
        printReport("VERIFY REPORT", report);
        process.exit(report.ok ? 0 : 1);
        break;
      }
      default:
        safeError(`Unknown command: ${command}`);
        process.exit(2);
    }
  } catch (e) {
    safeError("Fatal:", e.message);
    process.exit(1);
  }
})();
