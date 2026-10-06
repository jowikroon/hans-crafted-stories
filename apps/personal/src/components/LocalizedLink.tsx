import { forwardRef } from "react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { localizeHref } from "@/lib/i18n/routes";

/**
 * Drop-in vervanger voor react-router's <Link> die interne links in de
 * actieve taal houdt: op /en/* wordt `to="/about"` automatisch `/en/about`.
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
