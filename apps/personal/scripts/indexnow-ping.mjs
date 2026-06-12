/**
 * IndexNow ping — submits all sitemap URLs to api.indexnow.org after each production build.
 * Never fails the build: all errors are logged and swallowed.
 * Key file: public/d98bc066226cb57ba6ed643218724ada.txt (served at site root per IndexNow spec).
 */
const KEY = "d98bc066226cb57ba6ed643218724ada";
const HOST = "hansvanleeuwen.com";
const BASE = `https://${HOST}`;

const branch = process.env.CF_PAGES_BRANCH;
if (branch && branch !== "main") {
  console.log(`[indexnow] skip — branch ${branch} is not main`);
  process.exit(0);
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.resolve(__dirname, "..", "dist", "sitemap.xml");

try {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("no URLs in sitemap");
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${BASE}/${KEY}.txt`, urlList: urls }),
  });
  console.log(`[indexnow] submitted ${urls.length} URLs — HTTP ${res.status}`);
} catch (err) {
  console.warn(`[indexnow] skipped: ${err.message}`);
}
process.exit(0);
