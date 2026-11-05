/** Only article-visible anchors that actually exist on the About page. */
const ABOUT_SECTIONS = new Set(["verhaal", "loopbaan", "diensten", "contact"]);

export function getAboutSectionFromHash(hash: string): string | null {
  if (!hash.startsWith("#")) return null;
  try {
    const section = decodeURIComponent(hash.slice(1));
    return ABOUT_SECTIONS.has(section) ? section : null;
  } catch {
    return null;
  }
}
