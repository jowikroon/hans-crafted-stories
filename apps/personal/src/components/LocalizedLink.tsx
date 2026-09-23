import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { localizePath, type Lang } from "@/lib/i18n/routes";

/**
 * Lokaliseert een intern pad maar behoudt `?query` en `#hash`. localizePath()
 * zelf strip die (bedoeld voor canonicals); zonder dit werd elke
 * `to="/about#contact"` stilletjes `/about` en landde de bezoeker bovenaan.
 */
export const localizeHref = (to: string, lang: Lang): string => {
  const [, pathPart, suffix] = to.match(/^([^?#]*)(.*)$/) ?? [to, to, ""];
  return `${localizePath(pathPart || "/", lang)}${suffix}`;
};

/**
 * Drop-in vervanger voor react-router's <Link> die interne links in de
 * actieve taal houdt: op /nl/* wordt `to="/about"` automatisch `/nl/about`.
 * Niet-gelokaliseerde routes en externe/absolute URL's blijven ongemoeid.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function LocalizedLink({ to, ...rest }, ref) {
  const { lang } = useLang();
  const resolved = typeof to === "string" && to.startsWith("/") && !to.startsWith("//")
    ? localizeHref(to, lang)
    : to;
  return <RouterLink ref={ref} to={resolved} {...rest} />;
});

export default Link;
