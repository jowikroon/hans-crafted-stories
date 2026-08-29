#!/usr/bin/env node
/**
 * SEO-guard — draait na prerender, faalt de build bij regressies (HAN-160 DoD).
 * Checks per gegenereerde dist/**\/index.html:
 *   1. exact 1 <h1> in het volledige document (incl. noscript-fallback)
 *   2. <title> aanwezig en niet leeg
 *   3. rel=canonical aanwezig
 *   4. meta description >= 90 tekens (dubbelquote-parse; apostrofs zijn veilig)
 *   5. <html lang=..> aanwezig; als JSON-LD "inLanguage":"nl" bevat op een
 *      /writing/-pagina, moet html lang="nl" zijn (HAN-158)
 * Ontstaan: dezelfde 2-H1-bug is 4x teruggekomen (HAN-116/125/135/160) omdat
 * geen enkele fix een test had. Deze guard is die test.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "dashboards" || entry.name === "cowork") continue;
      walk(full);
    } else if (entry.name === "index.html") {
      checkFile(full);
    }
  }
}

function checkFile(file) {
  const rel = path.relative(distDir, file) || "index.html";
  const html = fs.readFileSync(file, "utf8");
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) failures.push(`${rel}: ${h1Count} <h1>-tags (verwacht exact 1)`);
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !title[1].trim()) failures.push(`${rel}: lege of ontbrekende <title>`);
  if (!/<link rel="canonical" href="[^"]+"/.test(html)) failures.push(`${rel}: canonical ontbreekt`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) failures.push(`${rel}: meta description ontbreekt`);
  else if (desc[1].length < 90) failures.push(`${rel}: meta description ${desc[1].length} tekens (< 90)`);
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/);
  if (!lang) failures.push(`${rel}: html lang ontbreekt`);
  else if (rel.startsWith("writing" + path.sep) && html.includes('"inLanguage":"nl"') && lang[1] !== "nl") {
    failures.push(`${rel}: inLanguage nl maar html lang="${lang[1]}" (HAN-158)`);
  }
}

if (!fs.existsSync(distDir)) {
  console.error("[seo-guard] dist/ niet gevonden — draai na de build");
  process.exit(1);
}
walk(distDir);
if (failures.length) {
  console.error(`[seo-guard] ${failures.length} SEO-regressie(s):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("[seo-guard] OK — alle gegenereerde pagina's voldoen (h1/title/canonical/description/lang).");
