// ── Header logo registry ──────────────────────────────────────────────
// Single source of truth for the logos available in the header.
// To add a new logo in the future: drop the file in src/assets, import it
// here, and add one entry to LOGOS. It then appears automatically in the
// on-page editor's "Header Logo" switcher — no other code changes needed.
import logoBronze from "@/assets/logo-hvl-bronze.png";
import logoWordmarkV2 from "@/assets/logo-hvl-v2.png";
import logoHMonogram from "@/assets/logo-hvl-h.svg";

export interface LogoOption {
  id: string;
  label: string;
  src: string;
}

export const LOGOS: LogoOption[] = [
  { id: "h-monogram", label: "h monogram", src: logoHMonogram },
  { id: "bronze", label: "Bronze mark", src: logoBronze },
  { id: "wordmark-v2", label: "Wordmark v2", src: logoWordmarkV2 },
];

/** Active logo when nothing has been chosen in the editor yet. */
export const DEFAULT_LOGO_ID = "h-monogram";

/** Key under which the chosen logo id is persisted in page_overrides. */
export const LOGO_SETTING_KEY = "__site__:header-logo";

export function logoById(id?: string | null): LogoOption {
  return (
    LOGOS.find((l) => l.id === id) ??
    LOGOS.find((l) => l.id === DEFAULT_LOGO_ID) ??
    LOGOS[0]
  );
}
