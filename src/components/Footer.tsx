import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hansvl3" },
  { label: "BeHans.nl", href: "https://www.behans.nl" },
];

const internalLinks = [
  { label: "Amazon NL Case Studies", to: "/work" },
  { label: "Optimization Articles", to: "/writing" },
  { label: "About Hans", to: "/about" },
];

const Footer = () => {
  const { lang } = useLang();
  const t = translations[lang].footer;

  const isNl = lang === "nl";

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Hans van Leeuwen
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            {isNl
              ? "Werkzaam in heel Nederland (Amersfoort, Utrecht, Amsterdam, Rotterdam) en de EU."
              : "Working across the Netherlands (Amersfoort, Utrecht, Amsterdam, Rotterdam) and EU."}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {internalLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="nav-link text-xs uppercase tracking-widest"
            >
              {link.label}
            </Link>
          ))}
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link text-xs uppercase tracking-widest"
            >
              {s.label}
            </a>
          ))}
          <Link
            to="/privacy"
            className="nav-link text-xs uppercase tracking-widest"
          >
            {t.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
