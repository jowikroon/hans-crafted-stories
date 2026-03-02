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

console.log("[prerender] Done.");
