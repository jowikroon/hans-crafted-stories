/**
 * Prerender hero blog posts into static HTML so /writing/<slug> ships with full content (no Supabase at build).
 * Run after: vite build && node scripts/inject-static-content.cjs && vite build --ssr src/entry-server.tsx
 *
 * Output: dist/writing/<slug>/index.html for each hero slug, with #root filled and __PRELOADED__ for hydration.
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
// Empty #root so we can inject prerendered content (inject-static-content already ran for homepage)
template = template.replace(/<div id="root">[\s\S]*?<\/div>/, '<div id="root"></div>');

// Load server bundle (built with vite build --ssr src/entry-server.tsx)
const entryJs = path.join(distDir, "entry-server.js");
const entryMjs = path.join(distDir, "entry-server.mjs");
const entryPath = fs.existsSync(entryMjs) ? entryMjs : fs.existsSync(entryJs) ? entryJs : null;
if (!entryPath) {
  console.error("[prerender] dist/entry-server.js or .mjs not found. Run: vite build --ssr src/entry-server.tsx");
  process.exit(1);
}

const { render, getHeroPost, getHeroPostHead, HERO_SLUGS } = await import(
  pathToFileURL(entryPath).href
);

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
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Amersfoort",
        addressCountry: "NL",
      },
      sameAs: ["https://www.linkedin.com/in/hansvl3", "https://www.behans.nl"],
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

for (const slug of HERO_SLUGS) {
  const route = `/writing/${slug}`;
  const heroPost = getHeroPost(slug);
  const head = getHeroPostHead(slug);
  if (!heroPost || !head) {
    console.warn(`[prerender] Skipping ${route}: no hero config or content`);
    continue;
  }

  const { html } = render(route, heroPost);
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, head);

  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(head.canonical)}"`)
  );

  const preloadedScript = `<script id="__PRELOADED__" type="application/json">${JSON.stringify(
    { blogPost: heroPost }
  )}</script>`;
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
  const { html } = render(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, ABOUT_HEAD);

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
  const { html } = render(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, WORK_HEAD);
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
  const { html } = render(route, null, { initialLang: "en" });
  let page = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  page = setHead(page, WRITING_HEAD);
  page = page.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(WRITING_JSONLD)}\n    </script>`
  );
  page = page.replace(
    /<link rel="alternate" hreflang="[^"]*" href="https:\/\/hansvanleeuwen\.com\/" \/>/g,
    (m) => m.replace('href="https://hansvanleeuwen.com/"', `href="${escapeHtml(WRITING_HEAD.canonical)}"`)
  );
  const outDir = path.join(distDir, "writing");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page, "utf8");
  console.log(`[prerender] ${route} -> ${path.join(outDir, "index.html")}`);
}

console.log("[prerender] Done.");
