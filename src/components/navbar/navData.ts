import { translations } from "@/data/translations";
import type { Lang } from "@/hooks/useLang";

export const THEME_KEY = "site_theme";

export const getLinks = (lang: Lang) => {
  const t = translations[lang].nav;
  return [
    { to: "/", label: t.home },
    { to: "/work", label: t.work },
    { to: "/writing", label: t.writing },
    { to: "/about", label: lang === "nl" ? "Over Hans" : "About" },
  ];
};

export const servicePages = [
  { to: "/amazon-nl-specialist", label: "Amazon NL Specialist" },
  { to: "/bol-com-consultant", label: "Bol.com Consultant" },
  { to: "/interim-ecommerce-manager", label: "Interim E-commerce Manager" },
];

export const toolPages = [
  { to: "/dashboard", label: "Master Catalogus" },
  { to: "/portal", label: "Portal" },
  { to: "/empire", label: "Empire" },
  { to: "/hansai", label: "Hans AI" },
  { to: "/wiki", label: "Wiki" },
];

export const searchablePages = [
  { to: "/", label: "Home", keywords: ["home", "start", "landing"] },
  { to: "/dashboard", label: "Master Catalog Dashboard", keywords: ["dashboard", "master", "catalogus", "producten", "bandel", "ebay", "scraper", "database"] },
  { to: "/work", label: "Work", keywords: ["work", "cases", "projects", "portfolio"] },
  { to: "/writing", label: "Writing", keywords: ["blog", "writing", "articles", "posts"] },
  { to: "/about", label: "About", keywords: ["about", "contact", "info", "cv"] },
  { to: "/amazon-nl-specialist", label: "Amazon NL Specialist", keywords: ["amazon", "nl", "specialist", "ads", "listing"] },
  { to: "/bol-com-consultant", label: "Bol.com Consultant", keywords: ["bol", "bol.com", "consultant", "ads", "marketplace"] },
  { to: "/interim-ecommerce-manager", label: "Interim E-commerce Manager", keywords: ["interim", "manager", "freelance", "ecommerce", "lead"] },
  { to: "/portal", label: "Portal", keywords: ["portal", "dashboard", "login", "tools"] },
  { to: "/empire", label: "Empire", keywords: ["empire", "admin", "terminal", "system"] },
  { to: "/hansai", label: "Hans AI", keywords: ["ai", "chat", "llm", "claude", "gemini", "gpt"] },
];

export const scrollToTop = () => {
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
};
