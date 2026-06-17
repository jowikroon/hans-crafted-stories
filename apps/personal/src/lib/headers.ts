// ── Header style registry ─────────────────────────────────────────────
// Single source of truth for the header designs available on the site.
// To add a new header in the future: build the component under
// src/components/headers, wire it into Navbar.tsx's selector, and add one
// entry to HEADERS. It then appears automatically in the on-page editor's
// "Header style" switcher — no other editor code changes needed.

export interface HeaderOption {
  id: string;
  label: string;
}

export const HEADERS: HeaderOption[] = [
  { id: "dnav", label: "Dark (dnav)" },
  { id: "neon", label: "Neon pill" },
];

/** Active header when nothing has been chosen in the editor yet. */
export const DEFAULT_HEADER_ID = "dnav";

/** Key under which the chosen header id is persisted in page_overrides. */
export const HEADER_SETTING_KEY = "__site__:header-style";

export function headerById(id?: string | null): HeaderOption {
  return (
    HEADERS.find((h) => h.id === id) ??
    HEADERS.find((h) => h.id === DEFAULT_HEADER_ID) ??
    HEADERS[0]
  );
}
