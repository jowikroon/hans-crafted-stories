import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hansvl3" },
  { label: "BeHans.nl", href: "https://www.behans.nl" },
];

const Footer = () => {
  const { lang } = useLang();
  const t = translations[lang].footer;

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Hans van Leeuwen
        </p>
        <div className="flex items-center gap-6">
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
