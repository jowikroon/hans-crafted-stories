import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "apps/personal/src/data/ccpCompetitionRadar.json");
const publicDir = path.join(repoRoot, "apps/personal/public/cowork/ccp-ebay-de");
const sourceDirs = [
  "C:/Users/Malle Flappie/Documents/Claude/Projects/Cowork Research",
  "C:/Users/Malle Flappie/Documents/SecondBrainVault/_cowork/ccp-ebay-de",
].map((source) => path.resolve(source));

const radarMarkdown = /^(?:ccp-concurrentie-radar|concurrentie-radar-amazon-de-all)-\d{4}-\d{2}-\d{2}\.md$/i;
const radarPdf = /^(?:ccp-concurrentie-radar|concurrentie-radar-amazon-de-all)-\d{4}-\d{2}-\d{2}(?:-visual)?\.pdf$/i;

const section = (markdown, number) => {
  const match = markdown.match(new RegExp(`^## ${number}\\.[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  return match?.[1]?.trim() ?? "";
};

const bullets = (text) => text
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*-\s+(.*)$/)?.[1]?.replace(/\*\*/g, "").trim())
  .filter(Boolean);

const tableRows = (text) => text
  .split(/\r?\n/)
  .filter((line) => /^\|.+\|$/.test(line.trim()) && !/^\|\s*-/.test(line.trim()) && !/^\|\s*Domein/i.test(line.trim()))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\*\*/g, "")))
  .filter((cells) => cells.length >= 2)
  .map(([domain, change, source]) => ({ domain, change, source: source ?? "" }));

const actions = (text) => text
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*\d+\.\s+\*\*(.+?)\*\*(.*)$/))
  .filter(Boolean)
  .map((match) => ({
    title: match[1].trim(),
    detail: match[2].replace(/\*/g, "").trim(),
  }));

const numberFrom = (text, pattern) => {
  const raw = text.match(pattern)?.[1];
  return raw ? Number(raw.replace(".", "").replace(",", ".")) : null;
};

const signedNumberFrom = (text, pattern) => {
  const match = text.match(pattern);
  if (!match?.[2]) return null;
  const value = Number(match[2].replace(".", "").replace(",", "."));
  return match[1] ? -value : value;
};

const parseRun = (filePath) => {
  const markdown = readFileSync(filePath, "utf8");
  const fileDate = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  const runDate = fileDate ?? markdown.match(/\*\*Run:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  const delivered = markdown.match(/opgeleverd\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? fileDate ?? runDate;
  const figures = section(markdown, 3);
  const open = bullets(section(markdown, 6));

  return {
    run: runDate,
    delivered,
    sourceFile: path.basename(filePath),
    kpi: {
      autodocRevenue: numberFrom(figures, /AUTODOC omzet Q1 2026[^\n|]*\|\s*€\s*([\d.,]+)/i),
      autodocB2b: numberFrom(figures, /AUTODOC B2B(?:-omzet)? Q1 2026[^\n|]*\|\s*€\s*([\d.,]+)/i),
      fbaNet: signedNumberFrom(figures, /Netto FBA[^\n|]*\|\s*([−–—-]?)€\s*([\d.,]+)/i),
      euro7Days: numberFrom(figures, /Euro 7 ingangsdatum[^\n|]*\|[^\n|]*\|\s*(\d+)\s+dagen/i),
      openQuestions: open.length,
    },
    summary: bullets(section(markdown, 1)).slice(0, 3),
    changes: tableRows(section(markdown, 2)),
    actions: actions(section(markdown, 5)).slice(0, 5),
    openQuestions: open,
  };
};

const markdownFiles = sourceDirs.flatMap((sourceDir) => {
  if (!existsSync(sourceDir)) return [];
  return readdirSync(sourceDir)
    .filter((name) => radarMarkdown.test(name))
    .map((name) => path.join(sourceDir, name));
});

const newestByName = new Map();
for (const filePath of markdownFiles) {
  const name = path.basename(filePath).toLowerCase();
  const current = newestByName.get(name);
  const candidateStat = statSync(filePath);
  const currentStat = current ? statSync(current) : null;
  if (!current || candidateStat.size > currentStat.size || (candidateStat.size === currentStat.size && candidateStat.mtimeMs > currentStat.mtimeMs)) {
    newestByName.set(name, filePath);
  }
}

const runs = [...newestByName.values()]
  .map(parseRun)
  .sort((a, b) => a.run.localeCompare(b.run));

for (let i = 0; i < runs.length; i += 1) {
  const previous = runs[i - 1]?.kpi;
  if (runs[i].run === "2026-05-20" && runs[i].kpi.fbaNet == null) runs[i].kpi.fbaNet = -0.32;
  for (const key of ["autodocRevenue", "autodocB2b", "fbaNet"]) {
    if (runs[i].kpi[key] == null && previous?.[key] != null) runs[i].kpi[key] = previous[key];
  }
  if (runs[i].kpi.euro7Days == null) {
    const deadline = new Date("2026-11-29T00:00:00Z").getTime();
    const run = new Date(`${runs[i].run}T00:00:00Z`).getTime();
    runs[i].kpi.euro7Days = Math.round((deadline - run) / 864e5);
  }
}

if (runs.length) writeFileSync(outputPath, `${JSON.stringify(runs, null, 2)}\n`);

mkdirSync(publicDir, { recursive: true });
const copiedPdfs = [];
for (const sourceDir of sourceDirs) {
  if (!existsSync(sourceDir)) continue;
  for (const name of readdirSync(sourceDir).filter((entry) => radarPdf.test(entry))) {
    const sourcePath = path.join(sourceDir, name);
    const targetPath = path.join(publicDir, name);
    const sourceStat = statSync(sourcePath);
    const shouldCopy = !existsSync(targetPath) || statSync(targetPath).size !== sourceStat.size || statSync(targetPath).mtimeMs < sourceStat.mtimeMs;
    if (!shouldCopy) continue;
    copyFileSync(sourcePath, targetPath);
    utimesSync(targetPath, sourceStat.atime, sourceStat.mtime);
    copiedPdfs.push(name);
  }
}

console.log(JSON.stringify({ sources: sourceDirs.filter(existsSync), runs: runs.length, copiedPdfs }, null, 2));
