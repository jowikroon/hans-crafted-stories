import { Link, useLocation } from "react-router-dom";
import { AudioLines, ChevronDown, Disc3, Images, PenLine } from "lucide-react";
import "./music-cms/music-production-menu.css";
import { useHoverDisclosure } from "@/hooks/useHoverDisclosure";

export const MUSIC_PRODUCTION_LINKS = [
  { to: "/music-cms?mode=artwork", label: "Beeldbank", icon: Images },
  { to: "/music-cms?mode=neon", label: "NEON", icon: Disc3 },
  { to: "/music-cms?mode=write", label: "Songwriter", icon: PenLine },
] as const;

/** Inline disclosure keeps the submenu inside the scrollable profile panel. */
export default function MusicProductionMenu({ onNavigate, mobile = false }: { onNavigate: () => void; mobile?: boolean }) {
  const disclosure = useHoverDisclosure({ hover: !mobile });
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get("mode");
  const id = mobile ? "music-production-mobile" : "music-production-desktop";
  return <div ref={disclosure.containerRef} className="music-production-menu" {...disclosure.containerProps}>
    <button ref={disclosure.triggerRef} type="button" aria-controls={id} {...disclosure.triggerProps}>
      <AudioLines size={15} aria-hidden="true" /><span>Muziekproductie</span><ChevronDown size={12} className={disclosure.isOpen ? "is-open" : ""} aria-hidden="true" />
    </button>
    {disclosure.isOpen && <nav id={id} aria-label="Muziekproductie">
      {MUSIC_PRODUCTION_LINKS.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={location.pathname.startsWith("/music-cms") && (mode === new URLSearchParams(to.split("?")[1]).get("mode") || (label === "Songwriter" && /^\/music-cms\/.+/.test(location.pathname))) ? "page" : undefined} onClick={() => { disclosure.close(); onNavigate(); }}>
        <Icon size={14} aria-hidden="true" /><span>{label}</span>
      </Link>)}
    </nav>}
  </div>;
}
