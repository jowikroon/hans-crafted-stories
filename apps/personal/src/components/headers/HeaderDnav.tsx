import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "@/components/LocalizedLink";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { useActiveLogo } from "@/contexts/LogoContext";
import { logoById } from "@/lib/logos";
import { translations } from "@/data/translations";
import "../dnav.css";

/* ─────────────────────────────────────────────────────────────
   Dark, gold-accent header — ported from the live hansvanleeuwen.com
   ".dnav" reference. Fixed top bar that is transparent over the hero
   then turns to dark frosted glass on scroll (or while the mobile
   sheet is open). All styling lives in dnav.css; this component only
   wires up routing, auth, language and the scroll / sheet state.

   Simplifications vs the previous Navbar (kept intentionally, the
   template has none of these): the ⌘K search overlay, the sun/moon
   theme toggle and the Work hover-dropdown have been dropped.
   ───────────────────────────────────────────────────────────── */

interface NavbarProps {
  /** Kept for App.tsx compatibility only. The dnav renders one dark
      style on every page, so variant/compact are intentionally ignored. */
  variant?: "default" | "dark";
  compact?: boolean;
}

/* Outlined login button arrow (matches the reference SVG exactly). */
const LoginArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const HeaderDnav = (_props: NavbarProps) => {
  const location = useLocation();
  const { lang, setLang } = useLang();
  const { user, signOut } = useAuth();
  const t = translations[lang].nav;

  /* Active header logo (chosen in the on-page editor, persisted site-wide).
     Falls back to the default mark when nothing is selected. */
  const activeLogoId = useActiveLogo();
  const logo = logoById(activeLogoId);

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /* Active-link logic — Work is also active on its service sub-pages. */
  const isActive = (to: string) => location.pathname === to;
  const isWorkActive =
    location.pathname.startsWith("/work") ||
    ["/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager"].includes(location.pathname);
  const isCommandCenter = location.pathname.startsWith("/write");

  /* Real routes/labels, mirroring the wiring of the previous Navbar.
     Command Center is appended only when a user is logged in. */
  const links = [
    { to: "/", label: t.home, active: isActive("/") },
    { to: "/work", label: t.work, active: isWorkActive },
    { to: "/writing", label: t.writing, active: isActive("/writing") },
    { to: "/music", label: "Music", active: isActive("/music") },
    { to: "/about", label: t.about, active: isActive("/about") },
    ...(user ? [{ to: "/write", label: t.commandCenter, active: isCommandCenter }] : []),
  ];

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || t.portal;

  /* Frosted-on-scroll. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Mobile sheet: lock body scroll while open, close on Escape. */
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
      document.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  /* Language pill — active = current lang. */
  const LangPill = () => (
    <div className="dnav__lang" role="group" aria-label="Language">
      <button type="button" className={lang === "nl" ? "on" : undefined} onClick={() => setLang("nl")}>NL</button>
      <button type="button" className={lang === "en" ? "on" : undefined} onClick={() => setLang("en")}>ENG</button>
    </div>
  );

  /* Login control — logged-out links to /portal; logged-in shows the
     first name and a logout control. signOut is preserved. */
  const LoginControl = ({ onNavigate }: { onNavigate?: () => void }) =>
    user ? (
      <button
        type="button"
        className="dnav__login"
        onClick={() => { signOut(); onNavigate?.(); }}
        aria-label={`${firstName}, ${t.workspace.signOut}`}
      >
        <LoginArrow />
        {firstName} · {t.workspace.signOut}
      </button>
    ) : (
      <Link className="dnav__login" to="/portal" onClick={onNavigate}>
        <LoginArrow />
        {t.login}
      </Link>
    );

  return (
    <header className={`dnav${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`} id="dnav">
      <div className="dnav__inner">
        <Link to="/" className="dnav__brand" aria-label="Hans van Leeuwen, home" onClick={() => setOpen(false)}>
          <span className="dnav__mark">
            {logo?.src
              ? <img src={logo.src} alt={logo.label || "Hans van Leeuwen"} className="dnav__logo" />
              : "h"}
          </span>
          <span className="dnav__name">Hans van Leeuwen</span>
        </Link>

        <nav className="dnav__links" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={l.active ? "is-active" : undefined}
              aria-current={l.active ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="dnav__right">
          <LangPill />
          <span className="dnav__divider" />
          <LoginControl />
          <button
            className="dnav__burger"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="dnavSheet"
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className="dnav__sheet" id="dnavSheet">
        {links.map((l, i) => (
          <Link
            key={l.to}
            className={`dnav__slink${l.active ? " is-active" : ""}`}
            to={l.to}
            aria-current={l.active ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="lbl">{l.label}</span>
            <span className="ix">{String(i + 1).padStart(2, "0")}</span>
          </Link>
        ))}
        <div className="dnav__sheetfoot">
          <LangPill />
          <LoginControl onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </header>
  );
};

export default HeaderDnav;
export { HeaderDnav };
