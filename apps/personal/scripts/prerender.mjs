/**
 * Prerender published blog posts into static HTML so /writing/<slug> ships with full content and SEO metadata.
 * Run after: vite build && node scripts/inject-static-content.cjs && vite build --ssr src/entry-server.tsx
 *
 * Output: dist/writing/<slug>/index.html for each published slug, with #root filled and __PRELOADED__ for hydration.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { JSDOM } from "jsdom";

// Real DOM + storage so React DOM and Supabase can run in Node
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};
const dom = new JSDOM("<!DOCTYPE html><html><head></head><body><div id=\"root\"></div></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// Node 20 has no global `navigator`; react-dom reads navigator.userAgent at module load time.
// Node 21+ provides one natively, so guard the assignment.
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = dom.window.navigator;
}
globalThis.localStorage = noopStorage;
globalThis.sessionStorage = noopStorage;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const templatePath = path.join(distDir, "index.html");

if (!fs.existsSync(templatePath)) {
  console.error("[prerender] dist/index.html not found. Run vite build first.");
  process.exit(1);
}

let template = fs.readFileSync(templatePath, "utf8");

// Load server bundle (built with vite build --ssr src/entry-server.tsx)
const entryJs = path.join(distDir, "entry-server.js");
const entryMjs = path.join(distDir, "entry-server.mjs");
const entryPath = fs.existsSync(entryMjs) ? entryMjs : fs.existsSync(entryJs) ? entryJs : null;
if (!entryPath) {
  console.error("[prerender] dist/entry-server.js or .mjs not found. Run: vite build --ssr src/entry-server.tsx");
  process.exit(1);
}

const {
  render,
  getHeroPost,
  HERO_SLUGS,
  getBlogPosts,
  getBlogPostHead,
  getBlogPostJsonLd,
  clearRootHtml,
  replaceSsrFallbackHtml,
  serializeJsonForHtmlScript,
  detectBlogPostLang,
  SERVICE_PAGES,
  SERVICE_PAGES_UPDATED,
  translations,
  alternatesFor,
  absoluteUrl,
  OG_LOCALE,
} = await import(
  pathToFileURL(entryPath).href
);

// Empty #root so we can inject prerendered content (inject-static-content already ran for homepage).
// Use balanced div parsing so nested homepage markup cannot leak into prerendered article pages.
template = clearRootHtml(template);

// De homepage wordt verderop per taal gerenderd (/ en /nl) — zie writeLocalizedPage().

const BASE = "https://hansvanleeuwen.com";

const PERSON_ENTITY = {
  "@type": "Person",
  "@id": `${BASE}/#person`,
  name: "Hans van Leeuwen",
  url: `${BASE}/about`,
  jobTitle: "E-commerce & Marketplace Manager",
  alternateName: "Jowikroon",
  description:
    "Hans van Leeuwen is an e-commerce and marketplace manager specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. 10+ years of experience across in-house, interim and freelance roles. Based in Amersfoort, NL.",
  knowsAbout: [
    "E-commerce management",
    "Marketplace management",
    "Amazon Seller & Vendor management",
    "Bol.com",
    "Amazon Ads",
    "Bol Ads",
    "Product data & feed management (Channable)",
    "Demand forecasting",
    "AI-assisted e-commerce operations",
    "Marketplace automation (n8n)",
    "LLM content workflows (Claude)",
    "Marketplace SEO",
    "Magento",
    "eBay",
  ],
  address: { "@type": "PostalAddress", addressLocality: "Amersfoort", addressRegion: "Utrecht", addressCountry: "NL" },
  sameAs: [
    "https://www.linkedin.com/in/hansvl3",
    "https://twitter.com/hansvl3",
    "https://github.com/jowikroon",
    "https://www.youtube.com/@jowikroon1990",
    "https://soundcloud.com/jowikroon",
  ],
};

const WEBSITE_ENTITY = {
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  name: "Hans van Leeuwen",
  url: `${BASE}/`,
  inLanguage: ["en", "nl"],
  publisher: { "@id": `${BASE}/#person` },
};

const PROFESSIONAL_SERVICE_ENTITY = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": `${BASE}/#organization`,
  name: "Hans van Leeuwen – E-commerce & Marketplace Management",
  url: `${BASE}/`,
  founder: { "@id": `${BASE}/#person` },
  sameAs: [
    "https://www.linkedin.com/in/hansvl3",
    "https://github.com/jowikroon",
  ],
  areaServed: [
    { "@type": "Country", name: "Netherlands" },
    { "@type": "Place", name: "European Union" },
  ],
};

// Static page SEO — per taal. Dienstenpagina's komen uit data/servicePages.ts.
const ABOUT_PERSON_ENTITY = {
  ...PERSON_ENTITY,
  image: { "@type": "ImageObject", url: `${BASE}/hans-profile.jpg`, caption: "Hans van Leeuwen – freelance e-commerce & marketplace manager" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "HU University of Applied Sciences Utrecht" },
    { "@type": "EducationalOrganization", name: "ROC Amsterdam - Hilversum" },
  ],
  worksFor: { "@type": "Organization", name: "ABS All Brake Systems" },
  hasOccupation: { "@type": "Occupation", name: "E-commerce & Marketplace Manager", occupationLocation: { "@type": "Country", name: "NL" } },
};

const WORK_HEAD_EN = {
  title: "Amazon & Bol.com Case Studies: Marketplace Growth Portfolio | Hans van Leeuwen",
  description:
    "Documented marketplace results by e-commerce & marketplace manager Hans van Leeuwen: Amazon NL/DE, Bol.com and e-commerce operations case studies, including Connect Car Parts (A.B.S. brake parts on Amazon DE, eBay DE and Magento).",
  intro: [
    "This portfolio brings together hands-on marketplace and e-commerce work by Hans van Leeuwen, e-commerce & marketplace manager based in Amersfoort. The case studies focus on the operational work behind growth: product data, marketplace listings, advertising, stock planning, reporting and automation across Amazon, Bol.com, eBay and own webstores. Every case shows the starting point, the intervention and the measurable commercial or operational result.",
    "The featured Connect Car Parts case describes a Dutch automotive parts operation selling A.B.S. brake parts through Magento, Amazon DE and eBay DE, with catalogue quality, vehicle fitment data, Channable feed management, listing optimisation, advertising and recurring performance reviews. Other documented results: 70% market share in an Amazon NL earplug category (Nielsen 2023), out-of-stock below 2% after improving demand forecasting, and 20% more weekly sales from a targeted social ad campaign, all at Alpine Hearing Protection.",
  ],
};
const WORK_HEAD_NL = {
  title: "Amazon & Bol.com case studies: portfolio marktplaatsgroei | Hans van Leeuwen",
  description:
    "Gedocumenteerde marktplaatsresultaten van e-commerce & marketplace manager Hans van Leeuwen: case studies Amazon NL/DE, Bol.com en e-commerce-operaties, waaronder Connect Car Parts (A.B.S.-remonderdelen op Amazon DE, eBay DE en Magento).",
  intro: [
    "Dit portfolio bundelt praktisch marktplaats- en e-commercewerk van Hans van Leeuwen, e-commerce & marketplace manager uit Amersfoort. De case studies richten zich op het operationele werk achter groei: productdata, listings, advertising, voorraadplanning, rapportage en automatisering over Amazon, Bol.com, eBay en eigen webshops. Elke case toont het startpunt, de ingreep en het meetbare commerciële of operationele resultaat.",
    "De uitgelichte Connect Car Parts-case beschrijft een Nederlandse operatie in auto-onderdelen die A.B.S.-remonderdelen verkoopt via Magento, Amazon DE en eBay DE, met cataloguskwaliteit, voertuig-fitmentdata, feedmanagement via Channable, listingoptimalisatie, advertising en terugkerende performance reviews. Andere gedocumenteerde resultaten: 70% marktaandeel in een oordoppencategorie op Amazon NL (Nielsen 2023), out-of-stock onder 2% na betere demand forecasting en 20% meer wekelijkse verkopen door een gerichte social-ad-campagne, alle bij Alpine Hearing Protection.",
  ],
};

const CASE_CCP_HEAD_EN = {
  title: "Connect Car Parts Case Study: A.B.S. Brake Parts on Amazon DE, eBay DE & Magento | Hans van Leeuwen",
  description:
    "How Hans van Leeuwen runs marketplace operations for Connect Car Parts: a ~400-SKU active A.B.S. brake-parts catalogue on Amazon DE, eBay DE and Magento, with Channable feeds, n8n order monitoring, an automated VIN lookup and AI-assisted listing content.",
  intro: [
    "Connect Car Parts is a Dutch automotive e-commerce operation selling A.B.S. brake parts (discs, pads, hoses and wheel-bearing kits) through its own Magento storefront and on Amazon DE and eBay DE. The active catalogue covers roughly 400 SKUs with vehicle-fitment data (K-types) and OE cross-references; the wider A.B.S. assortment being rolled out to eBay DE and Bol.com runs into the thousands of references.",
    "Hans van Leeuwen runs the marketplace side end to end: catalogue and product-data quality, feed management via Channable, listing optimisation, marketplace advertising and the operational reporting loop across the Dutch and German markets. The operation is automation-first: orders are monitored every 30 minutes through an n8n pipeline with failure alerts, a daily radar checks Channable feed quality and marketplace rule changes, an automated VIN-based parts lookup (a first in the industry) drives the storefront, and listing content is generated through an AI-assisted pipeline with human review on pricing, brand voice and compliance.",
    "Current expansion work: the Amazon DE catalogue launch including German VAT registration, and rolling the full A.B.S. assortment out to eBay DE and Bol.com with marketplace-specific content rules and vehicle compatibility files.",
  ],
};
const CASE_CCP_HEAD_NL = {
  title: "Case study Connect Car Parts: A.B.S.-remonderdelen op Amazon DE, eBay DE & Magento | Hans van Leeuwen",
  description:
    "Hoe Hans van Leeuwen de marketplace-operatie van Connect Car Parts runt: een actieve catalogus van ~400 SKU's A.B.S.-remonderdelen op Amazon DE, eBay DE en Magento, met Channable-feeds, n8n-ordermonitoring, een geautomatiseerde VIN-zoekfunctie en AI-ondersteunde listingcontent.",
  intro: [
    "Connect Car Parts is een Nederlandse e-commerce-operatie in auto-onderdelen die A.B.S.-remonderdelen (schijven, blokken, slangen en wiellagersets) verkoopt via een eigen Magento-webshop en op Amazon DE en eBay DE. De actieve catalogus omvat circa 400 SKU's met voertuig-fitmentdata (K-types) en OE-kruisverwijzingen; het bredere A.B.S.-assortiment dat naar eBay DE en Bol.com wordt uitgerold loopt in de duizenden referenties.",
    "Hans van Leeuwen runt de marketplace-kant van begin tot eind: catalogus- en productdatakwaliteit, feedmanagement via Channable, listingoptimalisatie, marketplace-advertising en de operationele rapportagecyclus over de Nederlandse en Duitse markt. De operatie is automation-first: orders worden elke 30 minuten bewaakt via een n8n-pipeline met alerts, een dagelijkse radar controleert de Channable-feedkwaliteit en marketplace-regelwijzigingen, een geautomatiseerde VIN-zoekfunctie (een primeur in de branche) stuurt de webshop aan en listingcontent komt uit een AI-ondersteunde pipeline met menselijke controle op prijs, merkstem en compliance.",
    "Lopende uitbreiding: de lancering van de Amazon DE-catalogus inclusief Duitse btw-registratie, en de uitrol van het volledige A.B.S.-assortiment naar eBay DE en Bol.com met marketplace-specifieke contentregels en voertuigcompatibiliteitsbestanden.",
  ],
};

const WRITING_HEAD = {
  title: "E-commerce Inzichten & Artikelen | Hans van Leeuwen",
  description:
    "Lees de visie van Hans van Leeuwen op e-commerce strategie, marktplaats optimalisatie, Amazon groei, Bol.com best practices en digitale commerce trends.",
  canonical: `${BASE}/writing`,
};
const WRITING_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${BASE}/writing#page`,
      name: WRITING_HEAD.title,
      description: WRITING_HEAD.description,
      url: `${BASE}/writing`,
      isPartOf: { "@id": `${BASE}/#website` },
      about: { "@type": "Person", "@id": `${BASE}/#person` },
      author: { "@type": "Person", "@id": `${BASE}/#person`, name: "Hans van Leeuwen" },
    },
    WEBSITE_ENTITY,
    PERSON_ENTITY,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Writing", item: `${BASE}/writing` },
      ],
    },
  ],
};

function renderQuietly(...args) {
  const originalError = console.error;
  console.error = (...messages) => {
    const text = messages.join(" ");
    if (text.includes("useLayoutEffect does nothing on the server")) return;
    originalError(...messages);
  };
  try {
    return render(...args);
  } finally {
    console.error = originalError;
  }
}

function setHead(html, { title, description, canonical, ogImageAlt }) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`
  );
  out = out.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${escapeHtml(canonical)}"`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${escapeHtml(canonical)}"`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeHtml(title)}"`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeHtml(description)}"`
  );
  out = out.replace(
    /<meta name="twitter:url" content="[^"]*"/,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}"`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeHtml(title)}"`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeHtml(description)}"`
  );
  if (ogImageAlt) {
    out = out.replace(
      /<meta property="og:image:alt" content="[^"]*"/,
      `<meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}"`
    );
    out = out.replace(
      /<meta name="twitter:image:alt" content="[^"]*"/,
      `<meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}"`
    );
  }
  return out;
}

function setJsonLd(html, jsonLd) {
  return html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${serializeJsonForHtmlScript(jsonLd)}\n    </script>`
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


/* ─────────────────────────────────────────────────────────────────────────
 * Eén URL per taal (HAN-167 / HAN-83)
 * ───────────────────────────────────────────────────────────────────────── */
const LANGS = ["en", "nl"];

/** html[lang], content-language en og:locale volgen de gerenderde taal. */
function applyLang(html, lang) {
  let out = html.replace(/<html([^>]*)\blang="[^"]*"/, `<html$1lang="${lang}"`);
  out = out.replace(/<meta http-equiv="content-language" content="[^"]*" \/>/, `<meta http-equiv="content-language" content="${lang}" />`);
  out = out.replace(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`);
  return out;
}

/**
 * Vervangt ALLE hreflang-links door één wederkerige set voor het EN-basispad
 * (en + nl + x-default). Voor niet-gelokaliseerde routes worden ze verwijderd.
 */
function setHreflang(html, basePath) {
  const stripped = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, "");
  const alts = basePath ? alternatesFor(basePath) : [];
  if (!alts.length) return stripped;
  const links = alts.map((a) => `    <link rel="alternate" hreflang="${a.lang}" href="${escapeHtml(a.href)}" />`).join("\n");
  return stripped.replace(/<meta property="og:locale" content="[^"]*" \/>/, (m) => `${m}\n${links}`);
}

function outPathFor(route) {
  const rel = route === "/" ? "" : route.replace(/^\//, "");
  const dir = path.join(distDir, rel);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "index.html");
}

/**
 * Rendert een gelokaliseerde route in beide talen en schrijft dist/<route> en
 * dist/nl/<route>. `buildHead(lang)` levert title/description/canonical/intro/faq,
 * `buildJsonLd(lang, head)` de @graph, `fallbackHtml(lang, head)` de noscript-body.
 */
function writeLocalizedPage(basePath, { buildHead, buildJsonLd, fallbackHtml, renderOptions, rootHtml }) {
  for (const lang of LANGS) {
    const route = lang === "nl" ? (basePath === "/" ? "/nl" : `/nl${basePath}`) : basePath;
    const head = buildHead(lang);
    head.canonical = absoluteUrl(basePath, lang);
    const html = rootHtml ? rootHtml(lang, head) : renderQuietly(route, null, { initialLang: lang, ...(renderOptions || {}) }).html;
    let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    page = setHead(page, head);
    page = applyLang(page, lang);
    page = setHreflang(page, basePath);
    if (buildJsonLd) page = setJsonLd(page, buildJsonLd(lang, head));
    page = replaceSsrFallbackHtml(page, fallbackHtml ? fallbackHtml(lang, head) : buildStaticPageFallback(head, "", "h2", lang));
    const outPath = outPathFor(route);
    fs.writeFileSync(outPath, page, "utf8");
    console.log(`[prerender] ${route} (${lang}) -> ${outPath}`);
  }
}

function textToParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((paragraph) => `<p>${escapeHtml(paragraph.replace(/\s+/g, " "))}</p>`)
    .join("\n          ");
}

function buildBlogPostFallback(post, head) {
  const body = textToParagraphs(post.content);
  return `
      <header>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a> |
          <a href="/writing">Writing</a>
        </nav>
      </header>
      <main>
        <article>
          <h2>${escapeHtml(post.title)}</h2>
          <p>${escapeHtml(head.description)}</p>
          ${body || "<p>Full article coming soon.</p>"}
        </article>
      </main>`;
}


function buildStaticPageFallback(head, extraHtml = "", headingTag = "h2", lang = "en") {
  const intro = (head.intro || [])
    .map((para) => `<p>${para}</p>`)
    .join("\n          ");
  const nl = lang === "nl";
  const p = nl ? "/nl" : "";
  return `
      <header>
        <nav aria-label="Primary navigation">
          <a href="${p || "/"}">Home</a> |
          <a href="${p}/work">${nl ? "Case studies" : "Case Studies"}</a> |
          <a href="/writing">${nl ? "Artikelen" : "Articles"}</a> |
          <a href="${p}/about">${nl ? "Over Hans" : "About"}</a>
        </nav>
      </header>
      <main>
        <article>
          <${headingTag}>${escapeHtml(head.title)}</${headingTag}>
          <p>${escapeHtml(head.description)}</p>
          ${intro}
          ${extraHtml}
          <p><a href="${escapeHtml(head.canonical)}">${escapeHtml(head.canonical)}</a></p>
        </article>
      </main>`;
}

let publishedPosts = [];
try {
  publishedPosts = await getBlogPosts(true);
} catch (err) {
  console.warn("[prerender] Could not pre-fetch published blog posts:", err.message);
}

const postBySlug = new Map();
for (const post of publishedPosts) {
  if (post?.slug) postBySlug.set(post.slug, post);
}
for (const slug of HERO_SLUGS) {
  if (!postBySlug.has(slug)) {
    const heroPost = getHeroPost(slug);
    if (heroPost) postBySlug.set(slug, heroPost);
  }
}

for (const [slug, blogPost] of postBySlug) {
  const route = `/writing/${slug}`;
  const head = getBlogPostHead(blogPost);

  const postLang = detectBlogPostLang(blogPost) === "nl" ? "nl" : "en";
  const { html } = renderQuietly(route, blogPost, { initialLang: postLang });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  // HAN-159: zelfstandige graph per artikel — volledige Person/WebSite/Organization
  // nodes naast de BlogPosting, zodat @id-referenties in dit document resolven.
  const { "@context": _articleCtx, ...articleNode } = getBlogPostJsonLd(blogPost);
  page = setJsonLd(page, {
    "@context": "https://schema.org",
    "@graph": [articleNode, PERSON_ENTITY, WEBSITE_ENTITY, PROFESSIONAL_SERVICE_ENTITY],
  });
  // HAN-158: taalsignaal per artikel uit de contenttaal. Artikelen zijn eentalig,
  // dus geen hreflang-set (een self-referentie zonder alternatief is ruis).
  page = applyLang(page, postLang);
  page = setHreflang(page, null);
  page = replaceSsrFallbackHtml(page, buildBlogPostFallback(blogPost, head));

  const preloadedScript = `<script id="__PRELOADED__" type="application/json">${serializeJsonForHtmlScript({
    blogPost,
  })}</script>`;
  page = page.replace("</body>", `${preloadedScript}\n  </body>`);

  const outPath = outPathFor(route);
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] ${route} -> ${outPath}`);
}

/* ───────────────────────────── / (home) ───────────────────────────── */
{
  const HOME_HEAD = {
    en: {
      title: "Freelance E-commerce Manager for Amazon & Bol.com (NL/EU) | Hans van Leeuwen",
      description:
        "Freelance e-commerce & marketplace manager, 10+ years on Amazon NL/DE & Bol.com: 70% category share (Nielsen 2023), out-of-stock under 2%, AI-assisted operations on n8n, Channable & Claude. Amersfoort, NL/EU.",
    },
    nl: {
      title: "Freelance E-commerce Manager inhuren voor Amazon & Bol.com | Hans van Leeuwen",
      description:
        "Freelance e-commerce & marketplace manager inhuren: 10+ jaar Amazon NL/DE & Bol.com, 70% categoriemarktaandeel (Nielsen 2023), out-of-stock onder 2%, AI-automatisering met n8n, Channable & Claude. Amersfoort, NL/EU.",
    },
  };
  // De homepage-JSON-LD staat in index.html (template); alleen taal/canonical/hreflang
  // worden per variant aangepast. inLanguage van de WebSite dekt beide talen.
  writeLocalizedPage("/", {
    buildHead: (lang) => ({ ...HOME_HEAD[lang] }),
    fallbackHtml: (lang, head) => buildStaticPageFallback({ ...head, intro: [] }, "", "h2", lang),
  });
  // De home-JSON-LD staat in de template; inLanguage per variant gelijktrekken.
  for (const [file, lang] of [[path.join(distDir, "index.html"), "en"], [path.join(distDir, "nl", "index.html"), "nl"]]) {
    let page = fs.readFileSync(file, "utf8");
    page = page.replace(/"inLanguage":\s*"(?:en|nl)"/g, `"inLanguage": "${lang}"`);
    fs.writeFileSync(file, page, "utf8");
  }
}

/* ───────────────────────────── /about ───────────────────────────── */
writeLocalizedPage("/about", {
  buildHead: (lang) => ({
    title: translations[lang].seo.aboutTitle,
    description: translations[lang].seo.aboutDescription,
  }),
  buildJsonLd: (lang, head) => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${head.canonical}#profilepage`,
        mainEntity: { "@id": `${BASE}/#person` },
        name: head.title,
        url: head.canonical,
        isPartOf: { "@id": `${BASE}/#website` },
        inLanguage: lang,
        dateModified: SERVICE_PAGES_UPDATED,
      },
      WEBSITE_ENTITY,
      ABOUT_PERSON_ENTITY,
      PROFESSIONAL_SERVICE_ENTITY,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) },
          { "@type": "ListItem", position: 2, name: lang === "nl" ? "Over" : "About", item: head.canonical },
        ],
      },
    ],
  }),
  fallbackHtml: (lang, head) => buildStaticPageFallback({
    ...head,
    intro: translations[lang].experienceList.map((job) => `<strong>${escapeHtml(job.role)}, ${escapeHtml(job.company)}</strong> (${escapeHtml(job.period)}): ${job.highlights.map(escapeHtml).join("; ")}.`),
  }, "", "h2", lang),
});

/* ───────────────────────────── /work ───────────────────────────── */
const workExtra = (lang) => lang === "nl"
  ? `
          <h2>Case studies Amazon NL, DE &amp; Bol.com</h2>
          <ul><li><a href="/nl/work/connect-car-parts">Connect Car Parts: A.B.S.-remonderdelen op Amazon DE, eBay DE &amp; Magento</a></li></ul>
          <p>Zie ook <a href="/nl/amazon-nl-specialist">Amazon NL specialist</a>, <a href="/nl/bol-com-consultant">Bol.com consultant</a> en <a href="/nl/interim-ecommerce-manager">interim e-commerce manager</a>.</p>`
  : `
          <h2>Amazon NL, DE &amp; Bol.com case studies</h2>
          <ul><li><a href="/work/connect-car-parts">Connect Car Parts: A.B.S. brake parts on Amazon DE, eBay DE &amp; Magento</a></li></ul>
          <p>See also <a href="/amazon-nl-specialist">Amazon NL specialist</a>, <a href="/bol-com-consultant">Bol.com consultant</a> and <a href="/interim-ecommerce-manager">interim e-commerce manager</a>.</p>`;
writeLocalizedPage("/work", {
  buildHead: (lang) => (lang === "nl" ? WORK_HEAD_NL : WORK_HEAD_EN),
  // /work laadt zijn cases client-side en heeft geen SSR-h1 (HAN-134/123): de
  // root krijgt daarom de statische fallback met h1, net als vóór deze refactor.
  rootHtml: (lang, head) => buildStaticPageFallback(head, workExtra(lang), "h1", lang),
  buildJsonLd: (lang, head) => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${head.canonical}#page`,
        name: head.title,
        description: head.description,
        url: head.canonical,
        isPartOf: { "@id": `${BASE}/#website` },
        about: { "@id": `${BASE}/#person` },
        author: { "@id": `${BASE}/#person` },
        inLanguage: lang,
      },
      WEBSITE_ENTITY,
      PERSON_ENTITY,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) },
          { "@type": "ListItem", position: 2, name: lang === "nl" ? "Case studies" : "Work", item: head.canonical },
        ],
      },
    ],
  }),
  fallbackHtml: () => "",
});

/* ───────────────────────────── /writing (eentalige index, NL) ───────────────────────────── */
{
  const route = "/writing";
  let writingPosts = [];
  try {
    writingPosts = await getBlogPosts(true);
  } catch (err) {
    console.warn("[prerender] Could not pre-fetch blog posts for /writing:", err.message);
  }
  const { html } = renderQuietly(route, null, { initialLang: "nl", preloadedBlogPosts: writingPosts });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, WRITING_HEAD);
  page = applyLang(page, "nl");
  page = setHreflang(page, null);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(WRITING_HEAD));
  page = setJsonLd(page, WRITING_JSONLD);
  const writingPreloadScript = `<script id="__PRELOADED__" type="application/json">${JSON.stringify({ blogPosts: writingPosts })}</script>`;
  page = page.replace("</body>", `${writingPreloadScript}\n  </body>`);
  const outPath = outPathFor(route);
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] ${route} -> ${outPath}`);
}

/* ───────────────────────────── dienstenpagina's (data/servicePages.ts) ───────────────────────────── */
for (const def of SERVICE_PAGES) {
  writeLocalizedPage(def.path, {
    buildHead: (lang) => {
      const c = def.copy[lang];
      return {
        title: c.title,
        description: c.metaDesc,
        intro: [c.intro, ...c.approach],
        faqHeading: c.faqHeading,
        faq: c.faq,
        results: c.results,
        resultsHeading: c.resultsHeading,
        practice: c.practice,
        practiceHeading: c.practiceHeading,
        breadcrumb: c.breadcrumb,
      };
    },
    buildJsonLd: (lang, head) => ({
      "@context": "https://schema.org",
      "@graph": [
        PERSON_ENTITY,
        PROFESSIONAL_SERVICE_ENTITY,
        WEBSITE_ENTITY,
        {
          "@type": "WebPage",
          "@id": `${head.canonical}#webpage`,
          url: head.canonical,
          name: head.title,
          description: head.description,
          isPartOf: { "@id": `${BASE}/#website` },
          about: { "@id": `${BASE}/#person` },
          author: { "@id": `${BASE}/#person` },
          dateModified: SERVICE_PAGES_UPDATED,
          inLanguage: lang,
        },
        {
          "@type": "Service",
          "@id": `${head.canonical}#service`,
          name: def.serviceName,
          url: head.canonical,
          provider: { "@id": `${BASE}/#organization` },
          areaServed: [
            { "@type": "Country", name: "Netherlands" },
            { "@type": "Place", name: "European Union" },
          ],
          description: head.description,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) },
            { "@type": "ListItem", position: 2, name: head.breadcrumb, item: head.canonical },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${head.canonical}#faq`,
          mainEntity: head.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
      ],
    }),
    fallbackHtml: (lang, head) => {
      const results = `\n          <h2>${escapeHtml(head.resultsHeading)}</h2>\n          <ul>` +
        head.results.map((r) => `<li><strong>${escapeHtml(r.stat)}</strong> ${escapeHtml(r.desc)} (${escapeHtml(r.source)})</li>`).join("") + `</ul>`;
      const practice = `\n          <h2>${escapeHtml(head.practiceHeading)}</h2>\n` +
        head.practice.map((c) => `          <h3>${escapeHtml(c.title)}</h3>\n          <p>${escapeHtml(c.summary)} <a href="${escapeHtml(c.href)}">${escapeHtml(c.linkLabel)}</a></p>`).join("\n");
      const faq = `\n          <h2>${escapeHtml(head.faqHeading)}</h2>\n` +
        head.faq.map((f) => `          <h3>${escapeHtml(f.q)}</h3>\n          <p>${escapeHtml(f.a)}</p>`).join("\n");
      return buildStaticPageFallback(head, results + practice + faq, "h2", lang);
    },
  });
}

/* ───────────────────────────── /work/connect-car-parts ───────────────────────────── */
writeLocalizedPage("/work/connect-car-parts", {
  buildHead: (lang) => (lang === "nl" ? CASE_CCP_HEAD_NL : CASE_CCP_HEAD_EN),
  buildJsonLd: (lang, head) => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${head.canonical}#webpage`,
        url: head.canonical,
        name: head.title,
        description: head.description,
        isPartOf: { "@id": `${BASE}/#website` },
        about: { "@id": `${BASE}/#person` },
        author: { "@id": `${BASE}/#person` },
        dateModified: SERVICE_PAGES_UPDATED,
        inLanguage: lang,
      },
      WEBSITE_ENTITY,
      PERSON_ENTITY,
      PROFESSIONAL_SERVICE_ENTITY,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) },
          { "@type": "ListItem", position: 2, name: lang === "nl" ? "Case studies" : "Case Studies", item: absoluteUrl("/work", lang) },
          { "@type": "ListItem", position: 3, name: "Connect Car Parts", item: head.canonical },
        ],
      },
    ],
  }),
});

/* ───────────────────────────── /privacy ───────────────────────────── */
writeLocalizedPage("/privacy", {
  buildHead: (lang) => (lang === "nl"
    ? { title: "Privacybeleid | Hans van Leeuwen", description: "Privacybeleid van hansvanleeuwen.com: welke gegevens worden verzameld, hoe analytics-cookies worden gebruikt en welke rechten je hebt onder de AVG." }
    : { title: "Privacy Policy | Hans van Leeuwen", description: "Privacy policy for hansvanleeuwen.com, what data is collected, how analytics cookies are used, and your rights under the GDPR." }),
  buildJsonLd: (lang, head) => ({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${head.canonical}#webpage`, url: head.canonical, name: head.title, description: head.description, isPartOf: { "@id": `${BASE}/#website` }, inLanguage: lang },
      WEBSITE_ENTITY,
      PERSON_ENTITY,
    ],
  }),
});

/* ───────────────────────────── /music (eentalig EN) ───────────────────────────── */
{
  const route = "/music";
  const head = {
    title: "Music: Songs & Production Notes | Hans van Leeuwen",
    description: "Original songs by Hans van Leeuwen, listen on Spotify and read the production notes behind each track: how it was made, the gear, and the lyrics.",
    canonical: `${BASE}/music`,
    ogImageAlt: "Hans van Leeuwen music: original songs and production notes (Lo-fi, Electronic, Ambient)",
  };
  const { html } = renderQuietly(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  page = applyLang(page, "en");
  page = setHreflang(page, null);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(head));
  page = setJsonLd(page, {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${head.canonical}#webpage`, url: head.canonical, name: head.title, description: head.description, isPartOf: { "@id": `${BASE}/#website` }, about: { "@id": `${BASE}/#person` }, inLanguage: "en" },
      WEBSITE_ENTITY,
      PERSON_ENTITY,
    ],
  });
  const outPath = outPathFor(route);
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] ${route} -> ${outPath}`);
}

/* ───────────────────────────── 404.html (echte HTTP 404 via Vercel) ───────────────────────────── */
{
  // Vercel serveert dist/404.html met status 404 voor elk pad dat geen bestand,
  // redirect of rewrite matcht (HAN-138). Geen canonical, wel noindex.
  const { html } = renderQuietly("/__prerender-404-probe__", null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = page.replace(/<title>[\s\S]*?<\/title>/, "<title>Page Not Found | Hans van Leeuwen</title>");
  page = page.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="This page does not exist or has moved. Go back to the homepage of Hans van Leeuwen, freelance e-commerce manager for Amazon and Bol.com."');
  page = page.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex, nofollow"');
  page = page.replace(/[ \t]*<link rel="canonical" href="[^"]*" \/>\n?/, "");
  page = page.replace(/[ \t]*<meta property="og:url" content="[^"]*" \/>\n?/, "");
  page = applyLang(page, "en");
  page = setHreflang(page, null);
  page = setJsonLd(page, { "@context": "https://schema.org", "@type": "WebPage", name: "Page Not Found", inLanguage: "en" });
  page = replaceSsrFallbackHtml(page, `
      <main><article><h2>Page not found</h2><p>This page does not exist or has moved.</p><p><a href="/">Back to the homepage</a></p></article></main>`);
  const outPath = path.join(distDir, "404.html");
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] 404 -> ${outPath}`);
}

console.log("[prerender] Done.");
process.exit(0);
