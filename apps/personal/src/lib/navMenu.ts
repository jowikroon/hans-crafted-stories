// ── Header nav-menu registry ──────────────────────────────────────────
// Single source of truth for the editable main-header menu. The default
// list mirrors what Navbar.tsx historically hardcoded; the Design mode in
// /write lets Hans reorder items (drag & drop), hide/show them, rename
// labels (NL/EN) and add extra pages. The chosen menu is persisted as one
// page_overrides row (element_key NAV_SETTING_KEY, JSON in text_override)
// — same additive mechanism as the logo / font site settings, so this
// ships with ZERO schema changes.

export interface NavMenuItem {
  /** Stable identity for reorder/remove (route path is not unique enough for custom links). */
  id: string;
  /** Internal route path ("/writing") or absolute URL ("https://…"). */
  to: string;
  labelNl: string;
  labelEn: string;
  visible: boolean;
  /** Built-in items can be hidden but not removed. */
  builtin?: boolean;
}

/** Key under which the menu is persisted in page_overrides. */
export const NAV_SETTING_KEY = "__site__:nav-menu";

/** Defaults — identical to the historic hardcoded Navbar links. */
export const DEFAULT_NAV_ITEMS: NavMenuItem[] = [
  { id: "home",    to: "/",        labelNl: "Home",      labelEn: "Home",         visible: true, builtin: true },
  { id: "work",    to: "/work",    labelNl: "Werk",      labelEn: "Case Studies", visible: true, builtin: true },
  { id: "writing", to: "/writing", labelNl: "Artikelen", labelEn: "Articles",     visible: true, builtin: true },
  { id: "music",   to: "/music",   labelNl: "Muziek",    labelEn: "Music",        visible: true, builtin: true },
  { id: "about",   to: "/about",   labelNl: "Over mij",  labelEn: "About Hans",   visible: true, builtin: true },
];

/** Public routes that can be added to the menu from the Design mode. */
export const ADDABLE_PAGES: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Werk / Case Studies" },
  { to: "/work/connect-car-parts", label: "Case: Connect Car Parts" },
  { to: "/writing", label: "Artikelen / Writing" },
  { to: "/music", label: "Muziek" },
  { to: "/about", label: "Over mij" },
  { to: "/amazon-nl-specialist", label: "Amazon NL Specialist" },
  { to: "/bol-com-consultant", label: "Bol.com Consultant" },
  { to: "/interim-ecommerce-manager", label: "Interim E-commerce Manager" },
  { to: "/ai-ecommerce-automation", label: "AI E-commerce Automation" },
  { to: "/privacy", label: "Privacy" },
];

/** Parse the persisted JSON; anything malformed falls back to the defaults. */
export function parseNavSetting(text: string | null | undefined): NavMenuItem[] {
  if (!text) return DEFAULT_NAV_ITEMS;
  try {
    const raw = JSON.parse(text) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_NAV_ITEMS;
    const items = raw
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r, i): NavMenuItem => ({
        id: typeof r.id === "string" && r.id ? r.id : `item-${i}`,
        to: typeof r.to === "string" && r.to ? r.to : "/",
        labelNl: typeof r.labelNl === "string" ? r.labelNl : "",
        labelEn: typeof r.labelEn === "string" ? r.labelEn : "",
        visible: r.visible !== false,
        builtin: r.builtin === true,
      }))
      .filter((r) => r.labelNl || r.labelEn);
    return items.length ? items : DEFAULT_NAV_ITEMS;
  } catch {
    return DEFAULT_NAV_ITEMS;
  }
}

export function serializeNavSetting(items: NavMenuItem[]): string {
  return JSON.stringify(items);
}
