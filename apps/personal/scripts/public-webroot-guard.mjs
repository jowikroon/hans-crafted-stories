/**
 * CLI: node scripts/public-webroot-guard.mjs [public|dist ...]
 * Standaard beide. Faalt (exit 1) bij interne documenten, SSR-bundle of secrets in de webroot.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanWebroot } from "./lib/publicWebrootGuard.mjs";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["public", "dist"];

let failed = 0;
for (const t of targets) {
  const findings = scanWebroot(path.join(appDir, t));
  if (findings.length) {
    failed += findings.length;
    console.error(`[webroot-guard] ${t}/: ${findings.length} bevinding(en) — dit mag niet publiek:`);
    for (const f of findings) console.error(`  - ${f.file}${f.line ? `:${f.line}` : ""} [${f.kind}]`);
  }
}
if (failed) process.exit(1);
console.log(`[webroot-guard] OK — ${targets.join(", ")}: geen interne documenten, SSR-bundle of secrets.`);
