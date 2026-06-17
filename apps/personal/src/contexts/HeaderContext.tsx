import { createContext, useContext } from "react";
import { DEFAULT_HEADER_ID } from "@/lib/headers";

export interface HeaderControls {
  activeHeaderId: string;
  setActiveHeader: (id: string) => void | Promise<void>;
}

// Standalone context (no Supabase import) so components like Navbar can read
// the active header without pulling the data layer into their module graph.
const HeaderContext = createContext<HeaderControls>({
  activeHeaderId: DEFAULT_HEADER_ID,
  setActiveHeader: () => {},
});

export const HeaderProvider = HeaderContext.Provider;

/** Active header style id — safe anywhere; defaults when no provider is mounted. */
export function useActiveHeader(): string {
  return useContext(HeaderContext).activeHeaderId;
}
