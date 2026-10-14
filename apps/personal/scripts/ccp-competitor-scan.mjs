#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(process.env.CCP_ENV_FILE || path.resolve("config/all-credentials.export.env"));
loadEnvFile(path.resolve(".env"));
loadEnvFile(path.resolve("apps/personal/.env"));

const baseUrl = process.env.SUPABASE_URL || "https://pesfakewujjwkyybwaom.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY; competitor scan was not run.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/functions/v1/ccp-competitor-scan`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ source: "daily-0700", period_days: [7, 30, 90] }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Competitor scan failed with HTTP ${response.status}: ${body.slice(0, 1000)}`);
  process.exit(1);
}
console.log(body);
