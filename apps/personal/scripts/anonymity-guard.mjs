/**
 * Anonimiserings-guard (2026-09-23). Draait na prerender op dist/.
 *
 * Doel: klantresultaatcijfers en herleidbare klant+resultaat-combinaties mogen
 * niet terugkomen in broncode-eigen pagina's, metadata, JSON-LD, de JS-bundle of
 * publieke tekstbestanden. Werkgeversnamen in het functieverleden zijn toegestaan;
 * we matchen daarom op specifieke claim-patronen, niet op losse namen.
 *
 * Scope:
 *  - FAIL: alle HTML buiten /writing/<slug>, plus assets/*.js, llms.txt, sitemap.
 *  - REPORT (geen fail): /writing/<slug> en de /writing-lijst — die tekst komt uit
 *    Supabase (blog_posts) en wordt via de CMS-patch in docs/cms-patches/ opgelost.
 *    Zo breekt een merge vóór het toepassen van die patch de productiebuild niet.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");

export const FORBIDDEN = [
  { id: "nielsen-share", re: /\b70\s?%[^<]{0,80}?(market share|category share|marktaandeel|categorie-?aandeel|oordop|earplug)/i },
  { id: "nielsen-year", re: /Nielsen,?\s?(Data|20\d\d)/i },
  { id: "oos-under-2", re: /(out-of-stock|OOS)[^<]{0,60}?(below|under|onder( de)?|<)\s?2\s?%/i },
  { id: "weekly-sales-20", re: /20\s?% (more weekly|meer wekelijkse|weekly sales)|\+20\s?%[^<]{0,40}?(wekelijks|weekly)/i },
  { id: "organic-plus-40", re: /(\+40\s?%|40\s?%)[^<]{0,40}?(organic|organisch)|(organic|organisch)[^<]{0,40}?\+\s?40\s?%/i },
  { id: "visibility-plus-35", re: /\+35\s?%/ },
  { id: "industry-first", re: /first in the industry|primeur in de branche|een primeur/i },
  { id: "ccp-case", re: /Connect Car Parts(:| case| Case Study|-case)|A\.B\.S\.[- ]?(brake|rem)/i },
  { id: "ccp-volumes", re: /~\s?400 (A\.B\.S|SKU)|2[.,]400\+ product/i },
  { id: "revenue-2m", re: /€\s?2\s?M\+|€2 (million|miljoen)/i },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const isCmsOwned = (rel) => /^(nl[\\/])?writing([\\/]|$)/.test(rel);
// Interne werkdocumenten/dashboards: apart opgevolgd (horen niet in de publieke webroot). Melden, niet falen.
const isPrivateTool = (rel) => /^(cowork[\\/]|dashboards[\\/]|ccp-dashboard\.html$|assets[\\/]Dashboards)/.test(rel);

export function scan(root = dist) {
  const failures = [];
  const reports = [];
  const privateHits = [];
  for (const file of walk(root)) {
    const rel = path.relative(root, file);
    if (!/\.(html|js|txt|xml)$/.test(rel)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const rule of FORBIDDEN) {
      const m = text.match(rule.re);
      if (!m) continue;
      const hit = { rel, rule: rule.id, snippet: m[0].slice(0, 90) };
      if (isPrivateTool(rel)) privateHits.push(hit);
      else (isCmsOwned(rel) ? reports : failures).push(hit);
    }
  }
  return { failures, reports, privateHits };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!fs.existsSync(dist)) {
    console.error("[anonymity-guard] dist/ ontbreekt; draai eerst de build.");
    process.exit(1);
  }
  const { failures, reports, privateHits } = scan();
  if (privateHits.length) {
    const files = new Set(privateHits.map((h) => h.rel.split(/[\/]/)[0]));
    console.log(`[anonymity-guard] let op: ${privateHits.length} treffer(s) in interne werkdocumenten/dashboards (${[...files].join(", ")}) — die horen niet in de publieke webroot.`);
  }
  if (reports.length) {
    console.log(`[anonymity-guard] ${reports.length} treffer(s) in CMS-content (/writing) — oplossen via docs/cms-patches, geen buildfout:`);
    for (const r of reports) console.log(`  ~ ${r.rel} [${r.rule}] "${r.snippet}"`);
  }
  if (failures.length) {
    console.error(`[anonymity-guard] ${failures.length} verboden klantclaim(s) in broncode-eigen output:`);
    for (const f of failures) console.error(`  - ${f.rel} [${f.rule}] "${f.snippet}"`);
    process.exit(1);
  }
  console.log("[anonymity-guard] OK — geen klantresultaatclaims in broncode-eigen output.");
}
