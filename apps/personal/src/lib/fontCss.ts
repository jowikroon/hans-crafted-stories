/**
 * fontCss.ts — idempotent runtime font-stylesheet loader (2026-07-23).
 *
 * WHY: route-scoped CSS files carried `@import url(fontshare/googleapis)` at
 * the top. Vite bundles statically-imported route CSS into the global
 * stylesheet, so EVERY page shipped the font CSS of EVERY route (103 font
 * faces registered on the homepage; General Sans / Cabinet Grotesk / Fraunces
 * leaked site-wide). Rule going forward: route CSS never `@import`s fonts —
 * the route component calls ensureFontCss() on mount instead, so font CSS
 * only loads when its route actually renders.
 */
export function ensureFontCss(id: string, href: string): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export const FONT_CSS = {
  writing: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=general-sans@400,500,600,700&f[]=jetbrains-mono@400,500&display=swap",
  musicV2: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=general-sans@400,500,600,700&f[]=cabinet-grotesk@500,700,800&f[]=jetbrains-mono@400,500&display=swap",
  articleV2: "https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=jetbrains-mono@400,500&display=swap",
  writeCms: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&display=swap",
  newsreader: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap",
} as const;
