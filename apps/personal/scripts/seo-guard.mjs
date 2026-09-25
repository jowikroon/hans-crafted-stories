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
 *  17. homepage-<title> (/, /nl) = translations.seo.homeTitle, merk-eerst, og/twitter:title gelijk
 *  19. intentwoord-scheiding (plan A.1, HAN-180): homepage-<title> (/, /nl) zonder "inhuren"/"hire",
 *      alle vier /nl-dienstentitels mét "inhuren"; /writing- en /nl/writing-head = translations.seo.writing*
 *      (pariteit prerender ↔ component) en description ≥ 120 tekens
 *  18. geen em dash (AI-merkteken, Hans 2026-09-24): faalt op publieke codestrings
 *      (dist/__edit/source-map.json), index.html en public/ (cowork/ uitgezonderd, interne
 *      documenten die apart offline gaan); geprerenderde pagina's alleen als waarschuwing,
 *      want databasetekst gaat bij het lezen al door lib/noEmDash.ts
 *  20. artikelvloer: minder dan MIN_PRERENDERED_ARTICLES geprerenderde artikelen = build faalt
 *      (een mislukte CMS-fetch zou zonder /writing/:slug-rewrite elk artikel 404 geven)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

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
  // 15b. Artikel: JSON-LD headline en de statische fallback-<h2> dragen dezelfde taal als de <h1>.
  if (route.startsWith("/writing/")) {
    const decode = (t) => t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    // Vergelijkingstekst, geen sanitizer: tags eruit via split (CodeQL js/incomplete-multi-character-sanitization).
    const h1Text = h1 ? decode(h1[1].split(/<[^>]*>/).join("")) : "";
    const headline = html.match(/"headline":"((?:[^"\\]|\\.)*)"/);
    const headlineText = headline ? JSON.parse(`"${headline[1]}"`).replace(/\s+/g, " ").trim() : "";
    if (h1Text && headlineText && h1Text !== headlineText) failures.push(`${rel}: JSON-LD headline "${headlineText.slice(0, 40)}…" ≠ <h1> "${h1Text.slice(0, 40)}…" (andere taalversie)`);
    const fb = html.match(/<article>\s*<h2>([\s\S]*?)<\/h2>/);
    if (fb && h1Text && decode(fb[1]) !== h1Text) failures.push(`${rel}: statische fallback-<h2> ≠ <h1> (andere taalversie)`);
  }

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
    // Scriptblokken verwijderen zonder tag-regex (CodeQL js/bad-tag-filter): scan op indexOf.
    const lower = h.toLowerCase();
    let out = "", pos = 0;
    for (;;) {
      const open = lower.indexOf("<script", pos);
      if (open === -1) { out += h.slice(pos); break; }
      out += h.slice(pos, open) + " ";
      const close = lower.indexOf("</script", open);
      if (close === -1) break;
      pos = lower.indexOf(">", close);
      if (pos === -1) break;
      pos += 1;
    }
    h = out.split(/<[^>]*>/).join(" ").replace(/&[a-z#0-9]+;/gi, " ");
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
    const fg = tok("muted-foreground"), bg = tok("background"), card = tok("card"), mutedSurf = tok("muted"), secondary = tok("secondary"), primary = tok("primary");
    // 2026-09-11: de Kernel-scan vond 36 fails/9 routes op twee GETINTE oppervlakken die deze check
    // niet kende: de muted-kaart (--muted) en primary/5 over --background (CTA-blokken). Alle
    // oppervlakken waar muted-foreground op staat tellen nu mee, inclusief de alpha-blend.
    const blend = (top, alpha, under) => top.map((v, i) => Math.round(v * alpha + under[i] * (1 - alpha)));
    const surfaces = [["background", bg], ["card", card], ["muted", mutedSurf], ["secondary", secondary]];
    if (primary && bg) surfaces.push(["primary/5 op background", blend(primary, 0.05, bg)], ["primary/10 op background", blend(primary, 0.10, bg)]);
    for (const [label, surface] of surfaces) {
      if (fg && surface) { const r = ratio(fg, surface); if (r < 4.5) failures.push(`index.css: --muted-foreground op ${label} = ${r.toFixed(2)}:1 (< 4.5, HAN-145)`); }
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

// 16. Niet-bestaand artikel = noindex (2026-09-11): /writing/:slug valt via de rewrite terug op de
//     SPA; een onbekende slug rendert "Post not found" met HTTP 200. Zonder noindex is dat een
//     indexeerbare soft-404 met self-canonical (Kernel-render /writing/index, run 2026-09-11).
{
  const appDir = path.resolve(distDir, "..");
  const bp = fs.readFileSync(path.join(appDir, "src", "pages", "BlogPostPage.tsx"), "utf8");
  if (!/noindex:\s*isDraft\s*\|\|\s*post === null/.test(bp)) failures.push("BlogPostPage.tsx: niet-gevonden artikel (post === null) krijgt geen noindex — indexeerbare soft-404");
}

// 17. Homepage-<title> in de prerender = translations[lang].seo.homeTitle (2026-09-22): de prerender
//     had een eigen, oudere titel terwijl Index.tsx via useSEO een merk-eerst-titel zette. Google
//     indexeert de prerender (SERP 09-18 toonde de oude titel), dus de titel-hefboom voor de
//     naamquery (plan A.1) was 17 dagen dood zonder dat een guard het zag. Bovendien: merk-eerst.
{
  const appDir = path.resolve(distDir, "..");
  const decode = (t) => t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const tr = fs.readFileSync(path.join(appDir, "src", "data", "translations.ts"), "utf8");
  const titles = [...tr.matchAll(/homeTitle:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (titles.length !== 2) failures.push(`translations.ts: verwacht 2 seo.homeTitle-waarden (en, nl), gevonden ${titles.length}`);
  for (const [file, idx, label] of [[path.join(distDir, "index.html"), 0, "index.html"], [path.join(distDir, "nl", "index.html"), 1, "nl/index.html"]]) {
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const t = html.match(/<title>([\s\S]*?)<\/title>/);
    const got = t ? decode(t[1]).trim() : "";
    const want = titles[idx];
    if (want && got !== want) failures.push(`${label}: <title> "${got}" ≠ translations.seo.homeTitle "${want}" (prerender en component uit elkaar)`);
    if (!/^Hans van Leeuwen/.test(got)) failures.push(`${label}: homepage-<title> begint niet met "Hans van Leeuwen" (merk-eerst, plan A.1)`);
    for (const re of [/<meta property="og:title" content="([^"]*)"/, /<meta name="twitter:title" content="([^"]*)"/]) {
      const m = html.match(re);
      if (m && decode(m[1]).trim() !== got) failures.push(`${label}: og/twitter:title ≠ <title>`);
    }
  }
}

// 19. Intentwoord-scheiding (2026-09-25, HAN-180, plan A.1): op 22-09 kreeg de /nl-homepage via een
//     losse commit weer de titel "… freelance e-commerce manager inhuren" — exact de q2-zin die
//     /nl/interim-ecommerce-manager moet winnen. Guard 17 zag het niet (die test alleen pariteit +
//     merk-eerst). Regel: het intentwoord staat op de dienstenpagina's, niet op de homepage. Plus:
//     de /writing-head komt uit translations.ts (prerender = component) en de description is ≥ 120.
{
  const appDir = path.resolve(distDir, "..");
  const decode = (t) => t.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const titleOf = (file) => {
    if (!fs.existsSync(file)) return null;
    const m = fs.readFileSync(file, "utf8").match(/<title>([\s\S]*?)<\/title>/);
    return m ? decode(m[1]) : "";
  };
  const descOf = (file) => {
    if (!fs.existsSync(file)) return null;
    const m = fs.readFileSync(file, "utf8").match(/<meta name="description" content="([^"]*)"/);
    return m ? decode(m[1]) : "";
  };
  for (const [file, label] of [[path.join(distDir, "index.html"), "index.html"], [path.join(distDir, "nl", "index.html"), "nl/index.html"]]) {
    const t = titleOf(file);
    if (t !== null && /\b(inhuren|hire)\b/i.test(t)) failures.push(`${label}: homepage-<title> "${t}" bevat het intentwoord — dat hoort alleen op de dienstenpagina's (plan A.1, HAN-180)`);
  }
  for (const slug of ["interim-ecommerce-manager", "bol-com-consultant", "amazon-nl-specialist", "ai-ecommerce-automation"]) {
    const t = titleOf(path.join(distDir, "nl", slug, "index.html"));
    if (t === null) failures.push(`nl/${slug}/index.html ontbreekt (guard 19)`);
    else if (!/\binhuren\b/i.test(t)) failures.push(`nl/${slug}: <title> "${t}" mist het intentwoord "inhuren" (plan A.1)`);
  }
  const tr = fs.readFileSync(path.join(appDir, "src", "data", "translations.ts"), "utf8");
  const wt = [...tr.matchAll(/writingTitle:\s*"([^"]+)"/g)].map((m) => m[1]);
  const wd = [...tr.matchAll(/writingDescription:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (wt.length !== 2 || wd.length !== 2) failures.push(`translations.ts: verwacht 2x seo.writingTitle en 2x seo.writingDescription, gevonden ${wt.length}/${wd.length}`);
  for (const [file, idx, label] of [[path.join(distDir, "writing", "index.html"), 0, "writing/index.html"], [path.join(distDir, "nl", "writing", "index.html"), 1, "nl/writing/index.html"]]) {
    const t = titleOf(file); const d = descOf(file);
    if (t === null) { failures.push(`${label} ontbreekt (guard 19)`); continue; }
    if (wt[idx] && t !== wt[idx]) failures.push(`${label}: <title> "${t}" ≠ translations.seo.writingTitle "${wt[idx]}"`);
    if (wd[idx] && d !== wd[idx]) failures.push(`${label}: description ≠ translations.seo.writingDescription (prerender en component uit elkaar)`);
    if ((d || "").length < 120) failures.push(`${label}: description ${(d || "").length} tekens (< 120; engine-drempel P2 desc-short)`);
  }
}

// ── 18. Geen em dash (AI-merkteken). Codestrings en publieke bestanden: build faalt. ──
const EMDASH = /—|&mdash;|&#8212;|&#x2014;/i;
const warnings = [];
try {
  const appDir = path.resolve(distDir, "..");
  const mapFile = path.join(distDir, "__edit", "source-map.json");
  if (!fs.existsSync(mapFile)) {
    failures.push("check 18: dist/__edit/source-map.json ontbreekt (vite-plugins/editSourceMap)");
  } else {
    const map = JSON.parse(fs.readFileSync(mapFile, "utf8"));
    const hits = [];
    for (const [key, parts] of Object.entries(map.elements || {})) {
      const file = key.split(":")[0];
      for (const part of parts) if (EMDASH.test(part.v ?? "")) hits.push(`src/${file}:${part.l} "${String(part.v).trim().slice(0, 60)}"`);
    }
    for (const [value, parts] of Object.entries(map.literals || {})) {
      if (!EMDASH.test(value)) continue;
      for (const part of parts) hits.push(`src/${part.f}:${part.l} "${value.trim().slice(0, 60)}"`);
    }
    for (const h of [...new Set(hits)].slice(0, 30)) failures.push(`em dash in publieke tekst ${h} (gebruik komma, dubbele punt of punt)`);
    if (hits.length > 30) failures.push(`em dash: nog ${hits.length - 30} treffers in publieke code`);
  }
  const files = [path.join(appDir, "index.html")];
  const walkPublic = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== "cowork") walkPublic(p); }
      else if (/\.(html?|txt|xml|json|webmanifest|md|css|js|svg)$/i.test(e.name) || e.name === "_redirects" || e.name === "_headers") files.push(p);
    }
  };
  walkPublic(path.join(appDir, "public"));
  for (const f of files) {
    fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
      if (EMDASH.test(line)) failures.push(`em dash in ${path.relative(appDir, f)}:${i + 1}`);
    });
  }
  // Zichtbare tekst, titel, meta, JSON-LD en tekst-attributen; interne JSON in <script> telt niet mee.
  const { JSDOM } = createRequire(import.meta.url)("jsdom");
  const visibleText = (html) => {
    const { document } = new JSDOM(html).window;
    const parts = [document.title];
    for (const m of document.querySelectorAll("meta[content]")) parts.push(m.getAttribute("content"));
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) parts.push(s.textContent);
    for (const n of document.querySelectorAll("script, style, template")) n.remove();
    for (const el of document.querySelectorAll("[alt], [aria-label], [title], [placeholder]")) {
      for (const a of ["alt", "aria-label", "title", "placeholder"]) if (el.hasAttribute(a)) parts.push(el.getAttribute(a));
    }
    if (document.body) parts.push(document.body.textContent);
    return parts.join("\n");
  };
  const walkDist = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!["cowork", "__edit", "assets"].includes(e.name)) walkDist(p); continue; }
      if (!e.name.endsWith(".html")) continue;
      const rel = path.relative(distDir, p);
      if (fs.existsSync(path.join(appDir, "public", rel))) continue;
      if (EMDASH.test(visibleText(fs.readFileSync(p, "utf8")))) warnings.push(rel);
    }
  };
  walkDist(distDir);
} catch (e) {
  failures.push(`check 18 kon niet draaien: ${e.message}`);
}
if (warnings.length) console.warn(`[seo-guard] let op: em dash in geprerenderde pagina's (databasetekst?): ${warnings.slice(0, 10).join(", ")}`);

// Wederkerigheid vanuit de andere kant: elke /nl-pagina heeft een EN-tweeling en andersom.
for (const route of seen) {
  if (route === "/nl" || route.startsWith("/nl/")) {
    const en = route === "/nl" ? "/" : route.slice(3);
    if (!seen.has(en)) failures.push(`${route}: geen EN-tweeling ${en}`);
  }
}

// 20. Artikelvloer (2026-09-23): zonder /writing/:slug-rewrite geeft een ontbrekend geprerenderd
//     artikel een echte 404. Minder dan MIN_PRERENDERED_ARTICLES artikelpagina's = waarschijnlijk een
//     mislukte CMS-fetch → build faalt i.p.v. de blog te deïndexeren.
{
  const writingDir = path.join(distDir, "writing");
  const articleCount = fs.existsSync(writingDir)
    ? fs.readdirSync(writingDir, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(writingDir, d.name, "index.html"))).length
    : 0;
  const min = Number(process.env.MIN_PRERENDERED_ARTICLES ?? 5);
  if (articleCount < min) failures.push(`dist/writing: ${articleCount} geprerenderde artikelen (< ${min}); CMS-fetch mislukt? Zonder rewrite zou elk artikel 404 geven.`);
}

if (failures.length) {
  console.error(`[seo-guard] ${failures.length} SEO-regressie(s):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`[seo-guard] OK: ${seen.size} pagina's voldoen (20 checks: h1/title/canonical/description/lang/hreflang/inLanguage/noindex/music/404/aliassen/variatie/contrast/artikeltaal/soft404-noindex/home-title-pariteit/intentwoord-scheiding/geen-em-dash/artikelvloer).`);
