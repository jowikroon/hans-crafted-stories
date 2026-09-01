#!/usr/bin/env node
/**
 * Installeert de dependencies van de repo-eigen MCP-servers.
 *
 * Zonder deze stap start geen van beide servers op een vers gekloond device:
 * `node .claude/mcp/<server>/index.js` faalt met
 * `ERR_MODULE_NOT_FOUND: @modelcontextprotocol/sdk`.
 *
 * Gebruik: npm run mcp:setup
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = join(ROOT, "ops/mcp/registry.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const stdioServers = registry.servers.filter((s) => s.transport === "stdio" && s.scope === "repo");

let failed = 0;

for (const server of stdioServers) {
  const entry = join(ROOT, server.args[0]);
  const dir = dirname(entry);

  if (!existsSync(entry)) {
    console.error(`✗ ${server.id}: ${server.args[0]} bestaat niet`);
    failed++;
    continue;
  }

  if (existsSync(join(dir, "node_modules"))) {
    console.log(`· ${server.id}: dependencies staan er al`);
    continue;
  }

  console.log(`→ ${server.id}: npm install in ${dir.replace(`${ROOT}/`, "")}`);
  try {
    execFileSync("npm", ["install", "--no-audit", "--no-fund", "--prefix", dir], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log(`✓ ${server.id}: klaar`);
  } catch (e) {
    console.error(`✗ ${server.id}: npm install faalde — ${e.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} server(s) niet geïnstalleerd.`);
  process.exit(1);
}

console.log("\nAlle repo-MCP-servers zijn installeerbaar. Controleer ze met: npm run mcp:audit");
