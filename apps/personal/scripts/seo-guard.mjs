#!/usr/bin/env node
/**
 * SEO-guard — draait na prerender, faalt de build bij regressies.
 *
 * Ontstaan: dezelfde 2-H1-bug is 4x teruggekomen (HAN-116/125/135/160) omdat
 * geen enkele fix een test had. Op 2026-09-05 uitgebreid met de taal- en
 * hreflang-regressies uit HAN-167/HAN-83, de soft-404 uit HAN-138 en de dode
 * muzieklinks uit HAN-146. Elke check hieronder is een bug die live heeft gestaan.
 *
 * Checks per dist/**\/index.html:
 *   1. exact 1 <h1> in het volledige document (incl. noscript-fallback)
 *   2. <title> aanwezig en niet leeg
 *   3. rel=canonical aanwezig én gelijk aan de eigen URL (EN-pad of /nl-pad)
 *   4. meta description >= 90 tekens
 *   5. html[lang] = "nl" onder /nl/, anders "en" (artikelen: volgt JSON-LD inLanguage)
 *   6. hreflang: óf géén set, óf exact één set {en, nl, x-default}, wederkerig,
 *      en != nl, x-default = en, zonder duplicaten — en de hreflang-nl van een
 *      EN-pagina moet bestaan als dist/nl/<pad>/index.html (en andersom)
 *   7. JSON-LD "inLanguage" op WebPage/ProfilePage/CollectionPage = html[lang]
 *   8. og:locale en content-language volgen html[lang]
 *   9. geen "noindex" in indexeerbare pagina's (404.html en gated routes uitgezonderd)
 *  10. geen /music/<slug>-links naar tracks die niet publiek zijn
 *  11. dist/404.html bestaat, is noindex en heeft géén canonical
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const BASE = "https://hansvanleeuwen.com";
const failures = [];
const seen = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["assets", "dashboards", "cowork", "tools", "extensions", "artist-radar", "cases", "img"].includes(entry.name)) continue;
      walk(full);
    } else if (entry.name === "index.html") {
      checkFile(full);
    }
  }
}

function routeOf(file) {
  const rel = path.relative(distDir, path.dirname(file)).split(path.sep).join("/");
  return rel ? `/${rel}` : "/";
}

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function checkFile(file) {
  const route = routeOf(file);
  const rel = route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
  const html = fs.readFileSync(file, "utf8");
  seen.add(route);

  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) failures.push(`${rel}: ${h1Count} <h1>-tags (verwacht exact 1)`);

  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !title[1].trim()) failures.push(`${rel}: lege of ontbrekende <title>`);

  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  const expectedCanonical = `${BASE}${route === "/" ? "/" : route}`;
  if (!canonical) failures.push(`${rel}: canonical ontbreekt`);
  else if (canonical !== expectedCanonical) failures.push(`${rel}: canonical ${canonical} ≠ ${expectedCanonical}`);

  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  if (desc === null) failures.push(`${rel}: meta description ontbreekt`);
  else if (desc.length < 90) failures.push(`${rel}: meta description ${desc.length} tekens (< 90)`);

  const lang = attr(html, /<html[^>]*\blang="([^"]+)"/);
  const isNl = route === "/nl" || route.startsWith("/nl/");
  const isArticle = route.startsWith("/writing/") || route === "/writing";
  if (!lang) failures.push(`${rel}: html lang ontbreekt`);
  else if (isNl && lang !== "nl") failures.push(`${rel}: /nl-pad maar html lang="${lang}"`);
  else if (!isNl && !isArticle && lang !== "en") failures.push(`${rel}: EN-pad maar html lang="${lang}"`);

  // 7 + 8: taalsignalen consistent
  const inLang = [...html.matchAll(/"inLanguage":\s*"([a-z]{2})"/g)].map((m) => m[1]);
  if (lang && inLang.length && inLang.some((l) => l !== lang)) {
    failures.push(`${rel}: JSON-LD inLanguage [${[...new Set(inLang)].join(",")}] ≠ html lang="${lang}"`);
  }
  const ogLocale = attr(html, /<meta property="og:locale" content="([^"]+)"/);
  if (lang && ogLocale && !ogLocale.startsWith(lang)) failures.push(`${rel}: og:locale ${ogLocale} ≠ html lang="${lang}"`);
  const contentLang = attr(html, /<meta http-equiv="content-language" content="([^"]+)"/);
  if (lang && contentLang && contentLang !== lang) failures.push(`${rel}: content-language ${contentLang} ≠ html lang="${lang}"`);

  // 6: hreflang
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
  if (alts.length) {
    const codes = alts.map((a) => a.lang);
    if (new Set(codes).size !== codes.length) failures.push(`${rel}: dubbele hreflang-codes (${codes.join(",")})`);
    if (codes.length !== 3 || !["en", "nl", "x-default"].every((c) => codes.includes(c))) {
      failures.push(`${rel}: hreflang-set moet exact {en, nl, x-default} zijn, is {${codes.join(",")}}`);
    }
    const by = Object.fromEntries(alts.map((a) => [a.lang, a.href]));
    if (by.en && by.nl && by.en === by.nl) failures.push(`${rel}: hreflang en en nl wijzen naar dezelfde URL (${by.en})`);
    if (by["x-default"] && by["x-default"] !== by.en) failures.push(`${rel}: x-default (${by["x-default"]}) ≠ en (${by.en})`);
    const self = isNl ? by.nl : by.en;
    if (self && canonical && self !== canonical) failures.push(`${rel}: hreflang-self ${self} ≠ canonical ${canonical}`);
    for (const [code, href] of Object.entries(by)) {
      // Exacte origin-match (CodeQL js/incomplete-url-substring-sanitization): "https://hansvanleeuwen.com.evil" mag niet slagen.
      if (href !== `${BASE}/` && !href.startsWith(`${BASE}/`)) { failures.push(`${rel}: hreflang ${code} niet op ${BASE} (${href})`); continue; }
      const p = href.slice(BASE.length) || "/";
      const target = path.join(distDir, p === "/" ? "index.html" : `${p.slice(1)}/index.html`);
      if (!fs.existsSync(target)) failures.push(`${rel}: hreflang ${code} → ${href} bestaat niet in dist (wederkerigheid gebroken)`);
    }
  }

  // 9: geen noindex op indexeerbare pagina's
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) failures.push(`${rel}: noindex in indexeerbare pagina`);

  // 10: /music-links alleen naar publieke tracks
  if (route === "/music" || route === "/") {
    const links = [...html.matchAll(/href="\/music\/([a-z0-9-]+)"/g)].map((m) => m[1]);
    for (const slug of new Set(links)) {
      const target = path.join(distDir, "music", slug, "index.html");
      if (!fs.existsSync(target) && !PUBLIC_MUSIC_SLUGS.has(slug)) failures.push(`${rel}: link naar /music/${slug} zonder publieke pagina (HAN-146)`);
    }
  }
}

// Publieke tracks: alles in src/data/music.ts dat niet login-gated (soundcloud) is.
const PUBLIC_MUSIC_SLUGS = (() => {
  try {
    const src = fs.readFileSync(path.resolve(distDir, "..", "src", "data", "music.ts"), "utf8");
    const out = new Set();
    for (const block of src.split(/\n  \{\n/)) {
      const slug = block.match(/slug: "([^"]+)"/);
      const provider = block.match(/provider: "([^"]+)"/);
      if (slug && provider && provider[1] !== "soundcloud") out.add(slug[1]);
    }
    return out;
  } catch {
    return new Set();
  }
})();

if (!fs.existsSync(distDir)) {
  console.error("[seo-guard] dist/ niet gevonden — draai na de build");
  process.exit(1);
}
walk(distDir);

// 11: echte 404-pagina
const notFound = path.join(distDir, "404.html");
if (!fs.existsSync(notFound)) failures.push("404.html ontbreekt (HAN-138: onbekende paden moeten HTTP 404 geven)");
else {
  const html = fs.readFileSync(notFound, "utf8");
  if (!/<meta name="robots" content="[^"]*noindex/i.test(html)) failures.push("404.html: geen noindex");
  if (/<link rel="canonical"/.test(html)) failures.push("404.html: mag geen canonical dragen");
  if (/<link rel="alternate" hreflang/.test(html)) failures.push("404.html: mag geen hreflang dragen");
}

// Wederkerigheid vanuit de andere kant: elke /nl-pagina heeft een EN-tweeling en andersom.
for (const route of seen) {
  if (route === "/nl" || route.startsWith("/nl/")) {
    const en = route === "/nl" ? "/" : route.slice(3);
    if (!seen.has(en)) failures.push(`${route}: geen EN-tweeling ${en}`);
  }
}

if (failures.length) {
  console.error(`[seo-guard] ${failures.length} SEO-regressie(s):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`[seo-guard] OK — ${seen.size} pagina's voldoen (h1/title/canonical/description/lang/hreflang/inLanguage/noindex/music/404).`);
