/**
 * Inline de critical CSS per geprerenderde pagina en maak de rest non-blocking.
 *
 * WAAROM DIT, EN NIET "ongebruikte CSS verwijderen":
 * PSI meldt 43 KiB ongebruikte CSS in index.css (178 KB raw / 28 KB gz).
 * Dat bestand is de Tailwind-output over heel src/**, en Tailwind 3 genereert
 * daar één stylesheet van. Die kleiner maken betekent of de content-globs
 * versmallen (breekt de lazy routes) of de arbitrary values opruimen
 * (27,5% van het bestand, en dat is het visuele systeem zelf).
 *
 * Het getal dat op mobiel wél telt is niet de grootte maar de blokkade: de
 * stylesheet staat in het kritieke pad en FCP wacht er een hele round trip op.
 * Deze stap haalt die blokkade weg. Per pagina wordt alleen de CSS die de
 * geprerenderde HTML echt gebruikt in een <style> gezet, en de volledige
 * stylesheet laadt daarna non-blocking via een preload met onload-swap.
 * De bestandsgrootte blijft dus gelijk, de render-blocking tijd gaat naar nul.
 *
 * Draait na prerender, dus op alle 51 pagina's, elk met zijn eigen critical set.
 */
import Beasties from "beasties";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* htmlFiles(full);
    else if (entry === "index.html") yield full;
  }
}

const beasties = new Beasties({
  path: DIST,
  publicPath: "/",
  // preload+onload swap: de volledige stylesheet blokkeert niets meer.
  preload: "swap",
  // Alleen onze eigen gehashte bundle; Fontshare en andere externe sheets
  // blijven zoals ze zijn (die hebben hun eigen preload-constructie in index.html).
  inlineFonts: false,
  preloadFonts: false,
  // Hover- en focus-regels zijn niet nodig voor de eerste paint.
  pruneSource: false,
  mergeStylesheets: false,
  logLevel: "warn",
});

let ok = 0;
let failed = 0;
let inlinedTotal = 0;
let alreadyDone = 0;

for (const file of htmlFiles(DIST)) {
  const before = readFileSync(file, "utf-8");
  // Idempotent: twee keer draaien zou de critical CSS verdubbelen.
  if (/rel="preload"[^>]*href="\/assets\/index-[^"]*\.css"[^>]*onload=/.test(before)) {
    alreadyDone++;
    continue;
  }
  try {
    const after = await beasties.process(before);
    writeFileSync(file, after, "utf-8");
    // Alle style-blokken tellen: index.html had er al een voor de font-stack,
    // dus alleen de eerste pakken geeft een onzinnig getal in de buildlog.
    const blocks = [...after.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
    inlinedTotal += blocks.reduce((n, m) => n + m[1].length, 0);
    ok++;
  } catch (err) {
    failed++;
    console.warn(`[inline-critical-css] overgeslagen: ${file.replace(DIST, "")} — ${err.message}`);
  }
}

const avg = ok ? Math.round(inlinedTotal / ok / 1024 * 10) / 10 : 0;
console.log(`[inline-critical-css] ${ok} pagina's verwerkt, ${alreadyDone} al gedaan, ${failed} overgeslagen, gemiddeld ${avg} KB inline critical CSS`);
if (failed > 0 && ok === 0) process.exit(1);
