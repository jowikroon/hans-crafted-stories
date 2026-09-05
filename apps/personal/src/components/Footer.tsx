import { Link } from "@/components/LocalizedLink";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hansvl3" },
];

const internalLinksByLang = {
  en: [
    { label: "Interim e-commerce manager", to: "/interim-ecommerce-manager" },
    { label: "Amazon NL specialist", to: "/amazon-nl-specialist" },
    { label: "Bol.com consultant", to: "/bol-com-consultant" },
    { label: "Case studies", to: "/work" },
    { label: "Articles", to: "/writing" },
    { label: "About Hans", to: "/about" },
  ],
  nl: [
    { label: "Interim e-commerce manager inhuren", to: "/interim-ecommerce-manager" },
    { label: "Amazon NL specialist inhuren", to: "/amazon-nl-specialist" },
    { label: "Bol.com consultant inhuren", to: "/bol-com-consultant" },
    { label: "Case studies", to: "/work" },
    { label: "Artikelen", to: "/writing" },
    { label: "Over Hans", to: "/about" },
  ],
} as const;

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
          <p className="mt-1 text-xs text-muted-foreground">
            {isNl
              ? "Werkzaam in heel Nederland (Amersfoort, Utrecht, Amsterdam, Rotterdam) en de EU."
              : "Working across the Netherlands (Amersfoort, Utrecht, Amsterdam, Rotterdam) and EU."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            KvK 85382590 &middot; BTW NL004089286B45
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
          {internalLinksByLang[lang].map((link) => (
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
