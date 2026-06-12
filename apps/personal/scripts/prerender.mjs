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
} = await import(
  pathToFileURL(entryPath).href
);

// Empty #root so we can inject prerendered content (inject-static-content already ran for homepage).
// Use balanced div parsing so nested homepage markup cannot leak into prerendered article pages.
template = clearRootHtml(template);

const BASE = "https://hansvanleeuwen.com";

// Static page SEO (English, primary for prerender) — aligned with functions/[[path]].ts ROUTE_META
const ABOUT_HEAD = {
  title: "About Hans van Leeuwen – E-commerce Manager | 10+ Years Experience",
  description:
    "Learn about Hans van Leeuwen's 10+ years of experience in e-commerce management, marketplace strategy (Amazon, Bol.com), UX design, and digital commerce. Based in Amersfoort, NL.",
  canonical: `${BASE}/about`,
};

const WORK_HEAD = {
  title: "Design Portfolio & Case Studies – E-commerce, 3D & UX | Hans van Leeuwen",
  description:
    "Explore Hans van Leeuwen's portfolio of e-commerce UX projects, 3D creative work, VR game design, and branding case studies with real results.",
  canonical: `${BASE}/work`,
};

const WRITING_HEAD = {
  title: "E-commerce Insights & Articles | Hans van Leeuwen",
  description:
    "Read Hans van Leeuwen's thoughts on e-commerce strategy, marketplace optimization, Amazon growth, Bol.com best practices, and digital commerce trends.",
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
    {
      "@type": "Person",
      "@id": "https://hansvanleeuwen.com/#person",
      name: "Hans van Leeuwen",
      url: `${BASE}/about`,
      jobTitle: "Freelance E-commerce Manager",
      description:
        "Freelance e-commerce manager with 10+ years of experience in marketplace strategy, Amazon, Bol.com, and digital commerce.",
      image: {
        "@type": "ImageObject",
        url: `${BASE}/hans-profile.jpg`,
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
  ],
};

const WORK_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${BASE}/work#page`,
      name: "Design Portfolio & Case Studies – E-commerce, 3D & UX | Hans van Leeuwen",
      description: WORK_HEAD.description,
      url: `${BASE}/work`,
      isPartOf: { "@id": `${BASE}/#website` },
      about: { "@type": "Person", "@id": `${BASE}/#person` },
      author: { "@type": "Person", "@id": `${BASE}/#person`, name: "Hans van Leeuwen" },
    },
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

function setHead(html, { title, description, canonical }) {
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
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(head.description)}</p>
          ${body || "<p>Full article coming soon.</p>"}
        </article>
      </main>`;
}


function buildStaticPageFallback(head) {
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
          <h1>${escapeHtml(head.title)}</h1>
          <p>${escapeHtml(head.description)}</p>
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
  page = setJsonLd(page, getBlogPostJsonLd(blogPost));
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
  const { html } = renderQuietly(route, null, { initialLang: "en" });
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
  const { html } = renderQuietly(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, WORK_HEAD);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(WORK_HEAD));
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
  const { html } = renderQuietly(route, null, { initialLang: "en", preloadedBlogPosts: writingPosts });
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
      title: "Amazon NL Specialist — Freelance Amazon Netherlands Account Manager | Hans van Leeuwen",
      description: "Freelance Amazon NL specialist with 10+ years managing Amazon Netherlands accounts. Listing optimization, Amazon Ads, A+ content & marketplace growth. Based in Amersfoort.",
      canonical: `${BASE}/amazon-nl-specialist`,
    },
  },
  {
    route: "/bol-com-consultant",
    head: {
      title: "Bol.com Consultant — Freelance Bol.com Specialist & Ads Manager | Hans van Leeuwen",
      description: "Freelance Bol.com consultant specializing in product content optimization, Bol Ads management, and marketplace growth strategy. Based in Amersfoort, Netherlands.",
      canonical: `${BASE}/bol-com-consultant`,
    },
  },
  {
    route: "/privacy",
    head: {
      title: "Privacy Policy | Hans van Leeuwen",
      description: "Privacy policy for hansvanleeuwen.com — what data is collected, how analytics cookies are used, and your rights under the GDPR.",
      canonical: `${BASE}/privacy`,
    },
  },
  {
    route: "/interim-ecommerce-manager",
    head: {
      title: "Interim E-commerce Manager — Freelance Marketplace Lead (NL/EU) | Hans van Leeuwen",
      description: "Interim e-commerce manager available for freelance marketplace leadership roles. Strategy, operations & hands-on execution for Amazon, Bol.com & more. NL/EU.",
      canonical: `${BASE}/interim-ecommerce-manager`,
    },
  },
];

for (const { route, head } of SEO_PAGES) {
  const { html } = renderQuietly(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);
  page = replaceSsrFallbackHtml(page, buildStaticPageFallback(head));
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
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: head.title.split("\u2014")[0].split("|")[0].trim(), item: head.canonical },
        ],
      },
    ],
  });
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

console.log("[prerender] Done.");
process.exit(0);
