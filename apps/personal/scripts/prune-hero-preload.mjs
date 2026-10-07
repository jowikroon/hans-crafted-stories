/**
 * Haalt de hero-preload weer weg op pagina's die de hero-afbeelding niet tonen.
 *
 * vite-plugin `preloadHeroImage` zet de preload in het index.html-template, en
 * scripts/prerender.mjs kopieert dat template naar elke route. Op /writing,
 * /work, /privacy en /rates staat de afbeelding niet, en dan is de preload
 * 51 KB verspilde bandwidth plus een Lighthouse-waarschuwing ("preloaded
 * resource was not used"). Deze stap draait na prerender en verwijdert de tag
 * op elke pagina waar de bijbehorende <img> niet voorkomt.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");
const PRELOAD_RE = /\s*<link rel="preload" as="image" fetchpriority="high" href="(\/assets\/hans-profile-[^"]+)" \/>\n?/;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* htmlFiles(full);
    else if (entry === "index.html") yield full;
  }
}

let pruned = 0;
let kept = 0;
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf-8");
  const match = html.match(PRELOAD_RE);
  if (!match) continue;
  const href = match[1];
  // Wordt de afbeelding op deze pagina ook echt gerenderd?
  if (html.includes(`src="${href}"`) || html.includes(`srcset="${href}`)) {
    kept++;
    continue;
  }
  writeFileSync(file, html.replace(PRELOAD_RE, "\n"), "utf-8");
  pruned++;
}
console.log(`[prune-hero-preload] preload behouden op ${kept} pagina's, verwijderd op ${pruned}`);
