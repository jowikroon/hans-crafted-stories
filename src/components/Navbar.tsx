import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, PenLine, Newspaper, Bot, ChevronDown, User, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/writing", label: "Writing" },
  { to: "/about", label: "About" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setProfileOpen(false); setMobileOpen(false); }, [location.pathname]);

  return (
    <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-foreground">
          Hans van Leeuwen
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            /* Profile dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="inline-flex items-center gap-1.5 nav-link"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-6 w-6 rounded-full"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <User size={16} />
                )}
                <ChevronDown size={12} className={`transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg overflow-hidden"
                  >
                    <Link
                      to="/portal/blog"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <PenLine size={14} />
                      Blogs
                    </Link>
                    <Link
                      to="/seo-cms"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-teal-400/80 hover:text-teal-300 hover:bg-muted/50 transition-colors"
                    >
                      <Search size={14} />
                      SEO Audit
                    </Link>
                    <Link
                      to="/writing"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Newspaper size={14} />
                      News
                    </Link>
                    <div className="border-t border-border" />
                    <a
                      href="https://t.me/Samanthahansbot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Bot size={14} />
                      Samantha AI
                    </a>
                    <div className="border-t border-border" />
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/portal"
              className={`inline-flex items-center gap-1.5 nav-link ${location.pathname === "/portal" ? "active" : ""}`}
            >
              <LogIn size={14} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`nav-link text-base ${location.pathname === link.to ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <div className="border-t border-border pt-2" />
                  <Link to="/portal/blog" onClick={() => setMobileOpen(false)} className="nav-link text-base inline-flex items-center gap-2">
                    <PenLine size={14} /> Blogs
                  </Link>
                  <Link to="/seo-cms" onClick={() => setMobileOpen(false)} className="nav-link text-base inline-flex items-center gap-2 text-teal-400/80">
                    <Search size={14} /> SEO Audit
                  </Link>
                  <Link to="/writing" onClick={() => setMobileOpen(false)} className="nav-link text-base inline-flex items-center gap-2">
                    <Newspaper size={14} /> News
                  </Link>
                  <a href="https://t.me/Samanthahansbot" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="nav-link text-base inline-flex items-center gap-2">
                    <Bot size={14} /> Samantha AI
                  </a>
                  <button onClick={signOut} className="nav-link text-base inline-flex items-center gap-2 text-left">
                    <LogOut size={14} /> Sign out
                  </button>
                </>
              ) : (
                <Link to="/portal" onClick={() => setMobileOpen(false)} className="nav-link text-base inline-flex items-center gap-2">
                  <LogIn size={14} /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
