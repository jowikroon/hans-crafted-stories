import { createContext, useContext } from "react";
import { DEFAULT_NAV_ITEMS, type NavMenuItem } from "@/lib/navMenu";

export interface NavMenuControls {
  navItems: NavMenuItem[];
  setNavItems: (items: NavMenuItem[]) => void | Promise<void>;
}

// Standalone context (no Supabase import) so Navbar can read the menu
// without pulling the data layer into its module graph — same pattern
// as LogoContext / HeaderContext / FontContext.
const NavMenuContext = createContext<NavMenuControls>({
  navItems: DEFAULT_NAV_ITEMS,
  setNavItems: () => {},
});

export const NavMenuProvider = NavMenuContext.Provider;

/** Editable header menu — safe anywhere; defaults when no provider is mounted. */
export function useNavMenu(): NavMenuControls {
  return useContext(NavMenuContext);
}
