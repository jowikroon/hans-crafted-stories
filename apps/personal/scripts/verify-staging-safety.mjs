import { readFile } from "node:fs/promises";
import path from "node:path";

const productionEnvPath = path.resolve(".env.production");
const stagingEnvPath = path.resolve(process.env.STAGING_ENV_FILE || ".env.staging");

const productionEnv = parseEnv(await readEnv(productionEnvPath));
const stagingEnv = parseEnv(await readEnv(stagingEnvPath, true));

const productionUrl = productionEnv.VITE_SUPABASE_URL || "https://pesfakewujjwkyybwaom.supabase.co";
const stagingUrl = stagingEnv.VITE_SUPABASE_URL;
const productionProjectId = productionEnv.VITE_SUPABASE_PROJECT_ID || projectRefFromUrl(productionUrl);
const stagingProjectId = stagingEnv.VITE_SUPABASE_PROJECT_ID || projectRefFromUrl(stagingUrl);

const failures = [];

if (!stagingUrl) failures.push(`${stagingEnvPath} must define VITE_SUPABASE_URL`);
if (!stagingEnv.VITE_SUPABASE_PUBLISHABLE_KEY) failures.push(`${stagingEnvPath} must define VITE_SUPABASE_PUBLISHABLE_KEY`);
if (stagingUrl && sameUrl(stagingUrl, productionUrl)) failures.push("staging Supabase URL matches production");
if (stagingProjectId && productionProjectId && stagingProjectId === productionProjectId) {
  failures.push("staging Supabase project id matches production");
}

if (failures.length > 0) {
  console.error("Destructive CMS staging tests are blocked:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nCreate a separate .env.staging Supabase project before running publish/unpublish/agent tests.");
  process.exit(1);
}

console.log(`Staging safety check passed for ${stagingUrl}`);

async function readEnv(filePath, optional = false) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (optional && error?.code === "ENOENT") return "";
    throw error;
  }
}

function parseEnv(source) {
  const env = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

function projectRefFromUrl(url) {
  return url?.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "";
}

function sameUrl(a, b) {
  return a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
}
