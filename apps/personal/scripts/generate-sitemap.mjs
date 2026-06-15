/**
 * Generate dist/sitemap.xml (and public/sitemap.xml in dev) from static routes + published Supabase posts.
 * Runs at build time after prerender, so the sitemap never goes stale.
 *
 * Env: VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (read from .env.production fallback .env.development).
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const BASE = "https://hansvanleeuwen.com";

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  for (const file of [".env.production", ".env.development"]) {
    const p = path.join(appDir, file);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(new RegExp(`^${name}="?([^"\n]+)"?`, "m"));
    if (m) return m[1];
  }
  return null;
}

const SUPABASE_URL = readEnv("VITE_SUPABASE_URL");
const SUPABASE_KEY = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

const STATIC_ROUTES = [
  { loc: `${BASE}/`, changefreq: "monthly", priority: "1.0" },
  { loc: `${BASE}/work`, changefreq: "monthly", priority: "0.8" },
  { loc: `${BASE}/work/connect-car-parts`, changefreq: "yearly", priority: "0.7" },
  { loc: `${BASE}/writing`, changefreq: "weekly", priority: "0.8" },
  { loc: `${BASE}/about`, changefreq: "monthly", priority: "0.8" },
  { loc: `${BASE}/music`, changefreq: "monthly", priority: "0.7" },
  { loc: `${BASE}/music/beat-drop`, changefreq: "monthly", priority: "0.6" },
  { loc: `${BASE}/music/teacher-leave`, changefreq: "yearly", priority: "0.5" },
  { loc: `${BASE}/music/hanging-on`, changefreq: "yearly", priority: "0.5" },
  { loc: `${BASE}/music/beat-between-our-years`, changefreq: "yearly", priority: "0.5" },
  { loc: `${BASE}/music/new-level`, changefreq: "yearly", priority: "0.5" },
  { loc: `${BASE}/amazon-nl-specialist`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE}/bol-com-consultant`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE}/interim-ecommerce-manager`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE}/ai-ecommerce-automation`, changefreq: "monthly", priority: "0.9" },
  { loc: `${BASE}/privacy`, changefreq: "yearly", priority: "0.3" },
];

async function fetchPublishedPosts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[sitemap] Supabase env missing — static routes only");
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at,canonical_url&status=eq.published&published=eq.true&order=updated_at.desc`;
  const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!res.ok) {
    console.warn(`[sitemap] Supabase fetch failed (${res.status}) — static routes only`);
    return [];
  }
  return res.json();
}

function iso(date) {
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const posts = await fetchPublishedPosts();
const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: r.loc === `${BASE}/writing` && posts[0] ? iso(posts[0].updated_at) : today })),
  ...posts
    // External canonicals point elsewhere; keep only self-canonical posts in our sitemap
    .filter((p) => !p.canonical_url || p.canonical_url.startsWith(BASE))
    .map((p) => ({
      loc: `${BASE}/writing/${p.slug}`,
      lastmod: iso(p.updated_at),
      changefreq: "yearly",
      priority: "0.6",
    })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const distPath = path.join(appDir, "dist", "sitemap.xml");
const publicPath = path.join(appDir, "public", "sitemap.xml");
let wrote = [];
if (fs.existsSync(path.join(appDir, "dist"))) {
  fs.writeFileSync(distPath, xml, "utf8");
  wrote.push(distPath);
}
fs.writeFileSync(publicPath, xml, "utf8");
wrote.push(publicPath);
console.log(`[sitemap] ${urls.length} urls -> ${wrote.join(", ")}`);
