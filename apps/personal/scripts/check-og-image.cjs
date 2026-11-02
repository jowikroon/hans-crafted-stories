/**
 * Build-time check: warn if hans-profile.jpg is over ~300KB (OG/social images should be fast and under 300KB).
 * Run after vite build or as part of build. To compress: use Squoosh, ImageOptim, or similar.
 */
const fs = require("fs");
const path = require("path");

const OG_IMAGE = path.resolve(__dirname, "..", "public", "hans-profile.jpg");
const MAX_KB = 300;

if (!fs.existsSync(OG_IMAGE)) {
  console.warn("[check-og-image] public/hans-profile.jpg not found. Skipping.");
  process.exit(0);
}

const stat = fs.statSync(OG_IMAGE);
const sizeKb = Math.round(stat.size / 1024);
if (sizeKb > MAX_KB) {
  console.warn(
    `[check-og-image] public/hans-profile.jpg is ${sizeKb}KB (recommended < ${MAX_KB}KB for social sharing). Consider compressing with Squoosh, ImageOptim, or pngquant.`
  );
} else {
  console.log(`[check-og-image] public/hans-profile.jpg is ${sizeKb}KB (OK).`);
}
