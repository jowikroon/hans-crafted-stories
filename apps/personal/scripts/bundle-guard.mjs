/**
 * Bundle-guard (2026-10-23, ronde 3): budget voor de JavaScript die ELKE publieke pagina laadt.
 * Eager = entry uit dist/index.html + modulepreloads + de App-chunk (main.tsx laadt App altijd
 * dynamisch) + al hun statische imports. Aanleiding: AnimatedRoutes importeerde privé-routes
 * (Portal, GodStructure, Wiki, ...) statisch, waardoor recharts en de Tiptap/ProseMirror-editor met
 * turndown op elke publieke pagina meekwamen (~770 kB gzip). Die routes zijn nu lazy.
 * Faalt als:
 *  - de eager JS boven het gzip-budget komt;
 *  - er editor- (ProseMirror) of grafiekcode (recharts) van de privé-routes in zit.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

// Na de lazy privé-routes: 393 kB (was 770 kB). Ruimte ~8% voor groei; verhogen = bewuste keuze.
export const BUDGET_GZIP_KB = 425;
export const FORBIDDEN = [
  { name: "Tiptap/ProseMirror-editor (portal, /write)", re: /ProseMirror/ },
  { name: "recharts (portal-status, /god-structure, dashboards)", re: /recharts-(?:wrapper|surface|tooltip)/ },
];

const STATIC_IMPORT = /\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?["'`]\.\/([\w.$-]+\.m?js)["'`]/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["'`]\.\/([\w.$-]+\.m?js)["'`]\s*\)/g;

export function eagerChunks(distDir) {
  const assets = path.join(distDir, "assets");
  const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  const queue = [
    ...[...html.matchAll(/<script type="module"[^>]*\bsrc="\/assets\/([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/<link rel="modulepreload"[^>]*\bhref="\/assets\/([^"]+)"/g)].map((m) => m[1]),
  ];
  if (!queue.length) throw new Error("geen module-entry in dist/index.html");
  const seen = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const full = path.join(assets, file);
    if (!fs.existsSync(full)) throw new Error(`chunk ${file} ontbreekt in dist/assets`);
    const code = fs.readFileSync(full, "utf8");
    for (const m of code.matchAll(STATIC_IMPORT)) queue.push(m[1]);
    for (const m of code.matchAll(DYNAMIC_IMPORT)) if (/^App-/.test(m[1])) queue.push(m[1]);
  }
  if (![...seen].some((f) => /^App-/.test(f))) throw new Error("App-chunk niet gevonden vanuit de entry (main.tsx laadt App dynamisch)");
  return [...seen];
}

export function checkBundle(distDir, { budgetKb = BUDGET_GZIP_KB } = {}) {
  const failures = [];
  const chunks = eagerChunks(distDir);
  let gzip = 0, raw = 0;
  for (const file of chunks) {
    const buf = fs.readFileSync(path.join(distDir, "assets", file));
    raw += buf.length;
    gzip += zlib.gzipSync(buf, { level: 9 }).length;
    const code = buf.toString("utf8");
    for (const f of FORBIDDEN) if (f.re.test(code)) failures.push(`${file}: bevat ${f.name}, wordt op elke publieke pagina geladen`);
  }
  const gzipKb = Math.round(gzip / 1024), rawKb = Math.round(raw / 1024);
  if (gzipKb > budgetKb) failures.push(`eager JS ${gzipKb} kB gzip > budget ${budgetKb} kB`);
  return { chunks, gzipKb, rawKb, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv.find((a) => a.startsWith("--dist="))?.slice(7) || fileURLToPath(new URL("../dist/", import.meta.url));
  let r;
  try { r = checkBundle(path.resolve(dist)); } catch (e) { console.error(`[bundle-guard] ${e.message}`); process.exit(1); }
  for (const f of r.failures) console.error(`[bundle-guard] ${f}`);
  console.log(`[bundle-guard] eager JS: ${r.chunks.length} chunks, ${r.rawKb} kB raw, ${r.gzipKb} kB gzip (budget ${BUDGET_GZIP_KB} kB), ${r.failures.length} failures`);
  if (r.failures.length) process.exitCode = 1;
}
