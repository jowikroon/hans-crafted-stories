// ── Site font registry ────────────────────────────────────────────────
// Single source of truth for the font "styles" available site-wide.
// Each entry pairs a MAIN (display / heading) font with a SUB (body) font —
// mirroring the header + logo switchers. Selecting one in the on-page editor
// rewrites the global --font-display / --font-body CSS variables (defined in
// index.css :root) for every visitor, so the whole site restyles at once.
//
// To add a new style later: add one entry below. If it uses a font that is
// not already loaded in index.html, list its stylesheet URL(s) in `hrefs`
// and the applier/editor injects them on demand — no other code changes.

export interface FontOption {
  id: string;
  label: string;
  /** CSS value for --font-display (the MAIN / heading font). */
  display: string;
  /** CSS value for --font-body (the SUB / body font). */
  body: string;
  /** Human-readable "Main · Sub" pairing shown under the swatch. */
  pairing: string;
  /** Stylesheet URLs to ensure are loaded while this style is active. */
  hrefs?: string[];
}

const GENERAL_SANS = "'General Sans', 'Switzer', system-ui, sans-serif";
const HREF_BRICOLAGE =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap";
const HREF_FRAUNCES =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap";
const HREF_JETBRAINS =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap";

export const FONTS: FontOption[] = [
  {
    id: "editorial",
    label: "Editorial",
    display: "'Newsreader', Georgia, serif",
    body: GENERAL_SANS,
    pairing: "Newsreader · General Sans",
    // Both fonts are already preloaded in index.html — the site default.
  },
  {
    id: "grotesk",
    label: "Grotesk",
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: GENERAL_SANS,
    pairing: "Bricolage · General Sans",
    hrefs: [HREF_BRICOLAGE],
  },
  {
    id: "fraunces",
    label: "Fraunces",
    display: "'Fraunces', 'Newsreader', Georgia, serif",
    body: GENERAL_SANS,
    pairing: "Fraunces · General Sans",
    hrefs: [HREF_FRAUNCES],
  },
  {
    id: "clean",
    label: "Clean sans",
    display: GENERAL_SANS,
    body: GENERAL_SANS,
    pairing: "General Sans · General Sans",
  },
  {
    id: "mono",
    label: "Mono neon",
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    pairing: "Bricolage · JetBrains Mono",
    hrefs: [HREF_BRICOLAGE, HREF_JETBRAINS],
  },
];

/** Active font style when nothing has been chosen in the editor yet. */
export const DEFAULT_FONT_ID = "editorial";

/** Key under which the chosen font-style id is persisted in page_overrides. */
export const FONT_SETTING_KEY = "__site__:font-style";

export function fontById(id?: string | null): FontOption {
  return (
    FONTS.find((f) => f.id === id) ??
    FONTS.find((f) => f.id === DEFAULT_FONT_ID) ??
    FONTS[0]
  );
}
