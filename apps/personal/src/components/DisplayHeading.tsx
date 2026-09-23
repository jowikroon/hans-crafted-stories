import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Gedeelde display-kop voor publieke pagina's (home, cases-overzicht, case-detail, dienst- en
 * over-pagina's). Visuele bron: de standaard Editorial-kop van /writing (Switzer 700,
 * clamp(40px, 6vw, 72px), line-height 1.02, letter-spacing -0.035em). Kaarttitels gebruiken
 * dezelfde familie en hetzelfde gewicht op een kleinere schaal. Tokens: index.css (--display-*).
 *
 * `as` bepaalt alleen de semantiek (h1/h2/h3/p); de grootte staat los daarvan zodat de
 * headingstructuur (één H1 per pagina) niet door vormgeving wordt bepaald.
 */
type Props = {
  as?: "h1" | "h2" | "h3" | "p";
  size?: "page" | "card";
  className?: string;
  children: ReactNode;
  id?: string;
};

export const DisplayHeading = ({ as: Tag = "h1", size = "page", className, children, id }: Props) => (
  <Tag id={id} className={cn(size === "page" ? "type-page-title" : "type-card-title", "text-foreground", className)}>
    {children}
  </Tag>
);

export default DisplayHeading;
