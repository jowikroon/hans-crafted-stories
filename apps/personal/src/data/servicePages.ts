/**
 * Eén bron van waarheid voor de vier dienstenpagina's, in beide talen.
 * Gebruikt door de React-pagina's (components/ServicePage.tsx) én door
 * scripts/prerender.mjs (via entry-server), zodat title, meta, FAQ en
 * bewijscijfers nooit meer uit elkaar lopen tussen head en body.
 *
 * Bewijsregels (2026-09-05):
 *  - Elk cijfer heeft een bron: cv (Cv_HvL_-_Ecommerce.pdf), of een artikel op
 *    /writing waarin Hans de casus zelf beschrijft. Geen cijfer zonder bron.
 *  - 20% wekelijkse verkoopgroei komt uit een social-ad-campagne (Back to
 *    School, Alpine) — niet uit Bol Ads. Eerdere teksten schreven dat verkeerd toe.
 *  - 70% marktaandeel: oordoppencategorie Amazon NL, Nielsen 2023, Alpine.
 */
import type { Lang } from "@/lib/i18n/routes";

export interface ProofStat {
  stat: string;
  desc: string;
  /** Zichtbare bronvermelding, bv. "Alpine Hearing Protection · Nielsen 2023". */
  source: string;
}

export interface PracticeCase {
  title: string;
  summary: string;
  /** Pad naar het artikel waarin de casus staat. */
  href: string;
  linkLabel: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PricingModel {
  name: string;
  fit: string;
}

export interface ServicePageCopy {
  title: string;
  metaDesc: string;
  breadcrumb: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  /** Answer-first: wie, wat, voor wie, resultaat — inclusief bronnen. */
  intro: string;
  whenHeading: string;
  when: string[];
  servicesHeading: string;
  services: string[];
  resultsHeading: string;
  results: ProofStat[];
  practiceHeading: string;
  practiceIntro: string;
  practice: PracticeCase[];
  approachHeading: string;
  approach: string[];
  pricingHeading: string;
  pricingIntro: string;
  pricing: PricingModel[];
  pricingNote: string;
  faqHeading: string;
  faq: FaqItem[];
  ctaHeading: string;
  ctaText: string;
  ctaButton: string;
  related: { href: string; label: string }[];
}

export interface ServicePageDef {
  /** EN-basispad, bv. "/interim-ecommerce-manager". */
  path: string;
  serviceName: string;
  icon: "briefcase" | "cart" | "store" | "bot";
  copy: Record<Lang, ServicePageCopy>;
}

/** Datum van de laatste inhoudelijke revisie; zichtbaar op elke dienstenpagina. */
export const SERVICE_PAGES_UPDATED = "2026-09-05";

const BYLINE = {
  nl: {
    name: "Hans van Leeuwen",
    role: "Freelance e-commerce & marketplace manager, Amersfoort",
    updated: "Laatst bijgewerkt",
    about: "Over Hans en zijn loopbaan",
    linkedin: "LinkedIn-profiel",
  },
  en: {
    name: "Hans van Leeuwen",
    role: "Freelance e-commerce & marketplace manager, Amersfoort (NL)",
    updated: "Last updated",
    about: "About Hans and his track record",
    linkedin: "LinkedIn profile",
  },
} as const;

export const SERVICE_BYLINE = BYLINE;

/**
 * Authentiek sociaal bewijs zonder verzonnen testimonials: de werkgevers en
 * opdrachtgevers uit het cv, met rol en periode. Referenties op aanvraag.
 */
export const EXPERIENCE_STRIP = {
  nl: {
    heading: "Ervaring bij",
    note: "Referenties van opdrachtgevers en leidinggevenden op aanvraag beschikbaar.",
    linkedin: "Aanbevelingen op LinkedIn",
    items: [
      { name: "ABS All Brake Systems", role: "E-commerce manager", period: "2025–heden" },
      { name: "Alpine Hearing Protection", role: "Marketplace manager", period: "2021–2025" },
      { name: "Intergamma (Karwei & Gamma)", role: "E-commerce manager", period: "2017–2020" },
      { name: "IGM Badkamerwinkel", role: "E-commerce manager", period: "2019–2020" },
      { name: "Webhelp (GGD GHOR)", role: "Team coach", period: "2020–2022" },
      { name: "Talpa · Edelman", role: "Online marketing · UX design", period: "2013–2015" },
    ],
  },
  en: {
    heading: "Experience at",
    note: "References from clients and managers available on request.",
    linkedin: "Recommendations on LinkedIn",
    items: [
      { name: "ABS All Brake Systems", role: "E-commerce manager", period: "2025–present" },
      { name: "Alpine Hearing Protection", role: "Marketplace manager", period: "2021–2025" },
      { name: "Intergamma (Karwei & Gamma)", role: "E-commerce manager", period: "2017–2020" },
      { name: "IGM Badkamerwinkel", role: "E-commerce manager", period: "2019–2020" },
      { name: "Webhelp (GGD GHOR)", role: "Team coach", period: "2020–2022" },
      { name: "Talpa · Edelman", role: "Online marketing · UX design", period: "2013–2015" },
    ],
  },
} as const;

const RELATED = {
  nl: {
    interim: { href: "/interim-ecommerce-manager", label: "Interim e-commerce manager" },
    amazon: { href: "/amazon-nl-specialist", label: "Amazon NL specialist" },
    bol: { href: "/bol-com-consultant", label: "Bol.com consultant" },
    ai: { href: "/ai-ecommerce-automation", label: "AI e-commerce automatisering" },
    work: { href: "/work", label: "Case studies" },
    about: { href: "/about", label: "Over Hans" },
  },
  en: {
    interim: { href: "/interim-ecommerce-manager", label: "Interim e-commerce manager" },
    amazon: { href: "/amazon-nl-specialist", label: "Amazon NL specialist" },
    bol: { href: "/bol-com-consultant", label: "Bol.com consultant" },
    ai: { href: "/ai-ecommerce-automation", label: "AI e-commerce automation" },
    work: { href: "/work", label: "Case studies" },
    about: { href: "/about", label: "About Hans" },
  },
} as const;

const PRICING_NL: { heading: string; intro: string; models: PricingModel[]; note: string } = {
  heading: "Tarief en samenwerkingsvormen",
  intro:
    "Geen bureaumarge, geen minimumcontract van een halfjaar, per maand opzegbaar. Drie vormen, met indicatieve tarieven (excl. btw):",
  models: [
    { name: "Dagtarief (interim) · €760 per dag", fit: "Circa €95 per uur. Voor tijdelijke leiding, 2 tot 5 dagen per week, op locatie in de regio Utrecht of remote in NL/EU." },
    { name: "Projectprijs · vanaf €2.500", fit: "Voor een afgebakende opdracht met een vast resultaat: een audit met plan, een Bol.com-launch, een Amazon DE-uitrol of een feed-automatisering." },
    { name: "Retainer · vanaf €1.750 per maand", fit: "Doorlopend accountmanagement van Amazon en Bol.com: twee vaste dagen per maand, wekelijkse trading review en maandrapportage." },
  ],
  note:
    "Na een kennismaking van 30 minuten ontvang je binnen één werkdag een schriftelijke offerte met scope, cadans en definitief tarief. Ter vergelijking: een vaste e-commerce manager kost inclusief werkgeverslasten al snel €6.000 of meer per maand, zonder de flexibiliteit om per maand te stoppen. Een interim-inzet van drie dagen per week blijft daar doorgaans onder.",
};

const PRICING_EN: { heading: string; intro: string; models: PricingModel[]; note: string } = {
  heading: "Rates and ways of working",
  intro:
    "No agency margin, no six-month minimum, cancellable monthly. Three models, with indicative rates (excl. VAT):",
  models: [
    { name: "Day rate (interim) · €760 per day", fit: "About €95 per hour. For temporary leadership, 2 to 5 days a week, on-site in the Utrecht region or remote across NL/EU." },
    { name: "Project fee · from €2,500", fit: "For a scoped engagement with a fixed outcome: an audit with plan, a Bol.com launch, an Amazon DE roll-out or a feed automation." },
    { name: "Retainer · from €1,750 per month", fit: "Ongoing Amazon and Bol.com account management: two fixed days a month, weekly trading review and monthly reporting." },
  ],
  note:
    "After a 30-minute intro call you receive a written quote within one working day: scope, cadence and final rate. For context: a permanent e-commerce manager, including employer costs, quickly runs to €6,000 or more per month, without the option to stop monthly. An interim engagement of three days a week usually stays below that.",
};

export const SERVICE_PAGES: ServicePageDef[] = [
  /* ───────────────────────────── Interim ───────────────────────────── */
  {
    path: "/interim-ecommerce-manager",
    serviceName: "Interim E-commerce Management",
    icon: "briefcase",
    copy: {
      nl: {
        title: "Interim E-commerce Manager inhuren (Amazon & Bol.com) | Hans van Leeuwen",
        metaDesc:
          "Interim e-commerce manager inhuren voor Amazon NL/DE en Bol.com. 10+ jaar, 70% marktaandeel (Nielsen), €2M+ marketplace-omzet, out-of-stock onder 2%. Amersfoort, NL/EU.",
        breadcrumb: "Interim E-commerce Manager",
        eyebrow: "Interim & freelance",
        h1: "Interim e-commerce manager inhuren",
        subtitle: "Tijdelijke leiding over je marketplace-operatie: strategie, uitvoering en overdracht",
        intro:
          "Ik ben Hans van Leeuwen, interim e-commerce manager uit Amersfoort. Ik neem tijdelijk de leiding over je Amazon- en Bol.com-operatie wanneer je manager vertrekt, je groei sneller gaat dan je team, of je een nieuw kanaal opent. Bij Alpine Hearing Protection bouwde ik als marketplace manager de oordoppencategorie op Amazon NL uit tot 70% marktaandeel (Nielsen, 2023) en bracht ik het out-of-stockpercentage onder de 2%; bij ABS All Brake Systems koppelde ik eBay, Amazon en Bol.com tot één operatie. In totaal stuurde ik meer dan €2 miljoen marketplace-omzet en teams van 6+ FTE aan.",
        whenHeading: "Wanneer je een interim e-commerce manager inschakelt",
        when: [
          "Je e-commerce manager is vertrokken en de marketplace-operatie mag niet stilvallen tijdens de werving",
          "Je ACOS loopt op en de advertentiestructuur moet snel opnieuw worden opgezet",
          "Je lanceert op Amazon DE of Bol.com en hebt iemand nodig die het al eerder deed",
          "Je wilt van vendor naar seller op Bol.com zonder je performancescore te verliezen",
          "Je hebt stockouts, Buy Box-verlies en geen forecast die het voorkomt",
          "Je team heeft de handen vol en de rapportage naar directie blijft achter",
        ],
        servicesHeading: "Wat ik als interim lead oppak",
        services: [
          "Volledig P&L-eigenaarschap van de marketplace-kanalen, met weekrapportage naar directie",
          "Amazon (NL/DE) en Bol.com: listings, advertising, prijs, Buy Box en catalogus",
          "Demand forecasting en voorraadsturing samen met inkoop en logistiek",
          "Productdata en feeds (Channable, PIM/ERP-koppelingen) op orde brengen",
          "Aansturing van bureaus, freelancers en interne specialisten",
          "KPI-dashboard (GA4, Power BI, platformdata) en een vast weekly-trading-ritme",
          "Automatisering van terugkerend werk met n8n en AI, met de mens op de gevoelige knoppen",
          "Documentatie en overdracht aan de vaste opvolger",
        ],
        resultsHeading: "Resultaten uit eerdere rollen",
        results: [
          { stat: "70%", desc: "marktaandeel in de oordoppencategorie op Amazon NL", source: "Alpine Hearing Protection · Nielsen 2023" },
          { stat: "<2%", desc: "out-of-stock na invoering van demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
          { stat: "€2M+", desc: "marketplace-omzet aangestuurd, budgetverantwoordelijkheid €500K+", source: "cv, rollen 2017–2026" },
          { stat: "+40%", desc: "organisch verkeer via SEO-optimalisatie van de catalogus", source: "Intergamma (Karwei/Gamma) · 2017–2019" },
        ],
        practiceHeading: "Uit de praktijk",
        practiceIntro: "Wat ik onderweg tegenkwam, met cijfers, beschreef ik in mijn artikelen:",
        practice: [
          {
            title: "Listings die niet converteren",
            summary: "Bij een outdoormerk met ~120 SKU's op Amazon DE en Bol.com ging €14.000 per maand naar Sponsored Products bij 23% retouren. Maatvoering in de galerij, een vergelijkingstabel en een scanbare titel brachten de conversie van 8,1% naar 12,7% en de retouren naar 14%, waarna de ad spend met €3.000 per maand omlaag kon.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Lees de casus",
          },
          {
            title: "Een dashboard dat nooit slecht nieuws bracht",
            summary: "In mijn eigen automatiseringsstack bleek ongeveer de helft van de succesmeldingen niet herleidbaar tot een echte actie. Sindsdien geldt in elke operatie die ik leid: geen groen lampje zonder bewijs.",
            href: "/writing/ai-agent-verzint-succes",
            linkLabel: "Lees waarom rapportage bewijs nodig heeft",
          },
        ],
        approachHeading: "De eerste 30 dagen",
        approach: [
          "Week 1 is een operationele nulmeting: kanaalrendement per marketplace, advertentie-efficiëntie, listingkwaliteit, voorraadrisico, productdata, wie waarvoor verantwoordelijk is en hoe er wordt gerapporteerd. Acute omzet- en beschikbaarheidsrisico's scheid ik van structurele verbeteringen en vertaal ik naar een backlog met per actie een eigenaar en een meetbaar resultaat.",
          "In week 2 en 3 werk ik in het bestaande team en de bestaande tools. Dat is meestal: Amazon Ads of Bol Ads herstructureren, catalogus- en feedproblemen oplossen, een weekly-trading-ritme invoeren, P&L-eigenaarschap verduidelijken en bureaus, logistiek, finance en content op één lijn brengen. Besluiten zijn zichtbaar in een compact KPI-dashboard en een schriftelijke weekupdate.",
          "Week 4 draait om overdracht, niet om afhankelijkheid. Processen, toegang, besluiten en terugkerende controles leg ik vast voor de vaste eigenaar, met een 90-dagenroadmap en een eerlijk advies over teamcapaciteit. Zo werkt de inzet zowel als tijdelijke leiding als als voorbereiding op een vaste hire.",
        ],
        pricingHeading: PRICING_NL.heading,
        pricingIntro: PRICING_NL.intro,
        pricing: PRICING_NL.models,
        pricingNote: PRICING_NL.note,
        faqHeading: "Veelgestelde vragen over interim e-commerce management",
        faq: [
          { q: "Wat doet een interim e-commerce manager?", a: "Hij of zij leidt tijdelijk de e-commerce- of marketplace-operatie: strategie, dagelijkse uitvoering op Amazon en Bol.com, advertising, productdata, voorraad en rapportage. Het verschil met een consultant is dat een interim manager eigenaar is van het resultaat en in het team werkt, niet ernaast." },
          { q: "Wanneer huur je een interim e-commerce manager in?", a: "Bij het vertrek van je e-commerce lead, een groeifase die het team overvraagt, een marketplace-uitbreiding zoals Amazon DE, een vendor-naar-seller-transitie op Bol.com, of als overbrugging tijdens de werving van een vaste kracht." },
          { q: "Wat kost een interim e-commerce manager?", a: "Ik werk op dagtarief, projectprijs of retainer. Na een kennismaking van 30 minuten ontvang je binnen één werkdag een schriftelijke offerte. Een interim-inzet van drie dagen per week is doorgaans goedkoper dan een vaste manager inclusief werkgeverslasten, en per maand opzegbaar." },
          { q: "Werk je op locatie of remote?", a: "Beide. Ik ben gevestigd in Amersfoort en werk op locatie in de regio Utrecht en remote voor opdrachtgevers in heel Nederland en de EU, van twee dagen per week tot volledige dekking." },
          { q: "Hoe snel kun je starten?", a: "Meestal binnen enkele weken, afhankelijk van lopende opdrachten. De eerste week staat altijd in het teken van een nulmeting, zodat de prioriteiten in week twee vaststaan." },
          { q: "Welke platforms en tools beheers je?", a: "Amazon Seller en Vendor Central (NL, DE en andere EU-marktplaatsen), Bol.com, eBay, Magento en WooCommerce, plus de laag eronder: Channable voor feeds, n8n voor automatisering, Helium10 en Nielsen voor marktdata, GA4 en Power BI voor rapportage." },
        ],
        ctaHeading: "Tijdelijk een e-commerce lead nodig?",
        ctaText: "Plan een kennismaking van 30 minuten. Je krijgt binnen één werkdag een schriftelijke offerte. Vrijblijvend.",
        ctaButton: "Plan een kennismaking",
        related: [RELATED.nl.amazon, RELATED.nl.bol, RELATED.nl.ai, RELATED.nl.work],
      },
      en: {
        title: "Interim E-commerce Manager for Amazon & Bol.com (NL/EU) | Hans van Leeuwen",
        metaDesc:
          "Hire an interim e-commerce manager for Amazon NL/DE and Bol.com. 10+ years, 70% category share (Nielsen), €2M+ marketplace revenue managed, out-of-stock below 2%. Amersfoort, NL/EU.",
        breadcrumb: "Interim E-commerce Manager",
        eyebrow: "Interim & freelance",
        h1: "Interim e-commerce manager",
        subtitle: "Temporary leadership of your marketplace operation: strategy, execution and handover",
        intro:
          "I'm Hans van Leeuwen, an interim e-commerce manager based in Amersfoort, the Netherlands. I take temporary charge of your Amazon and Bol.com operation when your manager leaves, growth outpaces the team, or you open a new channel. At Alpine Hearing Protection I grew the earplug category on Amazon NL to a 70% market share (Nielsen, 2023) and brought out-of-stock below 2%; at ABS All Brake Systems I connected eBay, Amazon and Bol.com into a single operation. In total I have managed more than €2 million in marketplace revenue and teams of 6+ FTE.",
        whenHeading: "When to bring in an interim e-commerce manager",
        when: [
          "Your e-commerce manager has left and the marketplace operation cannot stall during recruitment",
          "ACOS is climbing and the advertising structure needs to be rebuilt fast",
          "You are launching on Amazon DE or Bol.com and want someone who has done it before",
          "You want to move from vendor to seller on Bol.com without losing your performance score",
          "Stockouts and Buy Box loss keep happening and no forecast prevents them",
          "The team is at capacity and reporting to leadership keeps slipping",
        ],
        servicesHeading: "What I take on as interim lead",
        services: [
          "Full P&L ownership of the marketplace channels, with weekly reporting to leadership",
          "Amazon (NL/DE) and Bol.com: listings, advertising, pricing, Buy Box and catalogue",
          "Demand forecasting and stock steering together with purchasing and logistics",
          "Product data and feeds (Channable, PIM/ERP integrations) brought up to standard",
          "Managing agencies, freelancers and in-house specialists",
          "KPI dashboard (GA4, Power BI, platform data) and a fixed weekly trading rhythm",
          "Automating recurring work with n8n and AI, with a human on the sensitive decisions",
          "Documentation and handover to the permanent successor",
        ],
        resultsHeading: "Results from previous roles",
        results: [
          { stat: "70%", desc: "market share in the earplug category on Amazon NL", source: "Alpine Hearing Protection · Nielsen 2023" },
          { stat: "<2%", desc: "out-of-stock after introducing demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
          { stat: "€2M+", desc: "marketplace revenue managed, budget responsibility €500K+", source: "CV, roles 2017–2026" },
          { stat: "+40%", desc: "organic traffic through SEO optimisation of the catalogue", source: "Intergamma (Karwei/Gamma) · 2017–2019" },
        ],
        practiceHeading: "From the field",
        practiceIntro: "What I ran into along the way, with numbers, is documented in my articles:",
        practice: [
          {
            title: "Listings that don't convert",
            summary: "An outdoor brand with ~120 SKUs on Amazon DE and Bol.com spent €14,000 a month on Sponsored Products with a 23% return rate. Sizing infographics in the gallery, a comparison table and a scannable title lifted conversion from 8.1% to 12.7% and cut returns to 14%, after which ad spend could drop by €3,000 a month.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Read the case (Dutch)",
          },
          {
            title: "A dashboard that never brought bad news",
            summary: "In my own automation stack roughly half of the success messages could not be traced to a real action. Since then every operation I lead runs on one rule: no green light without evidence.",
            href: "/writing/ai-agent-verzint-succes",
            linkLabel: "Read why reporting needs proof (Dutch)",
          },
        ],
        approachHeading: "The first 30 days",
        approach: [
          "Week 1 is an operational baseline: channel profitability per marketplace, advertising efficiency, listing quality, stock risk, product data, who owns what and how reporting works. Urgent revenue and availability risks are separated from structural improvements and turned into a backlog with an owner and a measurable outcome for every action.",
          "In weeks 2 and 3 I work inside the existing team and tool stack. That usually means restructuring Amazon Ads or Bol Ads, fixing catalogue and feed issues, introducing a weekly trading rhythm, clarifying P&L ownership and aligning agencies, logistics, finance and content. Decisions stay visible in a compact KPI dashboard and a written weekly update.",
          "Week 4 is about handover, not dependency. Processes, access, decisions and recurring checks are documented for the permanent owner, with a 90-day roadmap and an honest recommendation on team capacity. That makes the engagement useful both as temporary leadership and as preparation for a permanent hire.",
        ],
        pricingHeading: PRICING_EN.heading,
        pricingIntro: PRICING_EN.intro,
        pricing: PRICING_EN.models,
        pricingNote: PRICING_EN.note,
        faqHeading: "Frequently asked questions about interim e-commerce management",
        faq: [
          { q: "What does an interim e-commerce manager do?", a: "They temporarily lead the e-commerce or marketplace operation: strategy, daily execution on Amazon and Bol.com, advertising, product data, stock and reporting. Unlike a consultant, an interim manager owns the outcome and works inside the team, not next to it." },
          { q: "When should you hire an interim e-commerce manager?", a: "When your e-commerce lead leaves, when a growth phase outpaces the team, when expanding to a new marketplace such as Amazon DE, during a vendor-to-seller transition on Bol.com, or as cover while recruiting a permanent hire." },
          { q: "What does an interim e-commerce manager cost?", a: "I work on a day rate, project fee or retainer. After a 30-minute intro call you receive a written quote within one working day. An interim engagement of three days a week is usually cheaper than a permanent manager including employer costs, and can be ended monthly." },
          { q: "Do you work on-site or remote?", a: "Both. I'm based in Amersfoort and work on-site in the Utrecht region and remote for clients across the Netherlands and the EU, from two days a week to full coverage." },
          { q: "How fast can you start?", a: "Usually within a few weeks, depending on current commitments. The first week is always a baseline, so priorities are fixed by week two." },
          { q: "Which platforms and tools do you cover?", a: "Amazon Seller and Vendor Central (NL, DE and other EU marketplaces), Bol.com, eBay, Magento and WooCommerce, plus the layer underneath: Channable for feeds, n8n for automation, Helium10 and Nielsen for market data, GA4 and Power BI for reporting." },
        ],
        ctaHeading: "Need a temporary e-commerce lead?",
        ctaText: "Book a 30-minute intro call. You receive a written quote within one working day. No obligation.",
        ctaButton: "Book an intro call",
        related: [RELATED.en.amazon, RELATED.en.bol, RELATED.en.ai, RELATED.en.work],
      },
    },
  },

  /* ───────────────────────────── Amazon NL ───────────────────────────── */
  {
    path: "/amazon-nl-specialist",
    serviceName: "Amazon NL Account Management",
    icon: "cart",
    copy: {
      nl: {
        title: "Amazon NL Specialist inhuren: freelance Amazon accountmanager | Hans van Leeuwen",
        metaDesc:
          "Freelance Amazon NL specialist inhuren. Listings, A+ Content, Amazon Ads en Buy Box voor Amazon.nl en Amazon.de. 70% categoriemarktaandeel (Nielsen 2023). Amersfoort.",
        breadcrumb: "Amazon NL Specialist",
        eyebrow: "Amazon Nederland & Duitsland",
        h1: "Amazon NL specialist inhuren",
        subtitle: "Freelance Amazon-accountmanager voor listings, advertising, Buy Box en voorraad",
        intro:
          "Ik ben Hans van Leeuwen, freelance Amazon-specialist uit Amersfoort. Ik beheer en laat Amazon.nl- en Amazon.de-accounts groeien voor merken die geen fulltime specialist in huis hebben. Bij Alpine Hearing Protection bracht ik de oordoppencategorie op Amazon NL naar 70% marktaandeel (Nielsen, 2023), verlaagde ik prijsvolatiliteit in de Buy Box door B2B-afstemming en verhoogde ik de conversie met A/B-tests op afbeeldingen. Bij ABS All Brake Systems run ik nu een catalogus van A.B.S.-remonderdelen op Amazon DE naast eBay DE en Bol.com.",
        whenHeading: "Voor wie dit werkt",
        when: [
          "Merken die op Amazon.nl staan maar geen zicht hebben op waarom de verkoop stagneert",
          "D2C-merken die Amazon willen toevoegen zonder een fulltime accountmanager aan te nemen",
          "Category leaders die hun aandeel verdedigen tegen private label en Chinese aanbieders",
          "Merken die vanaf Amazon.nl willen doorgroeien naar Amazon.de en de rest van de EU",
          "Teams waarbij ACOS oploopt terwijl de organische ranking niet meegroeit",
          "Distributeurs met grote catalogi (automotive, technische onderdelen) en fitment-data",
        ],
        servicesHeading: "Amazon-diensten",
        services: [
          "Listingoptimalisatie: titels, bullets, backend keywords en afbeeldingen op basis van zoekdata",
          "A+ Content en Brand Store die het verschil tussen varianten uitleggen",
          "Amazon Ads: Sponsored Products, Sponsored Brands en Sponsored Display, gestuurd op ACOS en TACOS",
          "Buy Box- en prijsstrategie, inclusief afstemming met B2B- en retailkanalen",
          "Catalogusbeheer, variaties, suppressies en compliance (GPSR, merkregistratie)",
          "Amazon SEO en zoekwoordonderzoek voor de Nederlandse en Duitse markt",
          "Voorraadplanning en demand forecasting samen met inkoop",
          "Uitrol naar Amazon.de, inclusief Duitse content, btw-registratie en fitment-data",
        ],
        resultsHeading: "Resultaten op Amazon",
        results: [
          { stat: "70%", desc: "marktaandeel in de oordoppencategorie op Amazon NL", source: "Alpine Hearing Protection · Nielsen 2023" },
          { stat: "<2%", desc: "out-of-stock na invoering van demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
          { stat: "+20%", desc: "wekelijkse verkopen door een social-ad-campagne (Back to School)", source: "Alpine Hearing Protection · cv" },
        ],
        practiceHeading: "Uit de praktijk",
        practiceIntro: "Drie situaties die ik op Amazon zelf meemaakte en beschreef:",
        practice: [
          {
            title: "€14.000 ad spend per maand, 23% retouren",
            summary: "Bij een outdoormerk op Amazon DE en Bol.com lag het probleem niet in de campagnes maar in de listing: geen maatvoering in de galerij, generieke A+ Content. Na de herbouw steeg de conversie van 8,1% naar 12,7% en daalden de retouren naar 14%.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Lees de casus",
          },
          {
            title: "AI-titels die de Duitse zoektermen misten",
            summary: "Een AI-tool schreef technisch correcte Amazon DE-titels zonder de zoektermen die verkeer opleveren. De CTR daalde in zes weken met 23% voordat iemand handmatig keek. Sindsdien krijgt elke gegenereerde titel een bron- en zekerheidslabel voordat hij live gaat.",
            href: "/writing/designing-with-llms",
            linkLabel: "Lees het UX-framework",
          },
          {
            title: "Amazon of Bol.com in 2026?",
            summary: "Amazon investeert €1,4 miljard in Nederlandse logistiek en werd eind 2025 voor het eerst vaker gezocht dan Bol.com. Mijn beslisframework rekent op contributiemarge per order, niet op commissiepercentage.",
            href: "/writing/amazon-vs-bol-com-2026-nederland",
            linkLabel: "Lees de vergelijking",
          },
        ],
        approachHeading: "Hoe Amazon-accountmanagement bij mij werkt",
        approach: [
          "Een opdracht begint met een praktische nulmeting van het account: catalogusgezondheid, listingkwaliteit, dekking van zoektermen, campagnestructuur, prijs en Buy Box, voorraadrisico, accountwaarschuwingen en rapportage. Het plan scheidt acute omzetlekken van groeikansen, met per actie een meetbaar doel en een eigenaar.",
          "Uitvoering verbindt content, advertising en operatie. Zoektermonderzoek voedt titels, bullets, backend keywords, A+ Content én de campagnestructuur, in plaats van elk onderdeel als los project te behandelen. Een wekelijkse trading review zet organische zichtbaarheid, conversie, advertentie-efficiëntie, marge en beschikbaarheid naast elkaar, zodat budget- en catalogusbeslissingen op commerciële impact worden genomen.",
          "Bij doorlopend beheer bestaat de cadans uit cataloguscontroles, campagneoptimalisatie, prijs- en Buy Box-review, voorraadrisico, concurrentiewijzigingen en een compacte performance-update. Je houdt toegang tot alle beslissingen, data en werkdocumenten: het doel is een Amazon-operatie die je eigen team kan begrijpen en voortzetten.",
        ],
        pricingHeading: PRICING_NL.heading,
        pricingIntro: PRICING_NL.intro,
        pricing: PRICING_NL.models,
        pricingNote: PRICING_NL.note,
        faqHeading: "Veelgestelde vragen over Amazon NL",
        faq: [
          { q: "Wat doet een freelance Amazon NL specialist?", a: "Beheert en laat de aanwezigheid van een merk op Amazon Nederland groeien: listings optimaliseren, A+ Content maken, Amazon Ads-campagnes voeren, Buy Box en prijs bewaken, suppressies oplossen en voorraad plannen met demand forecasting." },
          { q: "Welke resultaten heb je op Amazon NL behaald?", a: "Bij Alpine Hearing Protection: 70% marktaandeel in de oordoppencategorie op Amazon NL (Nielsen, 2023), out-of-stock onder 2% door demand forecasting en minder prijsvolatiliteit in de Buy Box door afstemming met B2B-kanalen." },
          { q: "Hoe begint een samenwerking?", a: "Met een gratis 7-punts Amazon NL-audit. Ik beoordeel listings, advertising, prijs, content en operatie en lever binnen 48 uur de grootste groeikansen op. Daarna kies je voor uitvoering op projectbasis of doorlopend accountmanagement." },
          { q: "Beheer je ook Amazon Ads (PPC)?", a: "Ja. Sponsored Products, Sponsored Brands en Sponsored Display, inclusief zoekwoordonderzoek voor de Nederlandse en Duitse markt, bidmanagement en een campagnestructuur die aansluit op de categoriebenchmarks. ACOS en TACOS zijn de stuur-KPI's." },
          { q: "Help je ook met Amazon Duitsland?", a: "Ja. Ik run momenteel een catalogus van remonderdelen op Amazon DE en ken de praktische kant: Duitse content, btw-registratie, GPSR en fitment-data. Amazon.nl is vaak de opstap naar Amazon.de, waar het zoekvolume in veel categorieën een veelvoud is." },
          { q: "In welke categorieën heb je ervaring?", a: "Gehoorbescherming en gezondheid, automotive onderdelen, bouwmarkt en wonen (Karwei, Gamma, Badkamerwinkel), consumentenelektronica en sport en outdoor. De werkwijze is categorie-onafhankelijk; de zoekdata niet." },
        ],
        ctaHeading: "Klaar om te groeien op Amazon Nederland?",
        ctaText: "Vraag de gratis 7-punts Amazon NL-audit aan. Binnen 48 uur weet je waar de grootste groeikansen zitten.",
        ctaButton: "Vraag de audit aan",
        related: [RELATED.nl.bol, RELATED.nl.interim, RELATED.nl.ai, RELATED.nl.work],
      },
      en: {
        title: "Amazon NL Specialist: Freelance Amazon Netherlands Account Manager | Hans van Leeuwen",
        metaDesc:
          "Freelance Amazon NL specialist for hire. Listings, A+ Content, Amazon Ads and Buy Box on Amazon.nl and Amazon.de. 70% category market share (Nielsen 2023). Based in Amersfoort.",
        breadcrumb: "Amazon NL Specialist",
        eyebrow: "Amazon Netherlands & Germany",
        h1: "Amazon NL specialist",
        subtitle: "Freelance Amazon account manager for listings, advertising, Buy Box and stock",
        intro:
          "I'm Hans van Leeuwen, a freelance Amazon specialist based in Amersfoort, the Netherlands. I manage and grow Amazon.nl and Amazon.de accounts for brands that don't have a full-time specialist in-house. At Alpine Hearing Protection I took the earplug category on Amazon NL to a 70% market share (Nielsen, 2023), reduced Buy Box price volatility through B2B alignment and lifted conversion with A/B tests on images. At ABS All Brake Systems I currently run a catalogue of A.B.S. brake parts on Amazon DE alongside eBay DE and Bol.com.",
        whenHeading: "Who this is for",
        when: [
          "Brands on Amazon.nl with no clear view of why sales have stalled",
          "D2C brands adding Amazon without hiring a full-time account manager",
          "Category leaders defending share against private label and Chinese sellers",
          "Brands expanding from Amazon.nl to Amazon.de and the rest of the EU",
          "Teams where ACOS keeps rising while organic ranking doesn't follow",
          "Distributors with large catalogues (automotive, technical parts) and fitment data",
        ],
        servicesHeading: "Amazon services",
        services: [
          "Listing optimisation: titles, bullets, backend keywords and images driven by search data",
          "A+ Content and Brand Store that explain the difference between variants",
          "Amazon Ads: Sponsored Products, Sponsored Brands and Sponsored Display, steered on ACOS and TACOS",
          "Buy Box and pricing strategy, including alignment with B2B and retail channels",
          "Catalogue management, variations, suppressions and compliance (GPSR, brand registry)",
          "Amazon SEO and keyword research for the Dutch and German market",
          "Inventory planning and demand forecasting together with purchasing",
          "Roll-out to Amazon.de, including German content, VAT registration and fitment data",
        ],
        resultsHeading: "Results on Amazon",
        results: [
          { stat: "70%", desc: "market share in the earplug category on Amazon NL", source: "Alpine Hearing Protection · Nielsen 2023" },
          { stat: "<2%", desc: "out-of-stock after introducing demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
          { stat: "+20%", desc: "weekly sales from a social ad campaign (Back to School)", source: "Alpine Hearing Protection · CV" },
        ],
        practiceHeading: "From the field",
        practiceIntro: "Three situations I ran into on Amazon and wrote up:",
        practice: [
          {
            title: "€14,000 ad spend a month, 23% returns",
            summary: "For an outdoor brand on Amazon DE and Bol.com the problem wasn't the campaigns but the listing: no sizing in the gallery, generic A+ Content. After the rebuild conversion rose from 8.1% to 12.7% and returns dropped to 14%.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Read the case (Dutch)",
          },
          {
            title: "AI titles that missed the German search terms",
            summary: "An AI tool wrote technically correct Amazon DE titles without the search terms that bring traffic. CTR fell 23% in six weeks before anyone checked manually. Since then every generated title carries a source and confidence label before it goes live.",
            href: "/writing/designing-with-llms",
            linkLabel: "Read the UX framework (Dutch)",
          },
          {
            title: "Amazon or Bol.com in 2026?",
            summary: "Amazon is investing €1.4 billion in Dutch logistics and, at the end of 2025, was searched for more often than Bol.com for the first time. My decision framework works on contribution margin per order, not commission percentage.",
            href: "/writing/amazon-vs-bol-com-2026-nederland",
            linkLabel: "Read the comparison (Dutch)",
          },
        ],
        approachHeading: "How Amazon account management works with me",
        approach: [
          "An engagement starts with a practical account baseline: catalogue health, listing quality, search-term coverage, campaign structure, pricing and Buy Box, stock risk, account warnings and reporting. The plan separates urgent revenue leaks from growth opportunities, with a measurable target and an owner for every action.",
          "Execution connects content, advertising and operations. Search-term research feeds titles, bullets, backend keywords, A+ Content and the campaign structure, instead of treating each area as a separate project. A weekly trading review puts organic visibility, conversion, advertising efficiency, margin and availability side by side, so budget and catalogue decisions are made on commercial impact.",
          "For ongoing management the cadence covers catalogue checks, campaign optimisation, price and Buy Box review, stock risk, competitor changes and a concise performance update. You keep access to every decision, dataset and working document: the goal is an Amazon operation your own team can understand and continue.",
        ],
        pricingHeading: PRICING_EN.heading,
        pricingIntro: PRICING_EN.intro,
        pricing: PRICING_EN.models,
        pricingNote: PRICING_EN.note,
        faqHeading: "Frequently asked questions about Amazon NL",
        faq: [
          { q: "What does a freelance Amazon NL specialist do?", a: "Manages and grows a brand's presence on Amazon Netherlands: optimising listings, creating A+ Content, running Amazon Ads campaigns, protecting Buy Box and pricing, resolving suppressions and planning inventory with demand forecasting." },
          { q: "What results have you achieved on Amazon NL?", a: "At Alpine Hearing Protection: 70% market share in the earplug category on Amazon NL (Nielsen, 2023), out-of-stock below 2% through demand forecasting and less Buy Box price volatility through alignment with B2B channels." },
          { q: "How does an engagement start?", a: "With a free 7-point Amazon NL audit. I review listings, advertising, pricing, content and operations and deliver the biggest growth opportunities within 48 hours. From there you choose project-based execution or ongoing account management." },
          { q: "Do you also manage Amazon Ads (PPC)?", a: "Yes. Sponsored Products, Sponsored Brands and Sponsored Display, including keyword research for the Dutch and German market, bid management and a campaign structure aligned with category benchmarks. ACOS and TACOS are the steering KPIs." },
          { q: "Do you also cover Amazon Germany?", a: "Yes. I currently run a brake-parts catalogue on Amazon DE and know the practical side: German content, VAT registration, GPSR and fitment data. Amazon.nl is often the stepping stone to Amazon.de, where search volume in many categories is several times larger." },
          { q: "Which categories have you worked in?", a: "Hearing protection and health, automotive parts, DIY and home (Karwei, Gamma, Badkamerwinkel), consumer electronics and sports and outdoor. The method is category-independent; the search data is not." },
        ],
        ctaHeading: "Ready to grow on Amazon Netherlands?",
        ctaText: "Request the free 7-point Amazon NL audit. Within 48 hours you know where the biggest growth opportunities are.",
        ctaButton: "Request the audit",
        related: [RELATED.en.bol, RELATED.en.interim, RELATED.en.ai, RELATED.en.work],
      },
    },
  },

  /* ───────────────────────────── Bol.com ───────────────────────────── */
  {
    path: "/bol-com-consultant",
    serviceName: "Bol.com Marketplace Consulting",
    icon: "store",
    copy: {
      nl: {
        title: "Bol.com Consultant inhuren: freelance Bol.com specialist & Ads | Hans van Leeuwen",
        metaDesc:
          "Freelance Bol.com consultant inhuren voor content, Bol Ads, Buy Block en vendor-naar-seller. Zelf een Bol.com-sellerkanaal gelanceerd bij Alpine Hearing Protection. Amersfoort.",
        breadcrumb: "Bol.com Consultant",
        eyebrow: "Bol.com Nederland & België",
        h1: "Bol.com consultant inhuren",
        subtitle: "Freelance Bol.com-specialist voor content, Bol Ads, Buy Block en de vendor-naar-seller-transitie",
        intro:
          "Ik ben Hans van Leeuwen, freelance Bol.com-consultant uit Amersfoort. Ik help merken groeien op de grootste marktplaats van Nederland en België, van productcontent en Bol Ads tot prijs, Buy Block en logistiek. Bij Alpine Hearing Protection lanceerde ik het Bol.com-sellerkanaal en begeleidde ik de transitie van vendor naar seller, automatiseerde ik de marketplace-content via Channable en behaalde ik 20% meer wekelijkse verkopen met een social-ad-campagne. Bij ABS All Brake Systems rol ik nu het A.B.S.-assortiment uit naar Bol.com naast Amazon en eBay.",
        whenHeading: "Voor wie dit werkt",
        when: [
          "Merken die als vendor leveren en willen weten of seller meer marge en controle oplevert",
          "Verkopers met een compleet assortiment maar slechte vindbaarheid en een lage Buy Block-score",
          "Teams waarbij Bol Ads geld kost zonder dat de organische positie meegroeit",
          "Merken die Bol.com willen toevoegen aan een bestaande Amazon- of D2C-operatie",
          "Distributeurs met grote catalogi die contentregels per categorie moeten volgen",
          "Bedrijven die per 1 juli 2026 de Groeibeloning en de nieuwe importregels willen benutten",
        ],
        servicesHeading: "Bol.com-diensten",
        services: [
          "Productcontent: titels, beschrijvingen, attributen en afbeeldingen volgens de contentregels per categorie",
          "Bol Ads (sponsored products): structuur, targeting, biedingen en optimalisatie op ACoS",
          "Catalogus- en assortimentsbeheer, inclusief EAN-koppelingen en bundels",
          "Vendor-naar-seller-transitie met een apart migratieplan voor assortiment, prijs, logistiek en meting",
          "Prijs- en Buy Block-strategie, afgestemd op je andere kanalen",
          "Logistiek en performancescores: Verzenden via bol, retourbeleid, levertijd",
          "Feedautomatisering via Channable en maandelijkse performance-rapportage",
          "Uitrol naar Bol.com België en samenhang met Amazon.nl",
        ],
        resultsHeading: "Resultaten op Bol.com en marketplaces",
        results: [
          { stat: "Vendor → seller", desc: "Bol.com-sellerkanaal gelanceerd en de transitie succesvol begeleid", source: "Alpine Hearing Protection · 2022–2025" },
          { stat: "+20%", desc: "wekelijkse verkopen door een social-ad-campagne (Back to School)", source: "Alpine Hearing Protection · cv" },
          { stat: "70%", desc: "marktaandeel in de oordoppencategorie op Amazon NL, dezelfde werkwijze", source: "Alpine Hearing Protection · Nielsen 2023" },
        ],
        practiceHeading: "Uit de praktijk",
        practiceIntro: "Wat ik op Bol.com en Amazon meemaakte, met cijfers:",
        practice: [
          {
            title: "Een listing is een verkooppagina, geen formulier",
            summary: "Bol.com toont titels volledig, op Amazon moeten de eerste 80 tekens overtuigen. Bij een outdoormerk op beide platforms bracht een UX-herbouw van de listings de conversie van 8,1% naar 12,7% en de retouren van 23% naar 14%.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Lees de casus",
          },
          {
            title: "Amazon vs Bol.com in 2026: waar zet je op in?",
            summary: "Bol's Groeibeloning met commissiekorting gaat per 1 juli 2026 live, tegelijk vervalt de €150-vrijstelling voor import van buiten de EU. Mijn advies: reken op contributiemarge per order, want 30% marge op papier kan na retouren en advertising negatief zijn.",
            href: "/writing/amazon-vs-bol-com-2026-nederland",
            linkLabel: "Lees het beslisframework",
          },
        ],
        approachHeading: "Hoe een Bol.com-opdracht verloopt",
        approach: [
          "Een opdracht begint met een praktische nulmeting: assortimentsdekking, volledigheid van productdata, contentkwaliteit, vindbaarheid, Buy Block-prestaties, prijs, campagnestructuur, logistiek, performancescores en rapportage. Het plan scheidt directe omzetlekken van structurele groeikansen, met per actie een meetbaar doel en een eigenaar.",
          "Uitvoering verbindt content, advertising en operatie. Zoek- en categoriedata voeden titels, beschrijvingen, attributen, afbeeldingen én de Bol Ads-campagnes. Een wekelijkse trading review zet zichtbaarheid, conversie, advertentie-efficiëntie, marge, beschikbaarheid, retouren en serviceprestaties naast elkaar, zodat besluiten de hele Bol.com-operatie meewegen.",
          "Bij doorlopend beheer bestaat de cadans uit cataloguscontroles, campagneoptimalisatie, prijs- en Buy Block-review, voorraadrisico, concurrentiewijzigingen en een compacte performance-update. Een vendor-naar-seller-transitie krijgt een apart migratieplan. Je houdt toegang tot alle beslissingen, data en werkdocumenten.",
        ],
        pricingHeading: PRICING_NL.heading,
        pricingIntro: PRICING_NL.intro,
        pricing: PRICING_NL.models,
        pricingNote: PRICING_NL.note,
        faqHeading: "Veelgestelde vragen over Bol.com",
        faq: [
          { q: "Wat doet een Bol.com consultant?", a: "Helpt merken groeien op Bol.com: productcontent optimaliseren, Bol Ads-campagnes beheren, catalogus en assortiment op orde brengen, adviseren over prijs en Buy Block, en performance-rapportage inrichten. Bij mij is dat hands-on, in je eigen account." },
          { q: "Vendor of seller op Bol.com?", a: "Seller houdt marge en controle maar vraagt actief accountwerk; vendor bespaart operatie maar levert marge en prijscontrole in. Ik heb de transitie van vendor naar seller zelf begeleid bij Alpine Hearing Protection en reken beide routes door op EBITDA, niet alleen op omzet." },
          { q: "Waarom is productdata zo belangrijk op Bol.com?", a: "Bol.com rankt en converteert op contentkwaliteit. Volledige, correcte en conversiegerichte productdata, met de juiste attributen per categorie, is de basis voor vindbaarheid, de Buy Block en efficiënte advertising. Daarom automatiseerde ik die content via Channable." },
          { q: "Beheer je ook Bol Ads-campagnes?", a: "Ja. Structuur, zoekwoordtargeting, bidmanagement en continue optimalisatie op ACoS en groeidoelen. Advertising werkt pas als de listing zelf converteert; daarom begin ik altijd bij de content." },
          { q: "Wat verandert er in 2026 op Bol.com?", a: "Per 1 juli 2026 gaat het Groeibeloning-programma live met commissiekorting voor verkopers die omzetdoelen halen, opent Bol.com voor niet-EU-verkopers en vervalt de €150-vrijstelling voor importzendingen van buiten de EU. Meer concurrentie, maar ook voordeel voor wie de operatie hier op orde heeft." },
          { q: "Hoe start ik met jou op Bol.com?", a: "Met een marketplace-audit. Ik beoordeel content, advertising, assortiment en operatie op Bol.com en lever de grootste kansen op voordat we een samenwerking afspreken." },
        ],
        ctaHeading: "Groeien op Bol.com?",
        ctaText: "Vraag een Bol.com-audit aan. Je krijgt de grootste kansen op een rij, plus een schriftelijke offerte binnen één werkdag.",
        ctaButton: "Vraag de audit aan",
        related: [RELATED.nl.amazon, RELATED.nl.interim, RELATED.nl.ai, RELATED.nl.work],
      },
      en: {
        title: "Bol.com Consultant: Freelance Bol.com Specialist & Ads Manager | Hans van Leeuwen",
        metaDesc:
          "Freelance Bol.com consultant for content, Bol Ads, Buy Block and vendor-to-seller transitions. Launched a Bol.com seller channel at Alpine Hearing Protection. Based in Amersfoort.",
        breadcrumb: "Bol.com Consultant",
        eyebrow: "Bol.com Netherlands & Belgium",
        h1: "Bol.com consultant",
        subtitle: "Freelance Bol.com specialist for content, Bol Ads, Buy Block and the vendor-to-seller transition",
        intro:
          "I'm Hans van Leeuwen, a freelance Bol.com consultant based in Amersfoort, the Netherlands. I help brands grow on the largest marketplace in the Netherlands and Belgium, from product content and Bol Ads to pricing, Buy Block and logistics. At Alpine Hearing Protection I launched the Bol.com seller channel and led the transition from vendor to seller, automated marketplace content through Channable and achieved 20% more weekly sales with a social ad campaign. At ABS All Brake Systems I'm currently rolling the A.B.S. range out to Bol.com alongside Amazon and eBay.",
        whenHeading: "Who this is for",
        when: [
          "Brands supplying as a vendor that want to know whether seller brings more margin and control",
          "Sellers with a complete range but poor findability and a low Buy Block score",
          "Teams where Bol Ads costs money while the organic position doesn't move",
          "Brands adding Bol.com to an existing Amazon or D2C operation",
          "Distributors with large catalogues that must follow content rules per category",
          "Companies that want to use the Groeibeloning programme and the new import rules from 1 July 2026",
        ],
        servicesHeading: "Bol.com services",
        services: [
          "Product content: titles, descriptions, attributes and images following the content rules per category",
          "Bol Ads (sponsored products): structure, targeting, bids and optimisation on ACoS",
          "Catalogue and assortment management, including EAN mapping and bundles",
          "Vendor-to-seller transition with a separate migration plan for range, pricing, logistics and measurement",
          "Pricing and Buy Block strategy, aligned with your other channels",
          "Logistics and performance scores: Fulfilment by bol, returns policy, delivery promise",
          "Feed automation through Channable and monthly performance reporting",
          "Roll-out to Bol.com Belgium and coherence with Amazon.nl",
        ],
        resultsHeading: "Results on Bol.com and marketplaces",
        results: [
          { stat: "Vendor → seller", desc: "Bol.com seller channel launched and the transition led successfully", source: "Alpine Hearing Protection · 2022–2025" },
          { stat: "+20%", desc: "weekly sales from a social ad campaign (Back to School)", source: "Alpine Hearing Protection · CV" },
          { stat: "70%", desc: "market share in the earplug category on Amazon NL, same method", source: "Alpine Hearing Protection · Nielsen 2023" },
        ],
        practiceHeading: "From the field",
        practiceIntro: "What I ran into on Bol.com and Amazon, with numbers:",
        practice: [
          {
            title: "A listing is a sales page, not a form",
            summary: "Bol.com shows titles in full; on Amazon the first 80 characters have to convince. For an outdoor brand on both platforms a UX rebuild of the listings lifted conversion from 8.1% to 12.7% and cut returns from 23% to 14%.",
            href: "/writing/waarom-marketplace-listings-niet-converteren",
            linkLabel: "Read the case (Dutch)",
          },
          {
            title: "Amazon vs Bol.com in 2026: where to invest?",
            summary: "Bol's Groeibeloning with commission discounts goes live on 1 July 2026, the same day the €150 import exemption for non-EU shipments ends. My advice: calculate contribution margin per order, because 30% margin on paper can turn negative after returns and advertising.",
            href: "/writing/amazon-vs-bol-com-2026-nederland",
            linkLabel: "Read the decision framework (Dutch)",
          },
        ],
        approachHeading: "How a Bol.com engagement runs",
        approach: [
          "An engagement starts with a practical baseline: assortment coverage, product-data completeness, content quality, findability, Buy Block performance, pricing, campaign structure, logistics, performance scores and reporting. The plan separates immediate revenue leaks from structural growth, with a measurable target and an owner for every action.",
          "Execution connects content, advertising and operations. Search and category data feed titles, descriptions, attributes, images and the Bol Ads campaigns. A weekly trading review puts visibility, conversion, advertising efficiency, margin, availability, returns and service performance side by side, so decisions reflect the whole Bol.com account.",
          "For ongoing management the cadence covers catalogue checks, campaign optimisation, price and Buy Block review, stock risk, competitor changes and a concise performance update. A vendor-to-seller transition gets its own migration plan. You keep access to every decision, dataset and working document.",
        ],
        pricingHeading: PRICING_EN.heading,
        pricingIntro: PRICING_EN.intro,
        pricing: PRICING_EN.models,
        pricingNote: PRICING_EN.note,
        faqHeading: "Frequently asked questions about Bol.com",
        faq: [
          { q: "What does a Bol.com consultant do?", a: "Helps brands grow on Bol.com: optimising product content, managing Bol Ads campaigns, getting catalogue and assortment in order, advising on pricing and Buy Block, and setting up performance reporting. With me that is hands-on, inside your own account." },
          { q: "Vendor or seller on Bol.com?", a: "Seller keeps margin and control but requires active account work; vendor saves operations but gives up margin and price control. I led the vendor-to-seller transition myself at Alpine Hearing Protection and model both routes on EBITDA, not just revenue." },
          { q: "Why is product data so important on Bol.com?", a: "Bol.com ranks and converts on content quality. Complete, correct and conversion-oriented product data, with the right attributes per category, is the foundation for findability, the Buy Block and efficient advertising. That's why I automated that content through Channable." },
          { q: "Do you manage Bol Ads campaigns?", a: "Yes. Structure, keyword targeting, bid management and continuous optimisation on ACoS and growth targets. Advertising only works once the listing itself converts, which is why I always start with content." },
          { q: "What changes on Bol.com in 2026?", a: "From 1 July 2026 the Groeibeloning programme goes live with commission discounts for sellers hitting revenue targets, Bol.com opens to non-EU sellers, and the €150 import exemption for non-EU shipments ends. More competition, but also an advantage for sellers with their operation in order." },
          { q: "How do I start with you on Bol.com?", a: "With a marketplace audit. I review content, advertising, assortment and operations on Bol.com and deliver the biggest opportunities before we agree on an engagement." },
        ],
        ctaHeading: "Growing on Bol.com?",
        ctaText: "Request a Bol.com audit. You get the biggest opportunities listed, plus a written quote within one working day.",
        ctaButton: "Request the audit",
        related: [RELATED.en.amazon, RELATED.en.interim, RELATED.en.ai, RELATED.en.work],
      },
    },
  },

  /* ───────────────────────────── AI automation ───────────────────────────── */
  {
    path: "/ai-ecommerce-automation",
    serviceName: "AI E-commerce Automation Consulting",
    icon: "bot",
    copy: {
      nl: {
        title: "AI E-commerce Automation specialist inhuren (n8n, Claude) | Hans van Leeuwen",
        metaDesc:
          "Freelance AI e-commerce automation specialist. Automatiseer productdata, orders, advertising en rapportage voor Amazon en Bol.com met n8n, Supabase en Claude. Praktijkcijfers uit eigen stack.",
        breadcrumb: "AI E-commerce Automation",
        eyebrow: "AI & automatisering",
        h1: "AI e-commerce automation specialist inhuren",
        subtitle: "Pipelines die repetitief marketplace-werk overnemen, met de mens op de gevoelige knoppen",
        intro:
          "Ik ben Hans van Leeuwen, freelance e-commerce manager die zijn eigen marketplace-operatie grotendeels heeft geautomatiseerd. Bij ABS All Brake Systems automatiseerde ik het VIN-zoekproces voor onderdelen, een primeur in de branche, en koppelde ik eBay, Amazon en Bol.com tot één operatie; bij Alpine Hearing Protection automatiseerde ik de marketplace-content via Channable. De stack is n8n voor orchestratie, Supabase als datalaag, Claude voor content en analyse en Channable voor feeds. Wat ik lever is geen 'AI die je winkel runt', maar concrete, gemonitorde workflows waarvan elke succesmelding te bewijzen is.",
        whenHeading: "Voor wie dit werkt",
        when: [
          "Teams die elke week dezelfde exports, controles en rapportages met de hand maken",
          "Merken met grote catalogi waar productdata per kanaal handmatig wordt onderhouden",
          "Operaties met meerdere marketplaces waar voorraad en prijs uit de pas lopen",
          "Bedrijven die AI willen inzetten voor content maar geen fouten live willen zetten",
          "Ondernemers die hun eigen agents en dashboards hebben en niet zeker weten of die de waarheid spreken",
          "Teams die per kanaal een concurrentie- en prijsradar willen zonder er mensen op te zetten",
        ],
        servicesHeading: "Wat ik automatiseer",
        services: [
          "Productdata: feednormalisatie, verrijking en nachtelijke validatie per kanaal (Channable)",
          "Orders en voorraad: synchronisatie tussen Amazon, Bol.com, eBay en de webshop, met alerts bij uitval",
          "Contentpipelines: AI-gegenereerde titels en beschrijvingen met bron- en zekerheidslabel en menselijke goedkeuring",
          "Advertising: automatische ROAS/ACOS-rapportage, budgetalerts en negatieve-zoekwoordenlijsten",
          "Concurrentie- en prijsradar per marketplace, wekelijks of dagelijks",
          "KPI-rapportage naar Slack of e-mail, met bewijs (URL, databaserij, status) per melding",
          "Meta-monitoring: dead man's switches zodat je vangnet zelf bewaakt wordt",
          "Governance: wie mag wat, waar de mens beslist, en hoe je audit-trail eruitziet",
        ],
        resultsHeading: "Resultaten uit eigen operaties",
        results: [
          { stat: "1e", desc: "geautomatiseerde VIN-zoekfunctie voor onderdelen in de branche", source: "ABS All Brake Systems · 2026" },
          { stat: "3 → 1", desc: "eBay, Amazon en Bol.com gekoppeld tot één marketplace-operatie", source: "ABS All Brake Systems · 2026" },
          { stat: "<2%", desc: "out-of-stock door geautomatiseerde demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
        ],
        practiceHeading: "Uit de praktijk",
        practiceIntro: "Automatisering die ik zelf bouwde, inclusief de fouten die ik daarbij maakte:",
        practice: [
          {
            title: "Mijn AI-assistent meldde succes. De helft was verzonnen.",
            summary: "Een audit van mijn eigen stack (voorjaar 2026) liet zien dat ongeveer de helft van de succesmeldingen niet te herleiden was tot een echte actie. Een timeout van 300 seconden werd als 'success' geboekt. Drie van de vier oorzaken waren mijn eigen bouwfouten; dit is wat ik herbouwde.",
            href: "/writing/ai-agent-verzint-succes",
            linkLabel: "Lees de audit",
          },
          {
            title: "Alles stond op groen. Behalve de bewaker zelf.",
            summary: "Het vangnet dat falende crons moest melden was zelf twee weken kapot: 258 errors, nul alerts, 34 dagen zonder backup. Over meta-monitoring, dead man's switches en waarom een UNKNOWN in een dashboard meestal een ongeteste aanname is.",
            href: "/writing/meta-monitoring-wie-bewaakt-de-bewaker",
            linkLabel: "Lees over meta-monitoring",
          },
          {
            title: "Codex is geen tekstschrijver meer. Het is een operator.",
            summary: "Agentic AI doet in negen minuten complete concurrentie-research uit één prompt. Wat dat betekent voor je Bol.com- en Amazon-operatie, en waarom elke agent een bewijsplicht heeft.",
            href: "/writing/codex-agentic-ai-operator",
            linkLabel: "Lees over agentic AI",
          },
        ],
        approachHeading: "Hoe een automatiseringsopdracht verloopt",
        approach: [
          "Een opdracht begint met een gratis automation audit: ik breng de handmatige werklast in kaart en lever binnen 48 uur een geprioriteerd plan met de drie workflows die als eerste geautomatiseerd moeten worden, gerekend op uren per week en foutkosten.",
          "Elke workflow wordt gebouwd op jouw infrastructuur en accounts, met een mens in de loop op prijsgrenzen, merkstem en publicatie. Elke succesmelding moet herleidbaar zijn naar een artefact: een URL, een databaserij, een HTTP-status. Dat is de les uit mijn eigen audit en hij staat in elke workflow die ik oplever.",
          "Na oplevering blijft de operatie van jou: documentatie, toegang, monitoring en een overdracht die je eigen team kan onderhouden. Waar nodig blijf ik op retainer beschikbaar voor uitbreiding en onderhoud.",
        ],
        pricingHeading: PRICING_NL.heading,
        pricingIntro: PRICING_NL.intro,
        pricing: PRICING_NL.models,
        pricingNote: PRICING_NL.note,
        faqHeading: "Veelgestelde vragen over AI-automatisering in e-commerce",
        faq: [
          { q: "Wat is AI e-commerce automation?", a: "Een set pipelines voor productdata, operatie, advertising en rapportage die repetitief marketplace-werk overnemen en beslissingen versnellen, met een mens in de loop op strategie, prijs en merkstem. Concrete, gemonitorde workflows op n8n, Supabase en Claude; geen 'AI die je winkel runt'." },
          { q: "Welke platforms en tools automatiseer je?", a: "Amazon (NL, DE en andere EU-marktplaatsen), Bol.com, eBay en webshopplatforms zoals Magento en WooCommerce, plus de laag ertussen: Channable voor feeds, n8n voor orchestratie, Supabase als datalaag en Claude voor content en analyse." },
          { q: "Moet ik mijn team vervangen?", a: "Nee. Automatisering neemt de repetitieve 80% over zodat je team zich richt op strategie, assortiment en merk. De mens blijft in de loop op prijsgrenzen, merkstem en eindbeslissingen." },
          { q: "Hoe weet ik dat de automatisering de waarheid spreekt?", a: "Omdat elke melding bewijs meestuurt. Uit mijn eigen audit bleek ongeveer de helft van de succesmeldingen niet herleidbaar; sindsdien bouw ik elke workflow met een artefact per stap en een dead man's switch op het vangnet zelf." },
          { q: "Hoe begint een opdracht?", a: "Met een gratis automation audit. Ik breng je huidige handmatige werklast in kaart en lever binnen 48 uur een geprioriteerd plan met de drie workflows met de hoogste ROI." },
          { q: "Zijn mijn data en accounttoegang veilig?", a: "Pipelines draaien op je eigen infrastructuur en accounts; marketplace-credentials worden nooit in platte tekst gedeeld. De automatiseringslaag is auditeerbaar en je houdt volledige controle over toegang." },
        ],
        ctaHeading: "Wat kun je als eerste automatiseren?",
        ctaText: "Vraag de gratis automation audit aan. Binnen 48 uur heb je een plan met de drie workflows met de hoogste ROI.",
        ctaButton: "Vraag de audit aan",
        related: [RELATED.nl.amazon, RELATED.nl.bol, RELATED.nl.interim, RELATED.nl.work],
      },
      en: {
        title: "AI E-commerce Automation Specialist (n8n, Claude) | Hans van Leeuwen",
        metaDesc:
          "Freelance AI e-commerce automation specialist. Automate product data, orders, advertising and reporting for Amazon and Bol.com with n8n, Supabase and Claude. Real numbers from my own stack.",
        breadcrumb: "AI E-commerce Automation",
        eyebrow: "AI & automation",
        h1: "AI e-commerce automation specialist",
        subtitle: "Pipelines that take over repetitive marketplace work, with a human on the sensitive decisions",
        intro:
          "I'm Hans van Leeuwen, a freelance e-commerce manager who has automated most of his own marketplace operation. At ABS All Brake Systems I automated the VIN-based parts lookup, a first in the industry, and connected eBay, Amazon and Bol.com into a single operation; at Alpine Hearing Protection I automated marketplace content through Channable. The stack is n8n for orchestration, Supabase as the data layer, Claude for content and analysis and Channable for feeds. What I deliver is not 'an AI that runs your store' but concrete, monitored workflows where every success message can be proven.",
        whenHeading: "Who this is for",
        when: [
          "Teams that build the same exports, checks and reports by hand every week",
          "Brands with large catalogues where product data is maintained manually per channel",
          "Multi-marketplace operations where stock and pricing drift out of sync",
          "Companies that want AI for content but refuse to publish errors",
          "Founders who already have agents and dashboards and aren't sure they tell the truth",
          "Teams that want a competitor and price radar per channel without staffing it",
        ],
        servicesHeading: "What I automate",
        services: [
          "Product data: feed normalisation, enrichment and nightly validation per channel (Channable)",
          "Orders and stock: synchronisation between Amazon, Bol.com, eBay and the webstore, with alerts on failure",
          "Content pipelines: AI-generated titles and descriptions with source and confidence labels and human approval",
          "Advertising: automated ROAS/ACOS reporting, budget alerts and negative keyword lists",
          "Competitor and price radar per marketplace, weekly or daily",
          "KPI reporting to Slack or email, with evidence (URL, database row, status) per message",
          "Meta-monitoring: dead man's switches so the safety net itself is watched",
          "Governance: who may do what, where the human decides, and what your audit trail looks like",
        ],
        resultsHeading: "Results from my own operations",
        results: [
          { stat: "1st", desc: "automated VIN-based parts lookup in the industry", source: "ABS All Brake Systems · 2026" },
          { stat: "3 → 1", desc: "eBay, Amazon and Bol.com connected into one marketplace operation", source: "ABS All Brake Systems · 2026" },
          { stat: "<2%", desc: "out-of-stock through automated demand forecasting", source: "Alpine Hearing Protection · 2021–2022" },
        ],
        practiceHeading: "From the field",
        practiceIntro: "Automation I built myself, including the mistakes I made along the way:",
        practice: [
          {
            title: "My AI assistant reported success. Half of it was invented.",
            summary: "An audit of my own stack (spring 2026) showed that roughly half of the success messages could not be traced to a real action. A 300-second timeout was logged as 'success'. Three of the four causes were my own build errors; this is what I rebuilt.",
            href: "/writing/ai-agent-verzint-succes",
            linkLabel: "Read the audit (Dutch)",
          },
          {
            title: "Everything was green. Except the watchman.",
            summary: "The safety net that should report failing crons had itself been broken for two weeks: 258 errors, zero alerts, 34 days without a backup. On meta-monitoring, dead man's switches and why an UNKNOWN in a dashboard is usually an untested assumption.",
            href: "/writing/meta-monitoring-wie-bewaakt-de-bewaker",
            linkLabel: "Read about meta-monitoring (Dutch)",
          },
          {
            title: "Codex is no longer a copywriter. It's an operator.",
            summary: "Agentic AI completes full competitor research from a single prompt in nine minutes. What that means for your Bol.com and Amazon operation, and why every agent owes you proof.",
            href: "/writing/codex-agentic-ai-operator",
            linkLabel: "Read about agentic AI (Dutch)",
          },
        ],
        approachHeading: "How an automation engagement runs",
        approach: [
          "An engagement starts with a free automation audit: I map the manual workload and deliver, within 48 hours, a prioritised plan with the three workflows to automate first, calculated on hours per week and cost of errors.",
          "Every workflow is built on your infrastructure and accounts, with a human in the loop on price limits, brand voice and publishing. Every success message must trace back to an artefact: a URL, a database row, an HTTP status. That is the lesson from my own audit and it's in every workflow I deliver.",
          "After delivery the operation stays yours: documentation, access, monitoring and a handover your own team can maintain. Where needed I stay available on retainer for extensions and maintenance.",
        ],
        pricingHeading: PRICING_EN.heading,
        pricingIntro: PRICING_EN.intro,
        pricing: PRICING_EN.models,
        pricingNote: PRICING_EN.note,
        faqHeading: "Frequently asked questions about AI automation in e-commerce",
        faq: [
          { q: "What is AI e-commerce automation?", a: "A set of pipelines for product data, operations, advertising and reporting that take over repetitive marketplace work and speed up decisions, with a human in the loop on strategy, pricing and brand voice. Concrete, monitored workflows on n8n, Supabase and Claude; not 'an AI that runs your store'." },
          { q: "Which platforms and tools do you automate?", a: "Amazon (NL, DE and other EU marketplaces), Bol.com, eBay and webstore platforms such as Magento and WooCommerce, plus the layer in between: Channable for feeds, n8n for orchestration, Supabase as the data layer and Claude for content and analysis." },
          { q: "Do I need to replace my team?", a: "No. Automation takes over the repetitive 80% so your team focuses on strategy, assortment and brand. The human stays in the loop on price limits, brand voice and final decisions." },
          { q: "How do I know the automation tells the truth?", a: "Because every message ships with evidence. My own audit showed roughly half of success messages were untraceable; since then I build every workflow with an artefact per step and a dead man's switch on the safety net itself." },
          { q: "How does an engagement start?", a: "With a free automation audit. I map your current manual workload and deliver a prioritised plan within 48 hours with the three highest-ROI workflows." },
          { q: "Are my data and account access safe?", a: "Pipelines run on your own infrastructure and accounts; marketplace credentials are never shared in plain text. The automation layer is auditable and you keep full control of access." },
        ],
        ctaHeading: "What should you automate first?",
        ctaText: "Request the free automation audit. Within 48 hours you have a plan with the three highest-ROI workflows.",
        ctaButton: "Request the audit",
        related: [RELATED.en.amazon, RELATED.en.bol, RELATED.en.interim, RELATED.en.work],
      },
    },
  },
];

export const getServicePage = (path: string): ServicePageDef | undefined =>
  SERVICE_PAGES.find((p) => p.path === path);
