// ── Page-style template registry ──────────────────────────────────────
// Named presets that pair a /writing skin with a site-wide font style, so
// one click restyles the site coherently. Derived from Hans's design
// prototypes (Website.html, Writing Studio, Music - Neon, marketplace UX,
// Writing Redesign v2). Adding a template later = one entry here.

import type { SkinId } from "@/hooks/useSkin";

export interface StyleTemplate {
  id: string;
  label: string;
  hint: string;
  /** /writing skin this template applies. */
  skin: SkinId;
  /** Site-wide font style id (lib/fonts.ts). */
  font: string;
  /** Preview swatch: [bg, ink, accent]. */
  swatch: [string, string, string];
  /** Font pairing shown under the swatch. */
  pairing: string;
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: "editorial-paper",
    label: "Editorial Paper",
    hint: "Warm papier, Newsreader-koppen, de klassieke site-look",
    skin: "editorial-light",
    font: "editorial",
    swatch: ["#FBF8F0", "#15140F", "#2D9255"],
    pairing: "Newsreader · General Sans",
  },
  {
    id: "paper-serif",
    label: "Paper Serif",
    hint: "Zachter papier met een expressieve serif (Writing Studio)",
    skin: "paper",
    font: "fraunces",
    swatch: ["#F6F1E7", "#211E17", "#1C6B45"],
    pairing: "Fraunces · General Sans",
  },
  {
    id: "neon-after-hours",
    label: "Neon After Hours",
    hint: "Donker, compact, neon accent, de Music-Neon vibe",
    skin: "mono-dark",
    font: "mono",
    swatch: ["#08080A", "#F2EEE2", "#FFD83D"],
    pairing: "Bricolage · JetBrains Mono",
  },
  {
    id: "slate-product",
    label: "Slate Product",
    hint: "Koel neutraal, blauw accent, product-blog feel",
    skin: "slate",
    font: "grotesk",
    swatch: ["#F1F5F9", "#0F172A", "#2A6FDB"],
    pairing: "Bricolage · General Sans",
  },
  {
    id: "comfy-air",
    label: "Comfy Air",
    hint: "Licht, ruimere spacing en grotere letters (Redesign v2)",
    skin: "comfy",
    font: "clean",
    swatch: ["#FDFCF9", "#29261B", "#D97757"],
    pairing: "General Sans · General Sans",
  },
];
