import { useActiveHeader } from "@/contexts/HeaderContext";
import HeaderDnav from "./headers/HeaderDnav";
import HeaderNeon from "./headers/HeaderNeon";

/* ─────────────────────────────────────────────────────────────
   Thin header selector. The active design is chosen in the on-page
   editor's "Header style" switcher (persisted site-wide) and read
   here via useActiveHeader(). Both designs accept the same props,
   so App.tsx is unchanged.

   - "neon" → light floating pill nav (search / theme / profile)
   - default ("dnav") → dark gold-accent header
   ───────────────────────────────────────────────────────────── */

interface NavbarProps {
  variant?: "default" | "dark";
  compact?: boolean;
}

const Navbar = (props: NavbarProps) => {
  const activeHeaderId = useActiveHeader();
  return activeHeaderId === "neon" ? <HeaderNeon {...props} /> : <HeaderDnav {...props} />;
};

export default Navbar;
