import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, copyFileSync, utimesSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const sources = [
  "C:/Users/Malle Flappie/Documents/SecondBrainVault/_cowork/ccp-ebay-de",
  "C:/Users/Malle Flappie/.claude-mem/observer-sessions/marketplacegrowth-remote/public/cowork/ccp-ebay-de",
].map((source) => path.resolve(source));

const publicDir = path.join(repoRoot, "apps/personal/public/cowork/ccp-ebay-de");
const manifestPath = path.join(repoRoot, "apps/personal/src/data/coworkAttachments.json");
const allowedExtensions = new Set([".html", ".pdf", ".md", ".xlsx", ".txt"]);
const ignoredName = /(^\.~lock\.|\.SKILL\.md$|~$|\.tmp$|\.bak$|\.crdownload$)/i;

const commitAndPush = process.argv.includes("--commit");
const dryRun = process.argv.includes("--dry-run");

const hashFile = (filePath) => createHash("sha256").update(readFileSync(filePath)).digest("hex");

const listFiles = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (!entry.isFile()) return [];
    if (ignoredName.test(entry.name)) return [];
    if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) return [];
    return [fullPath];
  });
};

const shouldCopy = (sourcePath, targetPath) => {
  if (!existsSync(targetPath)) return true;
  const sourceStat = statSync(sourcePath);
  const targetStat = statSync(targetPath);
  if (sourceStat.size !== targetStat.size) return true;
  return hashFile(sourcePath) !== hashFile(targetPath);
};

mkdirSync(publicDir, { recursive: true });

const seen = new Map();
for (const sourceDir of sources) {
  for (const sourcePath of listFiles(sourceDir)) {
    const name = path.basename(sourcePath);
    const current = seen.get(name);
    if (!current || statSync(sourcePath).mtimeMs > statSync(current).mtimeMs || statSync(sourcePath).size > statSync(current).size) {
      seen.set(name, sourcePath);
    }
  }
}

const copied = [];
for (const [name, sourcePath] of [...seen.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const targetPath = path.join(publicDir, name);
  if (!shouldCopy(sourcePath, targetPath)) continue;
  copied.push(name);
  if (dryRun) continue;
  copyFileSync(sourcePath, targetPath);
  const sourceStat = statSync(sourcePath);
  utimesSync(targetPath, sourceStat.atime, sourceStat.mtime);
}

const filesForManifest = listFiles(publicDir)
  .map((filePath) => {
    const stat = statSync(filePath);
    const name = path.basename(filePath);
    return {
      name,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      url: `/cowork/ccp-ebay-de/${encodeURIComponent(name).replace(/%2F/g, "/")}`,
    };
  })
  .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime() || b.size - a.size || a.name.localeCompare(b.name));

const nextManifest = `${JSON.stringify(filesForManifest, null, 2)}\n`;
const manifestChanged = !existsSync(manifestPath) || readFileSync(manifestPath, "utf8") !== nextManifest;
if (!dryRun && manifestChanged) writeFileSync(manifestPath, nextManifest);

console.log(JSON.stringify({
  sources: sources.filter((source) => existsSync(source)),
  discovered: seen.size,
  copied: copied.length,
  copiedFiles: copied,
  manifestRows: filesForManifest.length,
  manifestChanged,
  dryRun,
}, null, 2));

if (dryRun || !commitAndPush) process.exit(0);

const status = execFileSync("git", ["status", "--short"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (!status) {
  console.log("No dashboard attachment changes to commit.");
  process.exit(0);
}

execFileSync("git", ["add", "apps/personal/public/cowork/ccp-ebay-de", "apps/personal/src/data/coworkAttachments.json"], { cwd: repoRoot, stdio: "inherit" });
const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: repoRoot, encoding: "utf8" }).trim();
if (!staged) {
  console.log("No staged dashboard attachment changes.");
  process.exit(0);
}

execFileSync("git", ["commit", "-m", "Sync cowork dashboard attachments"], { cwd: repoRoot, stdio: "inherit" });
execFileSync("git", ["push", "origin", "main"], { cwd: repoRoot, stdio: "inherit" });
