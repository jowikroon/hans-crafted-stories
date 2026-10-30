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
 *   3. rel=canonical aanwezig én gelijk aan de eigen URL (NL-pad of /en-pad)
 *   4. meta description >= 90 tekens
 *   5. html[lang] = "en" onder /en/, anders "nl" (artikelen: volgt JSON-LD inLanguage; music/portal zijn EN)
 *   6. hreflang: óf géén set, óf exact één set {en, nl, x-default}, wederkerig,
 *      en != nl, x-default = nl (Nederlands-eerst 2026-10-07), zonder duplicaten — en de
 *      hreflang-en van een NL-pagina moet bestaan als dist/en/<pad>/index.html (en andersom)
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
 *  17. homepage-<title> (/, /en) = translations.seo.homeTitle, merk-eerst, og/twitter:title gelijk
 *  19. intentwoord-scheiding (plan A.1, HAN-180): homepage-<title> (/, /en) zonder "inhuren"/"hire",
 *      alle vier NL-dienstentitels mét "inhuren"; /writing- en /en/writing-head = translations.seo.writing*
 *      (pariteit prerender ↔ component) en description ≥ 120 tekens
 *  20. artikelparen (optie A, 2026-10-02): elke /en/writing/<slug> heeft een NL-tweeling met
 *      wederkerige hreflang, en de HTML bevat geen ?lang=en-links meer
 *  21. directory-listings (2026-10-02, HAN-182): elke map in dist/ zónder eigen index.html maar mét
 *      geprerenderde kinderen (bv. /en na PR #388, /cases op 11-09) is een Vercel directory-listing
 *      (200 "Index of …", geen canonical/robots) tenzij vercel.json er een redirect voor heeft
 *  22. GSC-vraagtermen (2026-10-05): NL-title en H1 van amazon-nl-specialist en interim-ecommerce-manager
 *      bevatten de zoekvraag uit GSC ("amazon specialist", "e-commerce specialist")
 *  23. interne links in de juiste taal: /en-pagina linkt niet naar /writing/<slug> als de EN-versie
 *      bestaat, geen dode /en/writing-links, en elke /en-route heeft een inkomende link van een andere
 *      /en-pagina (HAN-184, 2026-10-14)
 *  24. Cloudflare-mirror: dist/_headers zet X-Robots-Tag noindex op *.pages.dev, nooit op het productiedomein
 *  25. app-routes (rewrites naar de homepage-snapshot) krijgen X-Robots-Tag noindex via vercel.json, en
 *      robots.txt blokkeert die paden niet voor zoekmachines en blokkeert nergens een publieke pagina
 *  26. /writing/index en gokbare/oude URL's (/contact, /services, ...) zijn 308's naar bestaande pagina's
 *  28. geen rewrite maakt een onbekend /writing-, /en/writing-, /work- of /music-pad tot 200 (soft-404)
 *  27. dist/feed.xml is geldige RSS 2.0 met alle geprerenderde artikelen; /rss.xml is een 308 erheen
 *  18. geen em dash (AI-merkteken, Hans 2026-09-24): faalt op publieke codestrings
 *      (dist/__edit/source-map.json), index.html en public/ (cowork/ uitgezonderd, interne
 *      documenten die apart offline gaan); geprerenderde pagina's alleen als waarschuwing,
 *      want databasetekst gaat bij het lezen al door lib/noEmDash.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const BASE = "https://hansvanleeuwen.com";
const failures = [];
const seen = new Set();
// Spiegel van LOCALIZED_ROUTES in src/lib/i18n/routes.ts: deze paden bestaan in NL (kaal) en EN (/en).
const LOCALIZED_BASE = new Set(["/", "/about", "/work", "/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager", "/ai-ecommerce-automation", "/webshopbeheerder-inhuren", "/privacy", "/rates", "/writing"]);

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
  // Nederlands-eerst (2026-10-07): kale paden zijn NL, /en/* is EN. Niet-gelokaliseerde
  // routes (music, portal, cms, artikelen) hebben hun eigen taal.
  const isEn = route === "/en" || route.startsWith("/en/");
  const isArticle = route.startsWith("/writing/") || route === "/writing";
  const isEnArticle = route.startsWith("/en/writing/");
  const isLocalizedNl = !isEn && LOCALIZED_BASE.has(route);
  if (!lang) failures.push(`${rel}: html lang ontbreekt`);
  else if (isEn && lang !== "en") failures.push(`${rel}: /en-pad maar html lang="${lang}"`);
  else if (isLocalizedNl && !isArticle && lang !== "nl") failures.push(`${rel}: NL-pad maar html lang="${lang}"`);
  // 15b. Artikel: JSON-LD headline en de statische fallback-<h2> dragen dezelfde taal als de <h1>.
  if (route.startsWith("/writing/") || isEnArticle) {
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
    if (by["x-default"] && by["x-default"] !== by.nl) failures.push(`${rel}: x-default (${by["x-default"]}) ≠ nl (${by.nl})`);
    // Self-verwijzing volgt de taal van de pagina (artikelen: /writing/<slug> is NL,
    // /en/writing/<slug> is EN; optie A 2026-10-02), niet alleen het /nl-prefix.
    const self = (lang ?? (isEn ? "en" : "nl")) === "nl" ? by.nl : by.en;
    if (!self) failures.push(`${rel}: hreflang-set zonder verwijzing naar zichzelf (${lang})`);
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

// Publieke tracks: alles in src/data/music.ts (sinds 2026-10-16 zijn ook de SoundCloud-concepten publiek).
const PUBLIC_MUSIC_SLUGS = (() => {
  try {
    const src = fs.readFileSync(path.resolve(distDir, "..", "src", "data", "music.ts"), "utf8");
    const out = new Set();
    for (const block of src.split(/\n  \{\n/)) {
      const slug = block.match(/slug: "([^"]+)"/);
      const provider = block.match(/provider: "([^"]+)"/);
      if (slug && provider) out.add(slug[1]);
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
  const pages = ["interim-ecommerce-manager", "amazon-nl-specialist", "bol-com-consultant", "ai-ecommerce-automation", "webshopbeheerder-inhuren"];
  // Reeksen die op ALLE vijf pagina's staan zijn het bewuste gedeelde skelet (tarief, byline,
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
  for (const lang of ["", "en/"]) {
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
  // translations.ts: index 0 = en, index 1 = nl. dist/index.html is NL, dist/en/index.html is EN.
  for (const [file, idx, label] of [[path.join(distDir, "en", "index.html"), 0, "en/index.html"], [path.join(distDir, "index.html"), 1, "index.html"]]) {
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
  for (const [file, label] of [[path.join(distDir, "index.html"), "index.html"], [path.join(distDir, "en", "index.html"), "en/index.html"]]) {
    const t = titleOf(file);
    if (t !== null && /\b(inhuren|hire)\b/i.test(t)) failures.push(`${label}: homepage-<title> "${t}" bevat het intentwoord — dat hoort alleen op de dienstenpagina's (plan A.1, HAN-180)`);
  }
  for (const slug of ["interim-ecommerce-manager", "bol-com-consultant", "amazon-nl-specialist", "ai-ecommerce-automation", "webshopbeheerder-inhuren"]) {
    const t = titleOf(path.join(distDir, slug, "index.html"));
    if (t === null) failures.push(`${slug}/index.html ontbreekt (guard 19)`);
    else if (!/\binhuren\b/i.test(t)) failures.push(`${slug}: <title> "${t}" mist het intentwoord "inhuren" (plan A.1)`);
  }
  const tr = fs.readFileSync(path.join(appDir, "src", "data", "translations.ts"), "utf8");
  const wt = [...tr.matchAll(/writingTitle:\s*"([^"]+)"/g)].map((m) => m[1]);
  const wd = [...tr.matchAll(/writingDescription:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (wt.length !== 2 || wd.length !== 2) failures.push(`translations.ts: verwacht 2x seo.writingTitle en 2x seo.writingDescription, gevonden ${wt.length}/${wd.length}`);
  for (const [file, idx, label] of [[path.join(distDir, "en", "writing", "index.html"), 0, "en/writing/index.html"], [path.join(distDir, "writing", "index.html"), 1, "writing/index.html"]]) {
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

// 20. Artikelparen (optie A, 2026-10-02): elke /en/writing/<slug> heeft een NL-tweeling
//     /writing/<slug> die terugverwijst, en nergens in dist staat nog een ?lang=en-link
//     (die gaat via een 308 en kost een hop).
for (const route of seen) {
  if (!route.startsWith("/en/writing/")) continue;
  const nlRoute = route.slice(3);
  const nlFile = path.join(distDir, nlRoute.slice(1), "index.html");
  if (!fs.existsSync(nlFile)) { failures.push(`${route}: geen NL-tweeling ${nlRoute}`); continue; }
  const nlHtml = fs.readFileSync(nlFile, "utf8");
  if (!nlHtml.includes(`hreflang="en" href="${BASE}${route}"`)) failures.push(`${nlRoute}: hreflang en verwijst niet naar ${route}`);
}
{
  const hits = [];
  const scan = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!["assets", "cowork", "__edit"].includes(e.name)) scan(p); continue; }
      if (e.name.endsWith(".html") && /href="[^"]*\/writing\/[^"?]+\?lang=en/.test(fs.readFileSync(p, "utf8"))) hits.push(path.relative(distDir, p));
    }
  };
  scan(distDir);
  if (hits.length) failures.push(`?lang=en-links in de HTML (gebruik /en/writing/<slug>): ${hits.slice(0, 5).join(", ")}`);
}

// 21. Directory-listings (2026-10-02, HAN-182): PR #388 schreef dist/en/writing/<slug>/index.html en
//     daarmee ontstonden /en en /en/writing als Vercel directory-listing (HTTP 200 "Index of /en/",
//     geen canonical, geen robots) — hetzelfde lek als /cases op 2026-09-11 (les #37). Elke map in dist/
//     zonder eigen index.html maar met geprerenderde kinderen heeft een exacte redirect in vercel.json.
{
  const appDir = path.resolve(distDir, "..");
  try {
    const vercel = JSON.parse(fs.readFileSync(path.join(appDir, "vercel.json"), "utf8"));
    const sources = new Set((vercel.redirects || []).map((r) => r.source));
    const skip = new Set(["assets", "dashboards", "cowork", "tools", "extensions", "artist-radar", "img", "__edit", "fonts", "images", "icons", "og", "cv", "logos", "media", "audio", "video", "docs", "files", "data", "pdf", "static", "js", "css"]);
    const bare = [];
    // Geeft true als ergens onder `dir` een index.html ligt (ook kleinkinderen: /en had alleen
    // /en/writing/<slug>/index.html en was tóch een listing).
    const hasPageBelow = (dir) => fs.readdirSync(dir, { withFileTypes: true }).some((c) => c.isDirectory() && !skip.has(c.name) && (fs.existsSync(path.join(dir, c.name, "index.html")) || hasPageBelow(path.join(dir, c.name))));
    const walkDirs = (dir, rel) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory() || skip.has(e.name)) continue;
        const full = path.join(dir, e.name);
        const route = `${rel}/${e.name}`;
        const hasIndex = fs.existsSync(path.join(full, "index.html"));
        if (!hasIndex && hasPageBelow(full) && !sources.has(route)) bare.push(route);
        walkDirs(full, route);
      }
    };
    walkDirs(distDir, "");
    for (const route of bare) failures.push(`${route}: map zonder index.html maar met geprerenderde kinderen = Vercel directory-listing; voeg een redirect voor "${route}" toe aan vercel.json`);
  } catch (e) {
    failures.push(`check 21 kon niet draaien: ${e.message}`);
  }
}

// 22. GSC-vraagtermen (2026-10-05, plan A/B): GSC 28d (t/m 03-10) toonde dat Google voor
//     "amazon specialist" (38 impr) en "e commerce specialist inhuren" (18 impr) de EN-pagina's koos en
//     de NL-dienstpagina's op pos 41-43 liet staan, omdat die termen niet in de NL-title/H1 stonden.
//     Regel: de prerender-<title> én de <h1> van deze NL-pagina's dragen de echte zoekvraag.
{
  const ENT = { "&amp;": "&", "&#x27;": "'", "&#39;": "'", "&quot;": '"' };
  // Eén pass: geen dubbele unescape (CodeQL js/double-escaping, PR #391).
  const dec = (t) => t.replace(/<[^>]+>/g, " ").replace(/&amp;|&#x27;|&#39;|&quot;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
  const targets = [
    ["amazon-nl-specialist", /\bamazon specialist\b/i, "amazon specialist"],
    ["interim-ecommerce-manager", /\be-commerce specialist\b/i, "e-commerce specialist"],
  ];
  for (const [slug, re, term] of targets) {
    const file = path.join(distDir, slug, "index.html");
    if (!fs.existsSync(file)) { failures.push(`${slug}/index.html ontbreekt (guard 22)`); continue; }
    const html = fs.readFileSync(file, "utf8");
    const t = dec((html.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1]);
    const description = dec((html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1]);
    if (t.length > 60) failures.push(`${slug}: title is ${t.length} tekens (max 60, guard 22)`);
    if (description.length > 160) failures.push(`${slug}: meta description is ${description.length} tekens (max 160, guard 22)`);
    const h = dec((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1]);
    if (!re.test(t)) failures.push(`${slug}: <title> "${t}" mist GSC-vraagterm "${term}" (guard 22)`);
    if (!re.test(h)) failures.push(`${slug}: <h1> "${h}" mist GSC-vraagterm "${term}" (guard 22)`);
  }
}

// 23. Interne links in de juiste taal (2026-10-14, HAN-184/HAN-185-run): na Dutch-first (PR #396)
//     linkten de EN-dienstpagina's nog naar de NL-artikelen (/writing/<slug>, label "(Dutch)") terwijl
//     /en/writing/<slug> bestaat — Google vond /en/interim-ecommerce-manager daardoor alleen via hreflang
//     ("URL is unknown to Google"). Drie regels op de geprerenderde HTML:
//     a. een /en-pagina linkt niet naar /writing/<slug> als dist/en/writing/<slug> bestaat (eigen NL-tweeling
//        = taalknop, toegestaan; links in artikelteksten = data -> waarschuwing);
//     b. elke href="/en/writing/<slug>" bestaat als geprerenderde pagina (geen dode EN-artikellink);
//     c. elke /en-route (behalve /en zelf) krijgt minstens één interne link vanaf een ándere /en-pagina.
{
  const pageExists = (route) => fs.existsSync(path.join(distDir, route.replace(/^\//, ""), "index.html"));
  const inbound = new Map();
  const warn23 = [];
  for (const route of seen) {
    const file = route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html");
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    // noscript-fallback telt niet mee: die tekst ziet geen renderende crawler als navigatie (les #47)
    let html = raw;
    for (let i = html.indexOf("<noscript"); i !== -1; i = html.indexOf("<noscript")) {
      const end = html.indexOf("</noscript>", i);
      if (end === -1) break;
      html = html.slice(0, i) + html.slice(end + 11);
    }
    const isEn = route === "/en" || route.startsWith("/en/");
    const hrefs = new Set();
    for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) hrefs.add(m[1].replace(/\/$/, "") || "/");
    for (const h of hrefs) {
      const art = /^\/writing\/([a-z0-9-]+)$/.exec(h);
      if (isEn && art && pageExists(`/en/writing/${art[1]}`) && route !== `/en/writing/${art[1]}`) {
        const msg = `${route}: linkt naar NL-artikel ${h} terwijl /en/writing/${art[1]} bestaat (guard 23a)`;
        // Links in artikelteksten komen uit blog_posts.content (data, geen code): waarschuwing tot de
        // data is bijgewerkt. Pagina's uit code (dienstpagina's, /en/work, /en) falen hard.
        if (route.startsWith("/en/writing/")) warn23.push(msg); else failures.push(msg);
      }
      if (/^\/en\/writing\/[a-z0-9-]+$/.test(h) && !pageExists(h)) failures.push(`${route}: dode EN-artikellink ${h} (guard 23b)`);
      if (isEn && (h === "/en" || h.startsWith("/en/")) && h !== route) inbound.set(h, (inbound.get(h) || 0) + 1);
    }
  }
  for (const route of seen) {
    if (!route.startsWith("/en/")) continue;
    if (!inbound.get(route)) failures.push(`${route}: geen enkele interne link vanaf een andere /en-pagina (guard 23c, HAN-184)`);
  }
  if (warn23.length) console.warn(`[seo-guard] let op (guard 23a, data): ${warn23.length} NL-artikellink(s) in Engelse artikelteksten, werk blog_posts.content bij: ${warn23.slice(0, 10).join(" | ")}`);
}

// ── Hulpjes voor guards 24-27: vercel.json-source → RegExp (path-to-regexp-subset dat vercel.json
//    gebruikt, nagemeten met @vercel/routing-utils) en robots.txt-matching volgens RFC 9309. ──
const appDirG = path.resolve(distDir, "..");
const vercelCfg = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(appDirG, "vercel.json"), "utf8")); }
  catch (e) { failures.push(`guards 24-27: vercel.json onleesbaar (${e.message})`); return { redirects: [], rewrites: [], headers: [] }; }
})();
function vercelSourceRegex(src) {
  let re = "";
  for (let i = 0; i < src.length;) {
    const rest = src.slice(i);
    const param = /^\/:([A-Za-z0-9_]+)([*+?])?/.exec(rest);
    if (param) { re += param[2] === "*" ? "(?:/.*)?" : param[2] === "+" ? "/.+" : param[2] === "?" ? "(?:/[^/]+)?" : "/[^/]+"; i += param[0].length; continue; }
    const group = /^\((?:[^()\\]|\\.)*\)/.exec(rest);
    if (group) { re += `(?:${group[0].slice(1, -1)})`; i += group[0].length; continue; }
    re += src[i].replace(/[.+?^${}|[\]\\*]/g, "\\$&");
    i += 1;
  }
  return new RegExp(`^${re}$`);
}
// Concrete voorbeeldpaden uit een source: (a|b) wordt elk alternatief, :param en (.*) worden "x".
function expandSource(src) {
  const alt = /\(([A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)+)\)/.exec(src);
  if (alt) return alt[1].split("|").flatMap((a) => expandSource(src.slice(0, alt.index) + a + src.slice(alt.index + alt[0].length)));
  return [src.replace(/:[A-Za-z0-9_]+[*+?]?/g, "x").replace(/\(\.\*\)/g, "x")];
}
const pageExistsG = (route) => fs.existsSync(route === "/" ? path.join(distDir, "index.html") : path.join(distDir, route.slice(1), "index.html"));
const robotsHeaderRules = (vercelCfg.headers || [])
  .filter((h) => (h.headers || []).some((x) => x.key.toLowerCase() === "x-robots-tag" && /\bnoindex\b/i.test(x.value)))
  .map((h) => vercelSourceRegex(h.source));
const noindexByHeader = (p) => robotsHeaderRules.some((re) => re.test(p));

// 24. Cloudflare Pages-mirror noindex (2026-10-23): hansvanleeuwen.pages.dev gaf 200 met
//     "index, follow" (canonical wees wel naar .com) = een tweede kopie van de site in de indexpool.
//     dist/_headers (Cloudflare leest het, Vercel negeert het) moet voor de pages.dev-host én de
//     preview-hosts X-Robots-Tag: noindex zetten, en mag dat nergens voor het productiedomein doen.
{
  const file = path.join(distDir, "_headers");
  if (!fs.existsSync(file)) failures.push("dist/_headers ontbreekt: de Cloudflare-mirror krijgt geen noindex (guard 24)");
  else {
    const rules = new Map();
    let current = null;
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (!/^\s/.test(line)) { current = t; if (!rules.has(t)) rules.set(t, []); continue; }
      if (current) rules.get(current).push(t);
    }
    const isNoindex = (h) => /^x-robots-tag:\s*.*\bnoindex\b/i.test(h);
    for (const pat of ["https://:project.pages.dev/*", "https://:version.:project.pages.dev/*"]) {
      if (!(rules.get(pat) || []).some(isNoindex)) failures.push(`dist/_headers: geen "X-Robots-Tag: noindex" onder ${pat}: de Cloudflare-mirror is indexeerbaar (guard 24)`);
    }
    for (const [pat, hs] of rules) {
      if (!/\.pages\.dev\//.test(pat) && hs.some(isNoindex)) failures.push(`dist/_headers: regel "${pat}" zet noindex buiten pages.dev, dus ook op hansvanleeuwen.com (guard 24)`);
    }
  }
}

// 25. Privé app-routes (2026-10-23): /god-structure, /portal, /samantha, /write enz. vallen via een
//     rewrite terug op de homepage-snapshot (200, "index, follow", canonical "/") en stonden in
//     robots.txt op Disallow, zodat Google een noindex nooit kon lezen. Regels:
//     a. elke rewrite naar /index.html (behalve /writing/:slug en /en/writing/:slug, die geprerenderd
//        zijn) plus de vaste lijst hieronder krijgt X-Robots-Tag noindex via vercel.json headers;
//     b. geen geprerenderde publieke pagina krijgt die header;
//     c. robots.txt: zoekmachinegroepen (Googlebot, Bingbot, *) blokkeren geen enkel noindex-pad
//        (anders is de noindex onleesbaar) en géén groep blokkeert een geprerenderde publieke pagina
//        (Disallow-regels zijn prefixen: een te korte regel neemt publieke paden mee).
{
  const samples = new Set(["/god-structure", "/portal", "/portal/notes", "/samantha", "/write", "/write/x", "/dashboards", "/dashboards/x", "/bijlagen", "/blog-cms/voice/x", "/music-cms", "/release-set", "/wiki", "/muziek/artist-radar", "/extensions/x"]);
  for (const rw of vercelCfg.rewrites || []) {
    if (rw.destination !== "/index.html") continue;
    for (const p of expandSource(rw.source)) if (!/^\/(en\/)?writing\//.test(p)) samples.add(p);
  }
  for (const p of samples) if (!noindexByHeader(p)) failures.push(`vercel.json: ${p} (app-route, serveert de homepage-snapshot) krijgt geen X-Robots-Tag noindex (guard 25a)`);
  for (const route of seen) if (noindexByHeader(route)) failures.push(`vercel.json: publieke pagina ${route} krijgt X-Robots-Tag noindex (guard 25b)`);

  const robotsFile = path.join(distDir, "robots.txt");
  if (!fs.existsSync(robotsFile)) failures.push("dist/robots.txt ontbreekt (guard 25c)");
  else {
    const groups = [];
    let g = null, lastWasAgent = false;
    for (const raw of fs.readFileSync(robotsFile, "utf8").split("\n")) {
      const line = raw.replace(/#.*/, "").trim();
      const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
      if (!m) continue;
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === "user-agent") { if (!lastWasAgent) { g = { agents: [], rules: [] }; groups.push(g); } g.agents.push(val.toLowerCase()); lastWasAgent = true; continue; }
      lastWasAgent = false;
      if (g && (key === "allow" || key === "disallow") && val) g.rules.push({ allow: key === "allow", path: val });
    }
    const ruleRe = (p) => new RegExp("^" + p.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\?\$$/, "$").replace(/\$(?!$)/g, "\\$"));
    // RFC 9309: langste match wint, bij gelijke lengte wint Allow.
    const blocked = (grp, p) => {
      let best = null;
      for (const r of grp.rules) if (ruleRe(r.path).test(p) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r;
      return Boolean(best && !best.allow);
    };
    const publicRoutes = [...seen, "/writing/x", "/en/writing/x"];
    for (const grp of groups) {
      const who = grp.agents.join(", ");
      for (const p of publicRoutes) if (blocked(grp, p)) failures.push(`robots.txt [${who}]: blokkeert publieke pagina ${p} (guard 25c)`);
      if (grp.agents.some((a) => a === "*" || a === "googlebot" || a === "bingbot")) {
        for (const p of samples) if (blocked(grp, p)) failures.push(`robots.txt [${who}]: Disallow op ${p}, daardoor kan de zoekmachine de X-Robots-Tag noindex nooit lezen (guard 25c)`);
      }
    }
  }
}

// 26. Redirects voor /writing/index en gokbare/oude URL's (2026-10-23): /writing/index gaf 200
//     (homepage-snapshot via de /writing/:slug-rewrite, canonical "/") en /contact, /services enz.
//     gaven 404. Elke bron hieronder heeft in vercel.json als EERSTE passende redirect (zonder
//     host-/query-voorwaarde) een 308 naar de genoemde bestemming; de bestemming is een
//     geprerenderde pagina (of dist-bestand), is zelf geen redirectbron (geen keten) en een #anker
//     bestaat als id in die pagina. Bestemming wijzigen = deze tabel én vercel.json samen.
{
  const REQUIRED = [
    ["/writing/index", "/writing"],
    ["/en/writing/index", "/en/writing"],
    ["/contact", "/about#contact"],
    ["/services", "/"],
    ["/hire", "/interim-ecommerce-manager"],
    ["/amazon-specialist", "/amazon-nl-specialist"],
    ["/bol-consultant", "/bol-com-consultant"],
    // Zelfde inhuurintentie als /writing/freelance-e-commerce-manager-inhuren (HAN-188, PR #419).
    ["/freelance-ecommerce-manager", "/webshopbeheerder-inhuren"],
    ["/case-studies", "/work"],
    ["/work/abs", "/work"],
    // EN-varianten (2026-10-23, ronde 3): alleen waar de EN-doelpagina bestaat.
    ["/en/contact", "/en/about#contact"],
    ["/en/services", "/en"],
    ["/en/hire", "/en/interim-ecommerce-manager"],
    ["/en/amazon-specialist", "/en/amazon-nl-specialist"],
    ["/en/bol-consultant", "/en/bol-com-consultant"],
    ["/en/freelance-ecommerce-manager", "/en/webshopbeheerder-inhuren"],
    ["/en/case-studies", "/en/work"],
    ["/rss.xml", "/feed.xml"],
  ];
  const plain = (vercelCfg.redirects || []).filter((r) => !r.has && !r.missing);
  for (const [src, dest] of REQUIRED) {
    const first = plain.find((r) => vercelSourceRegex(r.source).test(src));
    if (!first) { failures.push(`vercel.json: geen redirect voor ${src} (verwacht 308 → ${dest}, guard 26)`); continue; }
    if (first.destination !== dest) failures.push(`vercel.json: ${src} → ${first.destination} (eerste passende redirect "${first.source}"), verwacht ${dest} (guard 26)`);
    if (first.permanent !== true || first.statusCode) failures.push(`vercel.json: redirect ${src} is niet permanent (verwacht 308, guard 26)`);
    // Bestaan en keten op de bestemming die vercel.json echt serveert.
    const [destPath, hash] = first.destination.split("#");
    const isFile = /\.[a-z0-9]+$/i.test(destPath);
    if (isFile ? !fs.existsSync(path.join(distDir, destPath.slice(1))) : !pageExistsG(destPath)) failures.push(`${src} → ${first.destination}: bestemming bestaat niet in dist (guard 26)`);
    else if (hash && !fs.readFileSync(path.join(distDir, destPath === "/" ? "" : destPath.slice(1), "index.html"), "utf8").includes(`id="${hash}"`)) failures.push(`${src} → ${first.destination}: anker #${hash} ontbreekt in ${destPath} (guard 26)`);
    const chained = plain.find((r) => vercelSourceRegex(r.source).test(destPath));
    if (chained) failures.push(`${src} → ${first.destination}: bestemming is zelf redirectbron "${chained.source}" (keten, guard 26)`);
    if (!isFile && pageExistsG(src)) failures.push(`${src}: is een geprerenderde pagina én redirectbron (guard 26)`);
  }
}

// 27. RSS-feed (2026-10-23): /feed.xml en /rss.xml gaven 404. dist/feed.xml is geldige RSS 2.0, bevat
//     precies de geprerenderde primaire artikelpagina's (/writing/<slug>), elk item linkt naar een
//     bestaande pagina, en de head van de homepage verwijst ernaar (rel=alternate).
{
  const feedFile = path.join(distDir, "feed.xml");
  if (!fs.existsSync(feedFile)) failures.push("dist/feed.xml ontbreekt (prerender schrijft de RSS-feed niet meer, guard 27)");
  else {
    const xmlText = fs.readFileSync(feedFile, "utf8");
    try {
      const { JSDOM } = createRequire(import.meta.url)("jsdom");
      const doc = new JSDOM(xmlText, { contentType: "application/xml" }).window.document;
      if (doc.getElementsByTagName("parsererror").length) throw new Error("parsererror");
      const rss = doc.documentElement;
      if (rss.nodeName !== "rss" || rss.getAttribute("version") !== "2.0") failures.push("feed.xml: geen <rss version=\"2.0\"> (guard 27)");
      const links = [...doc.querySelectorAll("channel > item > link")].map((l) => l.textContent.trim());
      const items = doc.querySelectorAll("channel > item").length;
      if (links.length !== items) failures.push(`feed.xml: ${items - links.length} item(s) zonder <link> (guard 27)`);
      for (const l of links) {
        if (!l.startsWith(`${BASE}/`)) { failures.push(`feed.xml: item-link ${l} niet op ${BASE} (guard 27)`); continue; }
        if (!pageExistsG(l.slice(BASE.length))) failures.push(`feed.xml: item-link ${l} heeft geen geprerenderde pagina (guard 27)`);
      }
      const articles = [...seen].filter((r) => /^\/writing\/[^/]+$/.test(r)).map((r) => `${BASE}${r}`);
      const missing = articles.filter((a) => !links.includes(a));
      if (missing.length) failures.push(`feed.xml: ${missing.length} geprerenderd(e) artikel(en) ontbreken in de feed, bv. ${missing.slice(0, 3).join(", ")} (guard 27)`);
      if (!articles.length) failures.push("feed.xml: geen geprerenderde artikelen gevonden om tegen te controleren (guard 27)");
    } catch (e) {
      failures.push(`feed.xml: geen geldige XML (${e.message}, guard 27)`);
    }
    const home = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
    if (!/<link rel="alternate" type="application\/rss\+xml"[^>]*href="https:\/\/hansvanleeuwen\.com\/feed\.xml"/.test(home)) failures.push("index.html: geen <link rel=\"alternate\" type=\"application/rss+xml\"> naar /feed.xml (guard 27)");
  }
}


// 28. Soft-404 op contentpaden (2026-10-23, ronde 3): een onbekende /writing/<slug> of
//     /en/writing/<slug> gaf 200 met de homepage-snapshot (canonical "/", index), omdat vercel.json
//     die paden naar /index.html herschreef. Vercel past rewrites pas toe als er geen bestand is, dus
//     elke rewrite die een contentpad raakt maakt van "bestaat niet" een indexeerbare 200. Zonder
//     rewrite serveert Vercel dist/404.html met status 404; die laadt de SPA, dus een concept of een
//     net gepubliceerd artikel rendert in de browser nog steeds (tot de content-redeploy het prerendert).
//     Regel: geen rewrite matcht een onbekend pad onder de contentsecties of op het hoogste niveau.
//     Bestaande pagina's blijven 200 (bestand); generate-sitemap controleert dat elke sitemap-URL een
//     bestand heeft (28b).
{
  const probes = ["/writing/onbekend-artikel-x", "/en/writing/onbekend-artikel-x", "/work/onbekend-x", "/en/work/onbekend-x", "/music/onbekend-x", "/onbekend-x", "/en/onbekend-x"];
  for (const p of probes) {
    const rw = (vercelCfg.rewrites || []).find((r) => !r.has && !r.missing && vercelSourceRegex(r.source).test(p));
    if (rw) failures.push(`vercel.json: rewrite "${rw.source}" → ${rw.destination} raakt onbekend contentpad ${p}: soft-404 (200 i.p.v. 404, guard 28)`);
  }
}

// Wederkerigheid vanuit de andere kant: elke /en-pagina heeft een NL-tweeling en andersom.
for (const route of seen) {
  if ((route === "/en" || route.startsWith("/en/")) && !route.startsWith("/en/writing/")) {
    const nl = route === "/en" ? "/" : route.slice(3);
    if (!seen.has(nl)) failures.push(`${route}: geen NL-tweeling ${nl}`);
  }
}

// Unpublished case must not reappear in the prerendered NL/EN pages or sitemap.
{
  const retiredCase = "/work/connect-car-parts";
  for (const prefix of ["", "/en"]) {
    const route = prefix + retiredCase;
    const htmlFile = path.join(distDir, route.replace(/^\//, ""), "index.html");
    if (fs.existsSync(htmlFile)) failures.push(`Unpublished case has a prerendered page: ${route}`);
    const workHtml = path.join(distDir, (prefix + "/work").replace(/^\//, ""), "index.html");
    if (fs.existsSync(workHtml) && fs.readFileSync(workHtml, "utf8").includes(retiredCase)) {
      failures.push(`Work page still links to unpublished case: ${prefix}/work`);
    }
  }
  const sitemapFile = path.join(distDir, "sitemap.xml");
  if (fs.existsSync(sitemapFile) && fs.readFileSync(sitemapFile, "utf8").includes(retiredCase)) {
    failures.push("Sitemap still exposes unpublished Connect Car Parts case");
  }
}

if (failures.length) {
  console.error(`[seo-guard] ${failures.length} SEO-regressie(s):`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`[seo-guard] OK: ${seen.size} pagina's voldoen (27 checks: h1/title/canonical/description/lang/hreflang/inLanguage/noindex/music/404/aliassen/variatie/contrast/artikeltaal/soft404-noindex/home-title-pariteit/intentwoord-scheiding/geen-em-dash/artikelparen/directory-listings/gsc-vraagtermen/taal-van-interne-links/mirror-noindex/app-routes-noindex/redirects/rss-feed/geen-soft-404).`);
