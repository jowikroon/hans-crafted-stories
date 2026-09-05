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
 *  12. elke <Navigate to> in AnimatedRoutes.tsx bestaat als redirect in vercel.json
 *  15. artikeltaal volgt het artikel (primaryBlogPostLang), niet de UI-taal — geen hydratie-flip
 *      (zonder catch-all rewrite geeft een client-side alias anders 404 — les #29)
 *  13. de dienstenpagina's delen geen lange tekstreeksen (12-woord-shingles) buiten
 *      de bewust gedeelde blokken (tarief, byline, ervaring) — sjabloon-variatie
 *  14. CSS-tokens uit index.css: muted-foreground op background/card ≥ 4.5:1 en
 *      --w2-muted op --w2-paper ≥ 4.5:1 (HAN-145, zonder browser)
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


/* ───────────── 12. <Navigate> ↔ vercel.json redirects ───────────── */
{
  const appDir = path.resolve(distDir, "..");
  try {
    const routesSrc = fs.readFileSync(path.join(appDir, "src", "components", "AnimatedRoutes.tsx"), "utf8");
    const vercel = JSON.parse(fs.readFileSync(path.join(appDir, "vercel.json"), "utf8"));
    const sources = new Set((vercel.redirects || []).map((r) => r.source));
    const rewrites = new Set((vercel.rewrites || []).map((r) => r.source));
    for (const m of routesSrc.matchAll(/<Route path="([^"]+)" element=\{<Navigate to="([^"`]+)"/g)) {
      const from = m[1];
      if (from.includes(":") || from === "*") continue;
      const covered = sources.has(from) || [...rewrites].some((rw) => rw === from || (rw.startsWith("/(") && new RegExp("^" + rw.replace(/\(/g, "(?:") + "$").test(from)));
      if (!covered) failures.push(`AnimatedRoutes: <Navigate> alias ${from} → ${m[2]} staat niet in vercel.json redirects (geeft 404 zonder catch-all)`);
    }
  } catch (e) {
    failures.push(`check 12 kon niet draaien: ${e.message}`);
  }
}

/* ───────────── 13. sjabloon-variatie tussen dienstenpagina's ───────────── */
{
  const pages = ["interim-ecommerce-manager", "amazon-nl-specialist", "bol-com-consultant", "ai-ecommerce-automation"];
  // Reeksen die op ALLE vier pagina's staan zijn het bewuste gedeelde skelet (tarief, byline,
  // ervaring, cta) en tellen niet mee; reeksen die op 2 of 3 pagina's staan zijn kopieertekst.
  const N = 12, MAX_PAIRWISE = 10;
  const textOf = (file) => {
    if (!fs.existsSync(file)) return null;
    let h = fs.readFileSync(file, "utf8");
    h = h.replace(/[\s\S]*?<div id="root">/, "").replace(/<footer[\s\S]*$/, "");
    h = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
    return h.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôöùûüç€%.,'-]+/g, " ").trim().split(/\s+/);
  };
  const shingles = (words) => { const out = new Set(); for (let i = 0; i + N <= words.length; i++) out.add(words.slice(i, i + N).join(" ")); return out; };
  for (const lang of ["", "nl/"]) {
    const sets = pages.map((p) => ({ p, s: shingles(textOf(path.join(distDir, lang + p, "index.html")) || []) }));
    const count = new Map();
    for (const { s: set } of sets) for (const sh of set) count.set(sh, (count.get(sh) || 0) + 1);
    for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
      let shared = 0; const sample = [];
      for (const sh of sets[i].s) if (sets[j].s.has(sh) && count.get(sh) < sets.length) { shared++; if (sample.length < 2) sample.push(sh.slice(0, 60)); }
      if (shared > MAX_PAIRWISE) failures.push(`${lang}${sets[i].p} ↔ ${lang}${sets[j].p}: ${shared} gekopieerde 12-woordreeksen (> ${MAX_PAIRWISE}), bv. "${sample.join('" / "')}"`);
    }
  }
}

/* ───────────── 14. contrast van CSS-tokens (zonder browser) ───────────── */
{
  const appDir = path.resolve(distDir, "..");
  const hslToRgb = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = s * Math.min(l, 1 - l); const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)); };
  const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  try {
    const css = fs.readFileSync(path.join(appDir, "src", "index.css"), "utf8");
    const root = css.match(/:root\s*\{([\s\S]*?)\}/)[1];
    const tok = (name) => { const m = root.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%`)); return m ? hslToRgb(+m[1], +m[2], +m[3]) : null; };
    const fg = tok("muted-foreground"), bg = tok("background"), card = tok("card");
    for (const [label, surface] of [["background", bg], ["card", card]]) {
      if (fg && surface) { const r = ratio(fg, surface); if (r < 4.5) failures.push(`index.css: --muted-foreground op --${label} = ${r.toFixed(2)}:1 (< 4.5, HAN-145)`); }
    }
    const w2 = fs.readFileSync(path.join(appDir, "src", "styles", "writing-v2.css"), "utf8");
    const first = w2.slice(0, w2.indexOf("--w2-muted:") + 40);
    const muted = first.match(/--w2-muted:\s*(#[0-9a-fA-F]{6})/), paper = w2.match(/--w2-paper:\s*(#[0-9a-fA-F]{6})/);
    if (muted && paper) { const r = ratio(hexToRgb(muted[1]), hexToRgb(paper[1])); if (r < 4.5) failures.push(`writing-v2.css: --w2-muted ${muted[1]} op --w2-paper ${paper[1]} = ${r.toFixed(2)}:1 (< 4.5)`); }
  } catch (e) {
    failures.push(`check 14 kon niet draaien: ${e.message}`);
  }
}

// 15. Artikeltaal volgt het artikel, niet de UI-taal (HAN-167 hydratie-flip): BlogPostPage mag
//     content/title/excerpt nooit op de bezoekerstaal (`lang`) kiezen en moet primaryBlogPostLang gebruiken.
{
  const appDir = path.resolve(distDir, "..");
  const bp = fs.readFileSync(path.join(appDir, "src", "pages", "BlogPostPage.tsx"), "utf8");
  if (/\blang === "nl" && post\.(content|title|excerpt)_nl/.test(bp)) failures.push("BlogPostPage.tsx: artikelvelden gekozen op UI-taal (lang) i.p.v. articleLang — artikel flipt na hydratie");
  if (!bp.includes("primaryBlogPostLang(")) failures.push("BlogPostPage.tsx: gebruikt primaryBlogPostLang niet");
  const pr = fs.readFileSync(path.join(appDir, "scripts", "prerender.mjs"), "utf8");
  if (!/postLang = primaryBlogPostLang\(/.test(pr)) failures.push("prerender.mjs: postLang niet via primaryBlogPostLang");
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
console.log(`[seo-guard] OK — ${seen.size} pagina's voldoen (15 checks: h1/title/canonical/description/lang/hreflang/inLanguage/noindex/music/404/aliassen/variatie/contrast/artikeltaal).`);
