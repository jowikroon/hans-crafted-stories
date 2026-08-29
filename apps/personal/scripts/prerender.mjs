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
} = await import(
  pathToFileURL(entryPath).href
);

// Empty #root so we can inject prerendered content (inject-static-content already ran for homepage).
// Use balanced div parsing so nested homepage markup cannot leak into prerendered article pages.
template = clearRootHtml(template);

// Prerender the homepage with the real Index render so the first paint matches
// the hydrated page (instead of the hand-maintained static block) and there is
// no layout swap on mount. Head, JSON-LD and the rich <noscript> stay as-is.
{
  const { html } = renderQuietly("/", null, { initialLang: "nl" });
  const page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  fs.writeFileSync(path.join(distDir, "index.html"), page, "utf8");
  console.log(`[prerender] / -> ${path.join(distDir, "index.html")} (real render)`);
}

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
  ],
};

const WEBSITE_ENTITY = {
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  name: "Hans van Leeuwen",
  url: `${BASE}/`,
  inLanguage: "en",
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

// Static page SEO (English, primary for prerender), aligned with functions/[[path]].ts ROUTE_META
const ABOUT_HEAD = {
  title: "Over Hans van Leeuwen – E-commerce & Marketplace Manager (Amazon, Bol.com & AI)",
  description:
    "E-commerce en marketplace manager met 10+ jaar ervaring op Amazon, Bol.com en AI-gedreven operaties (n8n, Channable, Claude). Aantoonbare resultaten: 70% marktaandeel (Nielsen), out-of-stock onder 2%. Amersfoort, NL.",
  canonical: `${BASE}/about`,
};

const WORK_HEAD = {
  title: "Amazon & Bol.com Case Studies: Portfolio Marktplaatsgroei | Hans van Leeuwen",
  description:
    "Concrete marktplaats resultaten: Amazon NL & DE, Bol.com en e-commerce operaties case studies door e-commerce & marketplace manager Hans van Leeuwen, waaronder Connect Car Parts.",
  canonical: `${BASE}/work`,
  intro: [
    "Dit portfolio bundelt praktisch marktplaats- en e-commercewerk van Hans van Leeuwen, een e-commerce & marketplace manager uit Amersfoort. De case studies richten zich op het operationele werk achter groei: het verbeteren van productdata, marktplaats listings, advertising, voorraadplanning, rapportages en automatisering over Amazon, Bol.com, eBay en eigen webshops. Elke case is bedoeld om het startpunt, de ingreep en het meetbare commerciële of operationele resultaat te tonen, in plaats van een galerij zonder context te presenteren.",
    "De uitgelichte Connect Car Parts case beschrijft een Nederlandse e-commerce operatie in auto-onderdelen die A.B.S. remonderdelen verkoopt via Magento, Amazon DE en eBay DE. Het werk combineert cataloguskwaliteit, voertuig-fitment data, feedmanagement via Channable, listing optimalisatie, advertising en terugkerende performance reviews. Het is een nuttig voorbeeld van hoe technische productdata en dagelijkse commerciële beslissingen moeten samenwerken wanneer een groot assortiment wordt gedistribueerd over meerdere kanalen en landen.",
    "Andere gedocumenteerde marktplaats resultaten op deze site omvatten 70% marktaandeel in een Amazon NL oordoppencategorie op basis van Nielsen data, out-of-stock percentages onder de 2% na het verbeteren van demand forecasting, en 20% wekelijkse omzetgroei door gerichte Sponsored campagnes. Deze cijfers beschrijven specifieke opdrachten en zijn geen generieke beloftes. De gerelateerde dienstenpagina's lichten de werkwijze toe voor Amazon NL accountmanagement, Bol.com consultancy en interim e-commerce leiderschap, terwijl de schrijven-sectie diepgaandere artikelen biedt over marktplaats operaties en AI-gedreven automatisering.",
    "Een typische opdracht begint met een nulmeting van catalogusgezondheid, contentkwaliteit, zoekzichtbaarheid, advertentie-efficiëntie, prijzen, voorraadrisico en rapportage. De resulterende backlog scheidt acute omzetlekken van structurele verbeteringen, wijst een eigenaar toe en definieert een meetbaar resultaat. Wekelijkse reviews verbinden vervolgens organische zichtbaarheid, conversie, advertising, marge en beschikbaarheid, zodat beslissingen gebaseerd zijn op hun gecombineerde commerciële impact. Het doel is een transparante operatie die een intern team kan begrijpen, voortzetten en verbeteren.",
  ],
};

const WRITING_HEAD = {
  title: "E-commerce Inzichten & Artikelen | Hans van Leeuwen",
  description:
    "Lees de visie van Hans van Leeuwen op e-commerce strategie, marktplaats optimalisatie, Amazon groei, Bol.com best practices en digitale commerce trends.",
  canonical: `${BASE}/writing`,
};
const ABOUT_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      mainEntity: { "@id": "https://hansvanleeuwen.com/#person" },
      name: ABOUT_HEAD.title,
      url: `${BASE}/about`,
      isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
    },
    WEBSITE_ENTITY,
    {
      "@type": "Person",
      "@id": "https://hansvanleeuwen.com/#person",
      name: "Hans van Leeuwen",
      url: `${BASE}/about`,
      jobTitle: "E-commerce & Marketplace Manager",
      alternateName: "Jowikroon",
      description:
        "E-commerce and marketplace manager with 10+ years of experience in marketplace strategy, Amazon, Bol.com and AI-assisted e-commerce operations.",
      image: {
        "@type": "ImageObject",
        url: `${BASE}/og-image.png`,
        width: 1200,
        height: 630,
        caption: "Hans van Leeuwen – Freelance E-commerce Manager",
      },
      knowsAbout: [
        "E-commerce",
        "Amazon",
        "Bol.com",
        "Marketplace optimization",
        "UX design",
        "Conversion optimization",
        "Digital commerce",
        "SEO",
        "Amazon Ads",
        "Bol Ads",
        "AI-assisted e-commerce operations",
        "Marketplace automation (n8n)",
        "Product data & feed management (Channable)",
        "LLM content workflows (Claude)",
        "Demand forecasting",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Amersfoort",
        addressCountry: "NL",
      },
      sameAs: [
        "https://www.linkedin.com/in/hansvl3",
        "https://twitter.com/hansvl3",
        "https://github.com/jowikroon",
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "About", item: `${BASE}/about` },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "What does a freelance e-commerce manager do?", acceptedAnswer: { "@type": "Answer", text: "Temporarily leads the e-commerce operation: marketplace strategy, listings, advertising, pricing, forecasting and reporting. Hands-on inside your existing team and tool stack." } },
        { "@type": "Question", name: "How much does marketplace management cost?", acceptedAnswer: { "@type": "Answer", text: "Retainer for ongoing Amazon/Bol management, project pricing for a defined audit or launch, day rate for interim. A 30-min intake produces a written quote within one working day." } },
        { "@type": "Question", name: "Bol.com — vendor or seller?", acceptedAnswer: { "@type": "Answer", text: "Seller keeps margin and control but requires active account work. Vendor saves operations but concedes margin and pricing control. Both routes are modeled on EBITDA, not just revenue." } },
        { "@type": "Question", name: "How do you reduce out-of-stock rates?", acceptedAnswer: { "@type": "Answer", text: "A demand-forecasting model built on recent sell-through, seasonality and promo lift, tied to supplier lead-times. Documented cases run under 2 percent OOS." } },
        { "@type": "Question", name: "Do you manage Amazon Ads and Bol Ads?", acceptedAnswer: { "@type": "Answer", text: "Yes. Sponsored Products, Sponsored Brands, Display and Bol Ads with weekly bid steering and negative harvesting; ACOS and TACOS as primary KPIs." } },
      ],
    },
  ],
};

const WORK_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${BASE}/work#page`,
      name: WORK_HEAD.title,
      description: WORK_HEAD.description,
      url: `${BASE}/work`,
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
        { "@type": "ListItem", position: 2, name: "Work", item: `${BASE}/work` },
      ],
    },
  ],
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


function buildStaticPageFallback(head, extraHtml = "", headingTag = "h2") {
  const intro = (head.intro || [])
    .map((para) => `<p>${para}</p>`)
    .join("\n          ");
  return `
      <header>
        <nav aria-label="Primary navigation">
          <a href="/">Home</a> |
          <a href="/work">Case Studies</a> |
          <a href="/writing">Articles</a> |
          <a href="/about">About</a>
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

  const { html } = renderQuietly(route, blogPost);
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  // HAN-159: zelfstandige graph per artikel — volledige Person/WebSite/Organization
  // nodes naast de BlogPosting, zodat @id-referenties in dit document resolven.
  const { "@context": _articleCtx, ...articleNode } = getBlogPostJsonLd(blogPost);
  page = setJsonLd(page, {
    "@context": "https://schema.org",
    "@graph": [articleNode, PERSON_ENTITY, WEBSITE_ENTITY, PROFESSIONAL_SERVICE_ENTITY],
  });
  // HAN-158: taalsignaal per artikel uit de contenttaal.
  const postLang = detectBlogPostLang(blogPost);
  if (postLang === "nl") {
    page = page.replace('<html lang="en"', '<html lang="nl"');
    page = page.replace('<meta http-equiv="content-language" content="en" />', '<meta http-equiv="content-language" content="nl" />');
    page = page.replace('<meta property="og:locale" content="en_US" />', '<meta property="og:locale" content="nl_NL" />');
  }
  page = replaceSsrFallbackHtml(page, buildBlogPostFallback(blogPost, head));

  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(head.canonical)}"`)
  );

  const preloadedScript = `<script id="__PRELOADED__" type="application/json">${serializeJsonForHtmlScript({
    blogPost,
  })}</script>`;
  page = page.replace("</body>", `${preloadedScript}\n  </body>`);

  const outDir = path.join(distDir, "writing", slug);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "index.html");
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] ${route} -> ${outPath}`);
}

// Prerender /about for indexable content and correct meta/schema
{
  const route = "/about";
  const { html } = renderQuietly(route, null, { initialLang: "nl" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, ABOUT_HEAD);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(ABOUT_HEAD));

  // Replace homepage structured data with About-specific schema
  page = page.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(ABOUT_JSONLD)}\n    </script>`
  );

  // Point hreflang to /about
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(ABOUT_HEAD.canonical)}"`)
  );

  const outDir = path.join(distDir, "about");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "index.html");
  fs.writeFileSync(outPath, page, "utf8");
  console.log(`[prerender] ${route} -> ${outPath}`);
}

// Prerender /work for indexable content and correct meta/schema
{
  const route = "/work";
  const workFallbackExtraHtml = `
          <h2>Amazon NL, DE &amp; Bol.com Growth Case Studies</h2>
          <ul>
            <li><a href="/work/connect-car-parts">Connect Car Parts, automotive parts e-commerce: Amazon DE, eBay DE &amp; Magento operations</a></li>
          </ul>
          <p>More marketplace results: 70% market share in the earplug category on Amazon NL (Nielsen data), out-of-stock rates below 2% through improved demand forecasting, and 20% weekly sales growth via targeted Sponsored campaigns. See also <a href="/amazon-nl-specialist">Amazon NL specialist services</a> and <a href="/bol-com-consultant">Bol.com consulting</a>.</p>`;
  const workFallbackHtml = buildStaticPageFallback(WORK_HEAD, workFallbackExtraHtml, "h1");
  let page = template.replace('<div id="root"></div>', `<div id="root">${workFallbackHtml}</div>`);
  page = setHead(page, WORK_HEAD);
  page = replaceSsrFallbackHtml(page, "");
  page = page.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(WORK_JSONLD)}\n    </script>`
  );
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(WORK_HEAD.canonical)}"`)
  );
  const outDir = path.join(distDir, "work");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf8");
  console.log(`[prerender] ${route} -> ${path.join(outDir, "index.html")}`);
}

// Prerender /writing for indexable content and correct meta/schema
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
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(WRITING_HEAD));
  page = page.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(WRITING_JSONLD)}\n    </script>`
  );
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(WRITING_HEAD.canonical)}"`)
  );
  // Inject preloaded blog posts for client-side hydration (avoids loading flash)
  const writingPreloadScript = `<script id="__PRELOADED__" type="application/json">${JSON.stringify({ blogPosts: writingPosts })}</script>`;
  page = page.replace("</body>", `${writingPreloadScript}\n  </body>`);
  const outDir = path.join(distDir, "writing");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf8");
  console.log(`[prerender] ${route} -> ${path.join(outDir, "index.html")}`);
}

// Prerender SEO landing pages
const SEO_PAGES = [
  {
    route: "/amazon-nl-specialist",
    head: {
      title: "Amazon NL Specialist: Freelance Amazon Netherlands Account Manager | Hans van Leeuwen",
      description: "Freelance Amazon NL specialist with 10+ years managing Amazon Netherlands accounts. Listing optimization, Amazon Ads, A+ content & marketplace growth. Based in Amersfoort.",
      canonical: `${BASE}/amazon-nl-specialist`,
      serviceName: "Amazon NL Account Management",
      intro: [
        'Hans van Leeuwen is a freelance e-commerce manager and Amazon NL specialist based in Amersfoort, the Netherlands, specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. He helps brands sell more on Amazon Netherlands through optimized listings, data-driven advertising and strategic account management, from launch to scale.',
        'The work covers product listing optimization (titles, bullets, backend keywords, images), A+ Content creation, Amazon Ads (Sponsored Products, Sponsored Brands, Sponsored Display), Buy Box strategy and pricing, catalog management and listing suppression resolution, Amazon SEO for the Dutch market, competitor benchmarking, and inventory planning with demand forecasting.',
        'An engagement starts with a practical account baseline covering catalog health, listing quality, search-term coverage, advertising structure, pricing, Buy Box performance, stock risk, account warnings and reporting. The resulting plan separates urgent revenue leaks from longer-term growth opportunities, with a measurable target and owner for every action.',
        'Execution connects content, advertising and operations. Search-term research informs titles, bullets, backend keywords, A+ Content and campaign structure instead of treating each area as a separate project. Weekly trading reviews bring organic visibility, conversion, advertising efficiency, margin and availability into one view, so budget and catalog decisions are based on commercial impact rather than isolated marketplace metrics.',
        'For ongoing account management, the cadence includes catalog checks, campaign optimization, pricing and Buy Box review, stock-risk monitoring, competitor changes and a concise performance update. Brands retain access to the decisions, data and working documents. The goal is a repeatable Amazon Netherlands operation that an internal team can understand and continue, not a black-box dependency on an external specialist.',
        'Proven results include 70% market share in the earplug category on Amazon NL (Nielsen data), out-of-stock rates below 2% through improved demand forecasting, and 20% weekly sales growth via targeted Sponsored campaigns. Start with a free 7-point Amazon NL audit, top growth opportunities identified within 48 hours. Also see <a href="/bol-com-consultant">Bol.com consulting</a> and <a href="/interim-ecommerce-manager">interim e-commerce management</a>.',
      ],
      faq: [
        { q: "What does a freelance Amazon NL specialist do?", a: "A freelance Amazon NL specialist manages and grows a brand's presence on Amazon Netherlands: optimizing product listings (titles, bullets, backend keywords, images), creating A+ Content, running Amazon Ads campaigns (Sponsored Products, Brands and Display), managing the Buy Box and pricing, resolving listing suppressions, and planning inventory with demand forecasting." },
        { q: "What results has Hans van Leeuwen achieved on Amazon NL?", a: "Documented results include 70% market share in the earplug category on Amazon NL (Nielsen data), out-of-stock rates below 2% through improved demand forecasting, and 20% weekly sales growth via targeted Sponsored campaigns." },
        { q: "How does an engagement start?", a: "It starts with a free 7-point Amazon NL audit. Hans reviews listings, advertising, pricing, content and operations, and identifies the top growth opportunities within 48 hours. From there you can engage him for hands-on execution or ongoing account management." },
        { q: "Does Hans also manage Amazon Ads (PPC)?", a: "Yes. Amazon advertising is a core service: Sponsored Products, Sponsored Brands and Sponsored Display campaigns, including keyword research for the Dutch market, bid management and campaign structure aligned with category benchmarks." },
        { q: "Which product categories does Hans work with?", a: "Health & personal care, consumer electronics, automotive parts, home & garden, sports & outdoor, beauty & cosmetics, food & supplements, and fashion & accessories, for brands in the Netherlands and the EU." },
      ],
    },
  },
  {
    route: "/bol-com-consultant",
    head: {
      title: "Bol.com Consultant: Freelance Bol.com Specialist & Ads Manager | Hans van Leeuwen",
      description: "Freelance Bol.com consultant specializing in product content optimization, Bol Ads management, and marketplace growth strategy. Based in Amersfoort, Netherlands.",
      canonical: `${BASE}/bol-com-consultant`,
      serviceName: "Bol.com Marketplace Consulting",
      intro: [
        'Hans van Leeuwen is a freelance e-commerce manager and Bol.com consultant based in Amersfoort, the Netherlands, specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. He helps brands grow on Bol.com, the Netherlands\' largest online marketplace, with a hands-on, measurable approach.',
        'Services include product content optimization, Bol Ads campaign management, catalog and assortment management, vendor-to-seller transitions, pricing and Buy Block strategy, and monthly performance reporting. Every engagement is grounded in product data quality: complete, correct and conversion-oriented listings are the foundation of Bol.com growth.',
        'With 10+ years of marketplace experience across Bol.com and Amazon, Hans combines platform knowledge with practical execution. Start with a marketplace audit to identify your top growth levers. Also see <a href="/amazon-nl-specialist">Amazon NL specialist services</a> and <a href="/interim-ecommerce-manager">interim e-commerce management</a>.',
        'An engagement starts with a practical Bol.com baseline covering assortment coverage, product-data completeness, content quality, findability, Buy Block performance, pricing, advertising structure, logistics, performance scores and reporting. The resulting plan separates immediate revenue leaks from structural growth opportunities, with a measurable target and owner for every action.',
        'Execution connects content, advertising and operations. Search and category data inform titles, descriptions, attributes, images and Bol Ads campaigns instead of treating them as separate workstreams. A weekly trading review brings visibility, conversion, advertising efficiency, margin, availability, returns and service performance into one view, so decisions reflect commercial impact across the whole Bol.com account.',
        'For ongoing marketplace management, the cadence includes catalog checks, campaign optimization, pricing and Buy Block review, stock-risk monitoring, competitor changes and a concise performance update. Vendor-to-seller transitions receive a separate migration plan for assortment, pricing, logistics, content and measurement. Brands retain access to the decisions, data and working documents, creating an operation an internal team can understand and continue.',
      ],
      faq: [
        { q: "What does a Bol.com consultant do?", a: "A Bol.com consultant helps brands grow on the Netherlands' largest online marketplace: optimizing product content, managing Bol Ads campaigns, improving catalog and assortment quality, advising on pricing and Buy Block strategy, and setting up performance reporting." },
        { q: "Can Hans help with a vendor-to-seller transition on Bol.com?", a: "Yes. Transitioning from a vendor (retail) relationship to a seller (marketplace) model is a core service, including assortment migration, pricing strategy, logistics setup and protecting performance scores during the switch." },
        { q: "Why is product data so important on Bol.com?", a: "Bol.com ranks and converts on content quality. Complete, correct and conversion-oriented product data, titles, descriptions, specifications and images, is the foundation for visibility, the Buy Block and advertising efficiency." },
        { q: "Does Hans manage Bol Ads campaigns?", a: "Yes. Bol Ads (sponsored products) management is a core service: campaign structure, keyword targeting, bid management and continuous optimization against ACoS and growth targets." },
        { q: "How do I start working with Hans on Bol.com?", a: "Start with a marketplace audit. Hans reviews your content, advertising, assortment and operations on Bol.com and identifies the highest-impact growth opportunities before any engagement." },
      ],
    },
  },
  {
    route: "/privacy",
    head: {
      title: "Privacy Policy | Hans van Leeuwen",
      description: "Privacy policy for hansvanleeuwen.com, what data is collected, how analytics cookies are used, and your rights under the GDPR.",
      canonical: `${BASE}/privacy`,
    },
  },
  {
    route: "/music",
    head: {
      title: "Music: Songs & Production Notes | Hans van Leeuwen",
      description: "Original songs by Hans van Leeuwen, listen on Spotify and read the production notes behind each track: how it was made, the gear, and the lyrics.",
      canonical: `${BASE}/music`,
      ogImageAlt: "Hans van Leeuwen music: original songs and production notes (Lo-fi, Electronic, Ambient)",
    },
  },
  {
    route: "/ai-ecommerce-automation",
    head: {
      title: "AI E-commerce Automation Specialist | Hans van Leeuwen",
      description:
        "Freelance AI e-commerce automation specialist. Automatiseer Amazon NL & Bol.com operations met n8n, Supabase en Claude. Amersfoort, NL/EU.",
      canonical: `${BASE}/ai-ecommerce-automation`,
      serviceName: "AI E-commerce Automation Consulting",
      intro: [
        'Hans van Leeuwen is a freelance e-commerce manager specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. This page covers the AI-automation practice: pipelines that remove repetitive manual marketplace work and surface decisions faster, with a human in the loop on strategy, pricing and brand voice.',
        'A typical engagement covers four layers. Product data: feed normalization, enrichment and nightly validation across channels. Operations: stock, pricing and order sync between Amazon NL/DE, Bol.com and the webstore. Advertising: automated ROAS/ACOS reporting and budget alerts. Intelligence: competitor and ranking monitoring with weekly KPI reports generated automatically.',
        'The stack is n8n for orchestration, Supabase for the data layer, Claude for content and analysis, and Channable for feed and marketplace sync. Documented results include 70% market share on Amazon NL in a competitive category (Nielsen data), out-of-stock rates below 2% through automated demand forecasting, and a twice-weekly automated SEO and competitor intelligence pipeline running on this site. Start with a free automation audit, the three highest-ROI workflows to automate first, with a written plan inside 48 hours. Also see <a href="/amazon-nl-specialist">Amazon NL specialist services</a> and <a href="/bol-com-consultant">Bol.com consulting</a>.',
      ],
      faq: [
        { q: "What is AI e-commerce automation?", a: "A set of pipelines, product data, operations, advertising and reporting, that remove repetitive manual marketplace work and speed up decisions, with a human in the loop on strategy, pricing and brand voice. It is concrete, monitored workflows built on n8n, Supabase and Claude, not 'an AI that runs your store'." },
        { q: "Which platforms and tools does Hans automate?", a: "Amazon (NL, DE and other EU marketplaces), Bol.com, eBay and own-store platforms such as Magento, plus the feed and automation layer that connects them, Channable for feeds and n8n for orchestration, with Supabase as the data layer and Claude for content and analysis." },
        { q: "Do I need to replace my team?", a: "No. Automation removes the repetitive 80% so your team focuses on strategy, merchandising and brand. The human stays in the loop on pricing limits, brand voice and final decisions." },
        { q: "How does an engagement start?", a: "With a free automation audit: Hans maps your current manual workload and returns a prioritized plan within 48 hours, identifying the three highest-ROI workflows to automate first." },
        { q: "Is my data and account access safe?", a: "Pipelines run on your own infrastructure and accounts; marketplace credentials are never shared in plain text. The automation layer is auditable and you keep full control of access." },
      ],
    },
  },
  {
    route: "/interim-ecommerce-manager",
    head: {
      title: "Interim E-commerce Manager: Freelance Marketplace Lead (NL/EU) | Hans van Leeuwen",
      description: "Interim e-commerce manager available for freelance marketplace leadership roles. Strategy, operations & hands-on execution for Amazon, Bol.com & more. NL/EU.",
      canonical: `${BASE}/interim-ecommerce-manager`,
      serviceName: "Interim E-commerce Management",
      intro: [
        'Hans van Leeuwen is a freelance e-commerce manager specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. As interim e-commerce manager he provides senior e-commerce leadership without the permanent headcount, driving marketplace strategy, managing daily operations and delivering KPI-driven growth on Amazon NL, Bol.com and beyond.',
        'Typical interim scope: owning the marketplace P&L, managing listings, advertising and pricing across channels, coordinating logistics and inventory, building reporting and automation, and upskilling internal teams. Engagements run on-site in the Netherlands or remote across the EU, from a few days per week to full coverage during recruitment, growth phases or transitions.',
        'With 10+ years of hands-on marketplace experience, Hans combines strategic direction with operational execution. Based in Amersfoort, available for NL & EU projects. Also see <a href="/amazon-nl-specialist">Amazon NL specialist services</a> and <a href="/bol-com-consultant">Bol.com consulting</a>.',
        'The first week starts with an operational baseline covering channel profitability, advertising efficiency, listing quality, stock risk, product-data health, team ownership and reporting cadence. Urgent revenue and availability risks are separated from structural improvements, then converted into a prioritized backlog with an owner and measurable outcome for every action.',
        'During weeks two and three, Hans works inside the existing team and tool stack. The focus may include restructuring Amazon Ads or Bol Ads, repairing catalog and feed issues, introducing a weekly trading rhythm, clarifying marketplace P&L ownership, or coordinating agencies, logistics, finance and content. A compact KPI dashboard and written weekly update keep decisions and progress visible to stakeholders.',
        'By week four, processes, access, decisions and recurring checks are documented for the permanent owner. The handover covers current performance, open risks, a practical 90-day roadmap and recommendations for team capacity. This makes the engagement useful both as temporary leadership and as preparation for a permanent e-commerce hire.',
      ],
      faq: [
        { q: "What is an interim e-commerce manager?", a: "An interim e-commerce manager is a senior professional who temporarily leads a company's e-commerce operation, owning strategy, daily marketplace operations, advertising, product data and reporting, without adding permanent headcount." },
        { q: "When should a company hire an interim e-commerce manager?", a: "Typical moments: a sudden departure of the e-commerce lead, a growth phase that outpaces the current team, a marketplace expansion (e.g. launching on Amazon DE), or a transition period while recruiting a permanent hire." },
        { q: "Does Hans work on-site or remote?", a: "Both. Hans is based in Amersfoort, the Netherlands, and works on-site in the NL/Utrecht region or remote for clients across the Netherlands and the EU, from a few days per week to full interim coverage." },
        { q: "Which platforms does Hans cover as interim manager?", a: "Amazon (NL, DE and other EU marketplaces), Bol.com, eBay and own-store platforms such as Magento, including the product data, feed management and automation layer (e.g. Channable) that connects them." },
        { q: "How fast can an interim engagement start?", a: "Usually within a few weeks, depending on current commitments. The engagement starts with an operational audit so priorities are clear in the first week." },
      ],
    },
  },
];

for (const { route, head } of SEO_PAGES) {
  const { html } = renderQuietly(route, null, { initialLang: "nl" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  const faqHtml = head.faq
    ? `\n          <h2>Frequently Asked Questions</h2>\n` +
      head.faq.map((f) => `          <h3>${escapeHtml(f.q)}</h3>\n          <p>${escapeHtml(f.a)}</p>`).join("\n")
    : "";
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(head, faqHtml));
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${head.canonical}#webpage`,
      url: head.canonical,
      name: head.title,
      description: head.description,
      isPartOf: { "@id": `${BASE}/#website` },
      about: { "@id": `${BASE}/#person` },
      inLanguage: "nl",
    },
    WEBSITE_ENTITY,
    PERSON_ENTITY,
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: head.title.split("\u2014")[0].split("|")[0].trim(), item: head.canonical },
      ],
    },
  ];
  if (head.serviceName) {
    graph.splice(1, 0,
      PROFESSIONAL_SERVICE_ENTITY,
      {
        "@type": "Service",
        "@id": `${head.canonical}#service`,
        name: head.serviceName,
        url: head.canonical,
        provider: { "@id": `${BASE}/#organization` },
        areaServed: [
          { "@type": "Country", name: "Netherlands" },
          { "@type": "Place", name: "European Union" },
        ],
        description: head.description,
      },
    );
  }
  if (head.faq) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${head.canonical}#faq`,
      isPartOf: { "@id": `${head.canonical}#webpage` },
      mainEntity: head.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  page = setJsonLd(page, { "@context": "https://schema.org", "@graph": graph });
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(head.canonical)}"`)
  );
  const slug = route.slice(1); // remove leading /
  const outDir = path.join(distDir, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf8");
  console.log(`[prerender] ${route} -> ${path.join(outDir, "index.html")}`);
}


// Prerender /work/connect-car-parts, the only internal case study route (HAN-114)
{
  const route = "/work/connect-car-parts";
  const head = {
    title: "Connect Car Parts Case Study: Automotive Parts E-commerce (Amazon DE, eBay & Magento) | Hans van Leeuwen",
    description:
      "How Hans van Leeuwen runs marketplace operations for Connect Car Parts: a ~400-SKU A.B.S. brake-parts catalogue on Amazon DE, eBay DE and Magento — product data, Channable feeds, n8n order monitoring and AI-assisted listing operations.",
    canonical: `${BASE}/work/connect-car-parts`,
    intro: [
      'Connect Car Parts is a Dutch automotive parts e-commerce operation selling A.B.S. brake parts, discs, pads, hoses and wheel-bearing kits, through its own Magento storefront and on marketplaces including Amazon DE and eBay DE. The active catalogue covers roughly 400 SKUs of brake components with vehicle-fitment data (K-types) and OE cross-references.',
      'Hans van Leeuwen, e-commerce & marketplace manager specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted operations, runs the marketplace side of the business end to end: catalog and product-data quality, feed management via Channable, listing optimization, marketplace advertising and the operational reporting loop across the Dutch and German markets.',
      'The operation is deliberately automation-first. Orders are monitored every 30 minutes through an n8n pipeline with automated failure alerts; a daily automated radar checks Channable feed quality and marketplace rule changes; listing titles and content are generated through an AI-assisted pipeline (Claude) with human review on pricing, brand voice and compliance; and weekly competitor scans track pricing and assortment movements on Amazon DE and eBay DE.',
      'Current expansion work includes preparing the Amazon DE catalogue launch, including German VAT registration, and rolling the full A.B.S. assortment out to eBay DE and Bol.com with marketplace-specific content rules. The case shows how one operator can run a multi-channel parts business by combining structured product data, feed automation and AI-assisted workflows with human commercial judgment.',
    ],
  };
  const { html } = renderQuietly(route, null, { initialLang: "nl" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(head, `
          <p>Back to <a href="/work">all case studies</a> or see <a href="/amazon-nl-specialist">Amazon specialist services</a>.</p>`));
  page = setJsonLd(page, {
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
        author: { "@type": "Person", "@id": `${BASE}/#person`, name: "Hans van Leeuwen" },
        inLanguage: "nl",
      },
      WEBSITE_ENTITY,
      PERSON_ENTITY,
      PROFESSIONAL_SERVICE_ENTITY,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: "Case Studies", item: `${BASE}/work` },
          { "@type": "ListItem", position: 3, name: "Connect Car Parts", item: head.canonical },
        ],
      },
    ],
  });
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(head.canonical)}"`)
  );
  const outDir = path.join(distDir, "work", "connect-car-parts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf8");
  console.log(`[prerender] ${route} -> ${path.join(outDir, "index.html")}`);
}

console.log("[prerender] Done.");
process.exit(0);


