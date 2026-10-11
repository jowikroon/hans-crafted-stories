/**
 * Zakelijke marketplace-cases: één bron voor de casepagina, /work (client én
 * prerender) en de prerender-head. Geanonimiseerd (2026-09-23): geen klant- of
 * merknaam, geen volumes, budgetten of prestatiecijfers. Een redirect van de
 * oude slug wist historische koppelingen niet; daarom staan ook hier geen
 * unieke cijfers.
 */
import type { Lang } from "@/lib/i18n/routes";

export interface MarketplaceCaseCopy {
  breadcrumb: string;
  label: string;
  title: string;
  /** Meta description én ondertitel. */
  description: string;
  /** Korte tekst voor de kaart op /work. */
  cardSummary: string;
  body: [string, string, string];
  tilesHeading: string;
  tiles: [string, string, string, string];
  responsibilitiesHeading: string;
  responsibilities: string[];
  disclaimer: string;
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  links: { href: string; label: string }[];
}

export interface MarketplaceCase {
  slug: string;
  path: string;
  /** Oude paden die met een 308 naar `path` gaan (vercel.json). */
  legacyPaths: string[];
  period: string;
  dateModified: string;
  copy: Record<Lang, MarketplaceCaseCopy>;
}

export const MARKETPLACE_PRODUCT_DATA_CASE: MarketplaceCase = {
  slug: "marketplace-product-data-automation",
  path: "/work/marketplace-product-data-automation",
  legacyPaths: ["/work/connect-car-parts", "/cases/connect-car-parts"],
  period: "2025–2026",
  dateModified: "2026-09-23",
  copy: {
    en: {
      breadcrumb: "Marketplace product data",
      label: "Marketplace case · 2025–2026",
      title: "Marketplace product data and automation for an automotive-parts retailer",
      description:
        "How I connected product data, marketplace feeds, content validation and order monitoring for an automotive-parts retailer.",
      cardSummary:
        "Product data, feeds, channel-specific validation and human approval before publication, for an automotive-parts retailer.",
      body: [
        "An automotive-parts retailer needed consistent product information across its webshop and marketplaces. Buyers needed to understand whether a part fitted their vehicle, while the team had to meet different content requirements per channel.",
        "As e-commerce manager, I connected product-data preparation, feed management and listing content. The workflow combined structured source data, channel-specific validation and human review before publication. Order monitoring and recurring feed checks supported the operational handover.",
        "The work delivered a repeatable content process, clearer publication checks and a shared basis for marketplace reporting.",
      ],
      tilesHeading: "How the workflow is built",
      tiles: ["Structured product data", "Channel-specific validation", "Human approval", "Operational monitoring"],
      responsibilitiesHeading: "My responsibilities",
      responsibilities: [
        "Product-data preparation with vehicle-fitment information",
        "Feed management and channel-specific content rules",
        "AI-assisted listing drafts with source labels and human review",
        "Validation against marketplace rules before publication",
        "Order monitoring and recurring feed checks",
        "Implemented a VIN-based parts lookup and connected product data, marketplace feeds and operational reporting",
      ],
      disclaimer:
        "The case illustrates the approach and my responsibilities; client-specific volumes, budgets and performance figures are not published.",
      ctaTitle: "Similar product-data work for your catalogue?",
      ctaText: "This approach suits catalogues with technical product data and several sales channels.",
      ctaButton: "Discuss your marketplace challenge",
      links: [
        { href: "/ai-ecommerce-automation", label: "AI e-commerce automation" },
        { href: "/amazon-nl-specialist", label: "Amazon services" },
        { href: "/writing/ai-agent-verzint-succes", label: "Article: my AI agent invented success (Dutch)" },
      ],
    },
    nl: {
      breadcrumb: "Marketplace-productdata",
      label: "Marketplace-case · 2025–2026",
      title: "Marketplace-productdata en automatisering voor een automotive-parts retailer",
      description:
        "Hoe ik productdata, marketplace-feeds, contentvalidatie en orderbewaking met elkaar verbond voor een automotive-parts retailer.",
      cardSummary:
        "Productdata, feeds, validatie per kanaal en menselijke goedkeuring vóór publicatie, voor een automotive-parts retailer.",
      body: [
        "Een automotive-parts retailer had consistente productinformatie nodig voor de webshop en marketplaces. Kopers moesten kunnen beoordelen of een onderdeel bij hun voertuig paste, terwijl het team per kanaal aan andere contenteisen moest voldoen.",
        "Als e-commerce-manager verbond ik de voorbereiding van productdata, feedmanagement en listingcontent. De workflow combineerde gestructureerde brondata, validatie per kanaal en menselijke controle vóór publicatie. Orderbewaking en terugkerende feedcontroles ondersteunden de operationele overdracht.",
        "Het werk leverde een herhaalbaar contentproces, duidelijkere publicatiecontroles en een gezamenlijke basis voor marketplace-rapportage op.",
      ],
      tilesHeading: "Hoe de workflow is opgebouwd",
      tiles: ["Gestructureerde productdata", "Validatie per kanaal", "Menselijke goedkeuring", "Operationele bewaking"],
      responsibilitiesHeading: "Mijn verantwoordelijkheden",
      responsibilities: [
        "Voorbereiding van productdata met voertuig-fitmentinformatie",
        "Feedmanagement en contentregels per kanaal",
        "AI-ondersteunde listingconcepten met bronlabel en menselijke review",
        "Validatie tegen marketplace-regels vóór publicatie",
        "Orderbewaking en terugkerende feedcontroles",
        "Implementeerde een VIN-gebaseerde onderdelenzoekfunctie en verbond productdata, marketplace-feeds en operationele rapportage",
      ],
      disclaimer:
        "Deze case beschrijft de aanpak en mijn verantwoordelijkheid; klantspecifieke volumes, budgetten en prestatiecijfers worden niet gepubliceerd.",
      ctaTitle: "Vergelijkbaar productdatawerk voor jouw catalogus?",
      ctaText: "Deze aanpak past bij catalogi met technische productdata en meerdere verkoopkanalen.",
      ctaButton: "Bespreek je marketplace-vraag",
      links: [
        { href: "/ai-ecommerce-automation", label: "AI e-commerce automatisering" },
        { href: "/amazon-nl-specialist", label: "Amazon-diensten" },
        { href: "/writing/ai-agent-verzint-succes", label: "Artikel: AI-agent verzint succes" },
      ],
    },
  },
};

/** Alle gepubliceerde zakelijke cases, in weergavevolgorde. */
export const MARKETPLACE_CASES: MarketplaceCase[] = [MARKETPLACE_PRODUCT_DATA_CASE];
