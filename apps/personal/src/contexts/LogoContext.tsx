import { createContext, useContext } from "react";
import { DEFAULT_LOGO_ID } from "@/lib/logos";

export interface LogoControls {
  activeLogoId: string;
  setActiveLogo: (id: string) => void | Promise<void>;
  /** Whether the header logo animates on hover (site-wide; default on). */
  logoMotion?: boolean;
  setLogoMotion?: (on: boolean) => void | Promise<void>;
}

// Standalone context (no Supabase import) so components like Navbar can read
// the active logo without pulling the data layer into their module graph.
const LogoContext = createContext<LogoControls>({
  activeLogoId: DEFAULT_LOGO_ID,
  setActiveLogo: () => {},
  logoMotion: true,
  setLogoMotion: () => {},
});

export const LogoProvider = LogoContext.Provider;

/** Active header logo id — safe anywhere; defaults when no provider is mounted. */
export function useActiveLogo(): string {
  return useContext(LogoContext).activeLogoId;
}

/** Whether the header logo animates on hover — safe anywhere; defaults on. */
export function useLogoMotion(): boolean {
  return useContext(LogoContext).logoMotion ?? true;
}
