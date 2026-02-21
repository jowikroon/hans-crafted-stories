import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Hans van Leeuwen
      </p>
      <div className="flex gap-6">
        {["LinkedIn", "Dribbble", "Twitter"].map((s) => (
          <a key={s} href="#" className="nav-link text-xs uppercase tracking-widest">
            {s}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
