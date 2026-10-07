/**
 * Genereert AVIF/WebP-varianten van de hero-foto.
 *
 * Waarom: hans-profile.jpg is 840x1080 en 51 KB en wordt op vier plekken
 * gebruikt, waarvan twee als 56px-avatar. Die avatars downloadden dus de volle
 * 51 KB voor een duimnagel. Daarnaast is AVIF op dezelfde kwaliteit ongeveer
 * een derde van de JPEG, wat direct op LCP scheelt op /about en op desktop /.
 *
 * Output gaat naar src/assets/generated/ en wordt gecommit: zo werkt een build
 * ook als deze stap wordt overgeslagen, en hasht Vite de bestanden normaal mee.
 * De stap is idempotent, hij slaat over wat nieuwer is dan de bron.
 *
 * Draaien: npm run images (of automatisch als eerste stap van npm run build).
 */
import sharp from "sharp";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "src", "assets", "hans-profile.jpg");
const OUT = join(here, "..", "src", "assets", "generated");

/** Portret, 3:4, voor Hero (desktop) en About (alle breedtes). */
const PORTRAIT_WIDTHS = [420, 840];
/** Vierkante top-crop voor de 56px-avatars in ServicePage en de blog-byline. */
const AVATAR_SIZE = 112;

const AVIF = { quality: 50, effort: 6 };
const WEBP = { quality: 72 };
const JPEG = { quality: 78, progressive: true, mozjpeg: true };

mkdirSync(OUT, { recursive: true });

const srcMtime = statSync(SRC).mtimeMs;
const fresh = (p) => existsSync(p) && statSync(p).mtimeMs >= srcMtime;

const made = [];
const skipped = [];

async function write(path, pipeline) {
  if (fresh(path)) { skipped.push(path); return; }
  const info = await pipeline.toFile(path);
  made.push(`${path.split("/").pop()} ${(info.size / 1024).toFixed(1)} KB`);
}

for (const w of PORTRAIT_WIDTHS) {
  const base = sharp(SRC).resize({ width: w, withoutEnlargement: true });
  await write(join(OUT, `hans-profile-${w}.avif`), base.clone().avif(AVIF));
  await write(join(OUT, `hans-profile-${w}.webp`), base.clone().webp(WEBP));
  await write(join(OUT, `hans-profile-${w}.jpg`), base.clone().jpeg(JPEG));
}

// object-top in de UI, dus hier ook vanaf de bovenkand croppen.
const avatar = sharp(SRC).resize({
  width: AVATAR_SIZE,
  height: AVATAR_SIZE,
  fit: "cover",
  position: "top",
});
await write(join(OUT, `hans-profile-avatar.avif`), avatar.clone().avif(AVIF));
await write(join(OUT, `hans-profile-avatar.webp`), avatar.clone().webp(WEBP));
await write(join(OUT, `hans-profile-avatar.jpg`), avatar.clone().jpeg(JPEG));

console.log(`[gen-image-variants] nieuw: ${made.length}${made.length ? " (" + made.join(", ") + ")" : ""}, ongewijzigd: ${skipped.length}`);
