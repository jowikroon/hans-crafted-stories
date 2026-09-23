/**
 * Guard voor alles wat publiek geserveerd wordt (apps/personal/public vóór de build,
 * apps/personal/dist erna). Aanleiding 2026-09-23: interne CCP-werkdocumenten, dashboards
 * met een ingebakken Supabase service_role-JWT en de SSR-bundle stonden in de webroot.
 *
 * Faalt op:
 *  - verboden paden (interne werkmappen, dashboards-HTML, SSR-bundle);
 *  - JWT's waarvan de payload role "service_role" (of "supabase_admin") claimt;
 *  - private keys en bekende secret-prefixes.
 * Meldt nooit de secret-waarde zelf: alleen bestand, regel en soort.
 */
import fs from "node:fs";
import path from "node:path";

export const FORBIDDEN_PATHS = [
  { id: "internal-workdocs", re: /^cowork(\/|$)/i },
  { id: "internal-dashboard", re: /^(ccp-dashboard\.html|dashboards\/[^/]+\.html)$/i },
  { id: "ssr-bundle", re: /^entry-server\.(m?js|cjs)$/i },
  { id: "env-file", re: /(^|\/)\.env(\.|$)/i },
];

const TEXT_EXT = /\.(html?|js|mjs|cjs|json|txt|md|xml|css|map|svg)$/i;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
const SECRET_PATTERNS = [
  { id: "private-key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { id: "anthropic-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: "openai-key", re: /\bsk-(proj-)?[A-Za-z0-9]{32,}/ },
  { id: "slack-token", re: /\bxox[abpr]-[A-Za-z0-9-]{10,}/ },
  { id: "stripe-live-key", re: /\b(sk|rk)_live_[A-Za-z0-9]{16,}/ },
  { id: "supabase-secret-key", re: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
];

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
    if (!TEXT_EXT.test(rel)) continue;
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(JWT)) {
        const role = decodeJwtRole(m[1]);
        if (role === "service_role" || role === "supabase_admin") findings.push({ file: rel, line: i + 1, kind: `jwt-${role}` });
      }
      for (const p of SECRET_PATTERNS) if (p.re.test(line)) findings.push({ file: rel, line: i + 1, kind: p.id });
    });
  }
  return findings;
}
