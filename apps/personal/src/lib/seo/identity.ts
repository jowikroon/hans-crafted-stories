/**
 * Publieke identiteit voor structured data (Person/Organization), één bron voor index.html-template
 * (via prerender), prerender-entities, sharedEntities (client) en About. Consistent met de zichtbare
 * copy: marketplace manager, Amazon en bol primair, eBay aanvullend en recent (geen ervaringsduur),
 * e-commerce als breder vakgebied. Geen certificeringen, reviews of resultaten.
 */
export const IDENTITY = {
  jobTitle: { en: "Freelance and interim marketplace manager", nl: "Freelance en interim marketplace manager" },
  occupation: { en: "Marketplace manager", nl: "Marketplace manager" },
  organizationName: "Hans van Leeuwen, marketplace management",
  personDescription: {
    en: "Hans van Leeuwen is a freelance and interim marketplace manager for Amazon and bol, based in Amersfoort, the Netherlands. He works on marketplace strategy and day-to-day operations: product content, advertising, assortment and operational coordination. More recently he has also worked with eBay. 10+ years in e-commerce across in-house, interim and freelance roles.",
    nl: "Hans van Leeuwen is freelance en interim marketplace manager voor Amazon en bol, gevestigd in Amersfoort. Hij werkt aan marketplace-strategie en dagelijkse uitvoering: productcontent, advertenties, assortiment en operationele afstemming. Recent werkt hij ook met eBay. 10+ jaar ervaring in e-commerce, in loondienst, interim en freelance.",
  },
  organizationDescription: {
    en: "Freelance and interim marketplace management for Amazon and bol: strategy, product content, advertising, assortment and day-to-day operations, for brands and retailers in the Netherlands and the EU.",
    nl: "Freelance en interim marketplace management voor Amazon en bol: strategie, productcontent, advertenties, assortiment en dagelijkse uitvoering, voor merken en retailers in Nederland en de EU.",
  },
  knowsAbout: [
    "Marketplace management",
    "Amazon",
    "Amazon Seller Central and Vendor Central",
    "Amazon Ads",
    "bol",
    "Advertising on bol",
    "eBay",
    "Product content and A+ content",
    "Product data and feed management (Channable)",
    "Assortment and catalogue management",
    "Demand forecasting",
    "E-commerce",
    "Marketplace automation (n8n)",
  ],
} as const;

export type IdentityLang = "en" | "nl";
