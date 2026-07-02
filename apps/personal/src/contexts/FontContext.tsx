import { createContext, useContext } from "react";
import { DEFAULT_FONT_ID } from "@/lib/fonts";

export interface FontControls {
  activeFontId: string;
  setActiveFont: (id: string) => void | Promise<void>;
}

// Standalone context (no Supabase import) so any component can read the active
// font style without pulling the data layer into its module graph — matches
// the LogoContext / HeaderContext pattern.
const FontContext = createContext<FontControls>({
  activeFontId: DEFAULT_FONT_ID,
  setActiveFont: () => {},
});

export const FontProvider = FontContext.Provider;

/** Active font-style id — safe anywhere; defaults when no provider is mounted. */
export function useActiveFont(): string {
  return useContext(FontContext).activeFontId;
}
