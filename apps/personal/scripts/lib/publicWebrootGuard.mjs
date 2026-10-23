/**
 * Guard voor alles wat publiek geserveerd wordt (apps/personal/public vóór de build,
 * apps/personal/dist erna). Aanleiding 2026-09-23: interne CCP-werkdocumenten, dashboards
 * met een ingebakken Supabase service_role-JWT en de SSR-bundle stonden in de webroot.
 *
 * Faalt op:
 *  - verboden paden (interne werkmappen, dashboards-HTML, SSR-bundle);
 *  - JWT's waarvan de payload role "service_role" (of "supabase_admin") claimt;
 *  - private keys en bekende secret-prefixes;
 *  - hard-coded tokenconstanten (TOKEN = "...", API_KEY: "...") (2026-10-23: de runner-token in
 *    extensions/ccp-crawler.zip);
 *  - archieven: .zip wordt uitgepakt (in het geheugen) en elk tekstbestand erin krijgt dezelfde scan;
 *    andere archieven (.tar, .gz, .7z, .rar, ...) en zips die niet te lezen zijn (versleuteld,
 *    zip64, onbekende compressie) worden geweigerd, want ongescand = niet publiek.
 * Meldt nooit de secret-waarde zelf: alleen bestand, regel en soort.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const FORBIDDEN_PATHS = [
  { id: "internal-workdocs", re: /^cowork(\/|$)/i },
  { id: "internal-dashboard", re: /^(ccp-dashboard\.html|dashboards\/[^/]+\.html)$/i },
  { id: "ssr-bundle", re: /^entry-server\.(m?js|cjs)$/i },
  { id: "env-file", re: /(^|\/)\.env(\.|$)/i },
];

const TEXT_EXT = /\.(html?|js|mjs|cjs|json|txt|md|xml|css|map|svg)$/i;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
const SECRET_PATTERNS = [
  // Not when the marker is an operand in code (PEM parsing: /-----BEGIN PRIVATE KEY-----|...|/), only as key text.
  { id: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----(?![|\/'"`)])/ },
  { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { id: "anthropic-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: "openai-key", re: /\bsk-(proj-)?[A-Za-z0-9]{32,}/ },
  { id: "slack-token", re: /\bxox[abpr]-[A-Za-z0-9-]{10,}/ },
  { id: "stripe-live-key", re: /\b(sk|rk)_live_[A-Za-z0-9]{16,}/ },
  { id: "supabase-secret-key", re: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
  // Constante met een secret-naam en een lange letterlijke waarde (geen lege placeholder, geen env-lookup).
  { id: "hardcoded-token", re: /\b(?:[A-Z][A-Z0-9_]*_)?(?:TOKEN|SECRET|API_?KEY|PASSWORD|PASSWD)\s*[:=]\s*["'`](?!your|placeholder|example|changeme|xxxx)[A-Za-z0-9_\-+/=.]{16,}["'`]/ },
  // Uitleg naast de waarde, zoals in een README: "Token (...): <waarde>" op de volgende regel telt niet,
  // dus ook een header-waarde in code: "X-...-Token": <variabele> is prima, een letterlijke niet.
  { id: "hardcoded-token", re: /["']X-[A-Za-z-]*(?:Token|Key|Secret)["']\s*:\s*["'](?!your|placeholder|example|changeme|xxxx)[A-Za-z0-9_\-+/=.]{16,}["']/i },
];
const ARCHIVE_EXT = /\.(zip|tar|tgz|gz|bz2|xz|7z|rar|jar|crx|xpi)$/i;

/**
 * Minimale ZIP-lezer (central directory, methode 0 en 8) zonder dependency. Gooit bij alles wat hij
 * niet zeker kan lezen, zodat de aanroeper dat als "unscannable" afwijst.
 */
export function readZipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("geen zip (EOCD ontbreekt)");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || off === 0xffffffff) throw new Error("zip64 niet ondersteund");
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("kapotte central directory");
    const flags = buf.readUInt16LE(off + 8), method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20), nameLen = buf.readUInt16LE(off + 28), extraLen = buf.readUInt16LE(off + 30), commentLen = buf.readUInt16LE(off + 32);
    const local = buf.readUInt32LE(off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString("utf8");
    off += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    if (flags & 1) throw new Error(`versleuteld bestand ${name}`);
    if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error("kapotte local header");
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.slice(start, start + csize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = zlib.inflateRawSync(raw);
    else throw new Error(`compressiemethode ${method} niet ondersteund (${name})`);
    entries.push({ name, data });
  }
  return entries;
}

function scanArchive(root, rel) {
  if (!/\.zip$/i.test(rel)) return [{ file: rel, kind: "archive-unscannable" }];
  let entries;
  try { entries = readZipEntries(fs.readFileSync(path.join(root, rel))); }
  catch { return [{ file: rel, kind: "archive-unscannable" }]; }
  const findings = [];
  for (const e of entries) {
    const inner = `${rel}!/${e.name}`;
    if (ARCHIVE_EXT.test(e.name)) { findings.push({ file: inner, kind: "archive-unscannable" }); continue; }
    for (const rule of FORBIDDEN_PATHS) if (rule.re.test(e.name)) findings.push({ file: inner, kind: rule.id });
    // Binaire bestanden (beelden) overslaan: alleen wat als UTF-8 zonder NUL leest.
    if (e.data.includes(0)) continue;
    findings.push(...scanText(e.data.toString("utf8"), inner));
  }
  return findings;
}

function decodeJwtRole(payloadB64) {
  try {
    const json = Buffer.from(payloadB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

function walk(dir, root = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, out);
    else out.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return out;
}

/** Scant één tekst (bv. een getrackt bestand); bevindingen zonder secret-waarden. */
export function scanText(text, file = "") {
  const findings = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const m of line.matchAll(JWT)) {
      const role = decodeJwtRole(m[1]);
      if (role === "service_role" || role === "supabase_admin") findings.push({ file, line: i + 1, kind: `jwt-${role}` });
    }
    for (const p of SECRET_PATTERNS) if (p.re.test(line)) findings.push({ file, line: i + 1, kind: p.id });
  });
  return findings;
}

/** Scant een map; geeft bevindingen terug zonder secret-waarden. */
export function scanWebroot(root) {
  const findings = [];
  for (const rel of walk(root)) {
    for (const rule of FORBIDDEN_PATHS) {
      if (rule.re.test(rel)) findings.push({ file: rel, kind: rule.id });
    }
    if (ARCHIVE_EXT.test(rel)) { findings.push(...scanArchive(root, rel)); continue; }
    if (!TEXT_EXT.test(rel)) continue;
    findings.push(...scanText(fs.readFileSync(path.join(root, rel), "utf8"), rel));
  }
  return findings;
}
