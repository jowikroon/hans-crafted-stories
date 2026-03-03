import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { servicePages, toolPages, scrollToTop } from "./navData";
import type { User } from "@supabase/supabase-js";
import type { Lang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

interface NavLink {
  to: string;
  label: string;
}

interface LangSwitchProps {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangSwitch = ({ lang, setLang }: LangSwitchProps) => (
  <div className="flex items-center gap-0.5 text-xs tracking-widest">
    <button
      onClick={() => setLang("nl")}
      className={`px-1.5 py-0.5 rounded transition-colors ${
        lang === "nl" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      NL
    </button>
    <span className="text-border">/</span>
    <button
      onClick={() => setLang("en")}
      className={`px-1.5 py-0.5 rounded transition-colors ${
        lang === "en" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      EN
    </button>
  </div>
);

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  user: User | null;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const MobileMenu = ({ open, onClose, links, user, lang, setLang }: MobileMenuProps) => {
  const location = useLocation();
  const t = translations[lang].nav;
  const isActive = (to: string) => location.pathname === to;

  const handleClick = () => {
    onClose();
    scrollToTop();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden border-t border-border/40 md:hidden bg-background/95 backdrop-blur-lg"
        >
          <div className="flex flex-col gap-1 px-6 py-5">
            {links.map((link) => (
              <motion.div key={link.to} whileTap={{ scale: 0.95 }}>
              <Link
                to={link.to}
                onClick={handleClick}
                className={`block rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] transition-colors ${
                  isActive(link.to)
                    ? "text-foreground font-medium bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {link.label}
              </Link>
              </motion.div>
            ))}
            <div className="my-2 h-px bg-border/50" />
            <span className="px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              Services
            </span>
            {servicePages.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                onClick={handleClick}
                className="rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/30"
              >
                {p.label}
              </Link>
            ))}
            {user && (
              <>
                <span className="px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-muted-foreground mt-1">
                  Tools
                </span>
                {toolPages.map((p) => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={handleClick}
                    className="rounded-lg px-3 py-3 text-[13px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/30"
                  >
                    {p.label}
                  </Link>
                ))}
              </>
            )}
            <div className="my-2 h-px bg-border/50" />
            <div className="flex items-center justify-between px-3 py-2">
              <LangSwitch lang={lang} setLang={setLang} />
            </div>
            <Link
              to="/portal"
              onClick={handleClick}
              className="mt-1 rounded-full border border-border px-4 py-3 text-center text-[13px] uppercase tracking-[0.08em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {user ? t.portal : t.login}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
