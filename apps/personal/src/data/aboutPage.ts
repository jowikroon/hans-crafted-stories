// Content for /about (redesign 2026-10-15).
// NL "Mijn verhaal" is the text Hans approved on 2026-10-15 (version 2, final). Do not rewrite it.
// EN is a translation of that text; Hans reviews it before it is treated as final.
// House rules: no em dashes; never link Connect Car Parts to its parent or supplier company.
// Fonts: only the main fonts (Switzer, JetBrains Mono) via the site CSS variables (vault HVL-Main-Fonts).

export const CALENDLY_URL = "https://calendly.com/hansvl3/30min";
export const LINKEDIN_URL = "https://www.linkedin.com/in/hansvl3";

export interface Stat { value: string; label: string; source: string }
export interface Chapter { period: string; title: string; paragraphs: string[]; rules?: { intro: string; items: string[]; outro: string }; metric?: { value: string; label: string } }
export interface Role { period: string; title: string; org: string; summary: string; details?: string[] }
export interface Edu { period: string; title: string; org: string }
export interface Service { title: string; copy: string; to: string }

export interface AboutCopy {
  crumb: string;
  eyebrow: string;
  kicker: string;
  location: string;
  display: string;
  lead: string;
  cta: string;
  ctaShort: string;
  casesLink: string;
  email: string;
  onThisPage: string;
  anchors: { story: string; career: string; services: string; contact: string };
  stats: Stat[];
  casesLink2: string;
  storyHeading: string;
  storyIntro: string;
  chapters: Chapter[];
  thread: { eyebrow: string; heading: string; pre: string; quote: string; post: string; question: string };
  careerHeading: string;
  resultsToggle: string;
  roles: Role[];
  eduHeading: string;
  edu: Edu[];
  skillsHeading: string;
  skills: { group: string; items: string }[];
  linkedinLink: string;
  servicesHeading: string;
  services: Service[];
  tools: string;
  allCasesLink: string;
  contactHeading: string;
  contactLead: string;
  offer: string;
  ratesLink: string;
  howLink: string;
  formHeading: string;
  reasonHelp: string;
  photoAlt: string;
}

export const ABOUT: Record<"nl" | "en", AboutCopy> = {
  nl: {
    crumb: "Over mij",
    eyebrow: "Over mij",
    kicker: "Hans van Leeuwen, marketplace manager voor Amazon, Bol.com en eBay",
    location: "Amersfoort",
    display: "Ik ontwerp vanuit de gebruiker en bouw tot het werkt.",
    lead: "Dat doe ik al achttien jaar. Alleen het medium verandert.",
    cta: "Plan een gesprek van 30 minuten",
    ctaShort: "Plan een gesprek",
    casesLink: "Bekijk mijn cases",
    email: "E-mail",
    onThisPage: "Op deze pagina:",
    anchors: { story: "Mijn verhaal", career: "Loopbaan", services: "Diensten", contact: "Contact" },
    stats: [
      { value: "70%", label: "marktaandeel oordoppen op Amazon NL", source: "Alpine Hearing Protection · Nielsen, 2023" },
      { value: "< 2%", label: "out-of-stock, webshops in 4 landen en Amazon in 6", source: "Alpine Hearing Protection" },
      { value: "+40%", label: "organisch verkeer op KARWEI.nl, Gamma.nl en Gamma.be", source: "Intergamma" },
      { value: "+35%", label: "organische zichtbaarheid, conversie +15%", source: "IGM, badkamerwinkel.nl en .be" },
    ],
    casesLink2: "Bekijk de cases",
    storyHeading: "Mijn verhaal",
    storyIntro: "Mijn vak is user experience, met een sterke koppeling naar interactieontwerp. Of het nu gaat om een website, een productcatalogus, een marketplace-listing of een AI-assistent: de werkwijze is dezelfde.",
    chapters: [
      { period: "01 · Vanaf 2008", title: "Fundament: weten hoe het onder de motorkap werkt", paragraphs: [
        "Ik begon in 2008 op de servicedesk van Pink Elephant. Binnen een paar maanden deed ik serverbeheer op afstand. Bij ASP4all werkte ik met VMware, vSphere, NetApp en Cisco UCS, en ik haalde mijn CCNA. Dat is mijn voordeel als ontwerper: ik weet waar een systeem meebuigt en waar niet. Ik ontwerp niets wat niet gebouwd kan worden.",
      ] },
      { period: "02 · 2012 tot 2016", title: "Methode: onderzoek eerst", paragraphs: [
        "Aan de Hogeschool Utrecht (Communicatie & Media Design, specialisatie concept) leerde ik de modellen die ik nog steeds gebruik: het Fogg Behavior Model, de User Needs-piramide van Aarron Walter, de Elements of UX van Jesse James Garrett en Don't Make Me Think van Steve Krug.",
        "Bij Edelman paste ik dat toe op hun eigen website: eerst gebruikersonderzoek en een concurrentieanalyse van PR-bureaus, dan pas een ontwerp. Bij Talpa onderzocht ik zestien weken de online community van Utopia en schreef ik het advies over vormgeving en content.",
      ] },
      { period: "03 · 2016 tot 2022", title: "Waar ontwerp omzet wordt", metric: { value: "+40%", label: "organisch verkeer · Intergamma" }, paragraphs: [
        "Bij Intergamma was ik verantwoordelijk voor de online catalogus van KARWEI.nl, later ook Gamma NL en BE. Duizenden producten, filters en zoekresultaten. Vindbaarheid is UX. Met Fredhopper, Algolia en Google Analytics zorgde ik dat bezoekers vonden wat ze zochten. Organisch verkeer steeg met 40%, en ik trainde de organisatie in het werken met de catalogus.",
        "Bij IGM (badkamerwinkel.nl en .be) maakte ik het platform minder afhankelijk van betaald verkeer. Productcontent, attributen en filtering op orde: organische zichtbaarheid +35%, conversie +15%.",
        "Toen kwam corona. Bij Webhelp coachte en trainde ik teams die voor de GGD het virus in kaart brachten. Geen e-commerce. Wel mensen onder druk in hun beste werk krijgen.",
      ] },
      { period: "04 · 2021 tot 2025", title: "Marketplaces", metric: { value: "+20%", label: "weekverkoop · Back-to-School-campagne" }, paragraphs: [
        "Bij Alpine Hearing Protection kwam alles samen. Als e-commerce manager stuurde ik voorraad en klantenservice aan over webshops in vier landen en Amazon in zes. Out-of-stock ging naar onder de 2%. De klantenservice besteedde ik uit, met eigen protocollen en handleidingen.",
        "Daarna werd ik marketplace manager, eindverantwoordelijk voor Amazon en Bol.com in zeven landen. Een productpagina op Amazon is een interface met strenge regels. Ik testte afbeeldingen, A+ content en listingstructuur. Ik implementeerde Channable, zette de overstap van Bol.com vendor naar seller op en verlaagde de Buy Box-volatiliteit door afstemming met B2B-partners. Resultaat: 70% marktaandeel in de oordoppencategorie op Amazon NL (Nielsen, 2023) en +20% weekverkoop met een Back-to-School-campagne.",
      ] },
      { period: "05 · Sinds december 2025", title: "Nu: ontwerpen voor snelheid", paragraphs: [
        "Sinds december 2025 werk ik in de automotive aftermarket. Daar bracht ik eBay, Amazon en Bol.com samen in één marketplace-operatie en bouwde ik de feedketen van marketplace tot ERP. Het zoeken van passende onderdelen automatiseerde ik op basis van het VIN, een primeur in de branche.",
      ], rules: {
        intro: "Ik ontwerp nu vooral systemen, met vaste regels:",
        items: ["snel gebruik boven visuele glans", "beslissnelheid boven flair", "minder klikken", "hoge informatiedichtheid"],
        outro: "In eigen projecten, zoals het SaaS-platform MarketplaceGrowth.nl en AI-assistent Samantha, ontwerp ik de interface en bouw ik de techniek erachter.",
      } },
    ],
    thread: {
      eyebrow: "06 · De rode draad",
      heading: "De rode draad",
      pre: "Servers, ontwerp, catalogi, marketplaces, AI.",
      quote: "Het lijkt een zigzag. Het is één lijn.",
      post: "Ik vertaal techniek naar iets wat mensen begrijpen en gebruiken, en ik meet of het werkt. Ik begin bij de eindgebruiker en stem de boodschap af op het medium. Dat deed ik in 2008 aan de telefoon. Dat doe ik nog steeds.",
      question: "Benieuwd wat dit voor jouw marketplaces betekent?",
    },
    careerHeading: "Loopbaan",
    resultsToggle: "Resultaten",
    roles: [
      { period: "dec 2025 tot heden", title: "E-commerce Manager", org: "Connect Car Parts", summary: "eBay, Amazon en Bol.com samengebracht in één marketplace-operatie", details: ["VIN-gebaseerde onderdelen-lookup geautomatiseerd, een primeur in de branche", "Omzetprognoses en KPI-inzichten geleverd"] },
      { period: "feb 2022 tot dec 2025", title: "Marketplace Manager", org: "Alpine Hearing Protection", summary: "Eindverantwoordelijk voor Amazon en Bol.com in zeven landen", details: ["70% marktaandeel in de oordoppencategorie op Amazon NL (Nielsen, 2023)", "20% meer wekelijkse verkopen met een Back-to-School-campagne; A/B-tests op afbeeldingen verhoogden de conversie", "Minder prijsvolatiliteit in de Buy Box door B2B-afstemming; marktdata-analyse met Helium10 en Nielsen", "Bol.com-sellerkanaal gelanceerd, overstap van vendor naar seller", "Marketplace-content geautomatiseerd via Channable"] },
      { period: "okt 2021 tot feb 2022", title: "E-commerce Manager", org: "Alpine Hearing Protection", summary: "Out-of-stock naar onder de 2%", details: ["Voorraad en klantenservice over webshops in vier landen en Amazon in zes", "Klantenservice uitbesteed met eigen protocollen en handleidingen"] },
      { period: "feb 2020 tot feb 2022", title: "Team Coach", org: "Webhelp", summary: "Teams gecoacht en getraind die voor de GGD het virus in kaart brachten" },
      { period: "aug 2019 tot feb 2020", title: "E-commerce Manager", org: "IGM (badkamerwinkel.nl)", summary: "Organische zichtbaarheid +35%, conversie +15%", details: ["SEO-strategie en PPC-campagnes", "Productcontent, attributen, filtering en sitemapping verbeterd voor badkamerwinkel.nl en .be"] },
      { period: "feb 2016 tot aug 2019", title: "E-commerce Manager", org: "Intergamma (KARWEI en Gamma)", summary: "Online catalogus van KARWEI.nl, later Gamma NL en BE", details: ["Organisch verkeer +40% door SEO-optimalisatie van de catalogi van KARWEI.nl, Gamma.nl en Gamma.be", "Gerichte advertentiecampagnes; bedrijfsbrede e-commerce- en catalogustraining", "Assistent e-commerce manager (feb 2017 tot jan 2019), e-commerce manager vanaf 2019"] },
      { period: "jan tot jun 2015", title: "Online Marketeer", org: "Talpa", summary: "Zestien weken onderzoek naar de online community van Utopia" },
      { period: "sep 2013 tot jan 2014", title: "Grafisch & UX Designer", org: "Edelman", summary: "Gebruikersonderzoek en concurrentieanalyse voor de eigen website" },
      { period: "2008 tot 2011", title: "Servicedesk en serverbeheer", org: "Pink Elephant, ASP4all", summary: "Serverbeheer op afstand, CCNA" },
    ],
    eduHeading: "Opleiding",
    edu: [
      { period: "2012 tot 2016", title: "Communicatie & Media Design, specialisatie concept", org: "Hogeschool Utrecht" },
      { period: "2007 tot 2011", title: "MBO ICT Beheerder (CCNA, VMware Certified)", org: "ROC Hilversum" },
      { period: "Certificaten", title: "Foundations of Digital Marketing and E-commerce, Foundations of Project Management", org: "Google" },
    ],
    skillsHeading: "Vakgebieden",
    skills: [
      { group: "Marketplaces", items: "Marktplaatsbeheer, Amazon Ads en Bol Ads, voorraad en supply chain" },
      { group: "Vindbaarheid en conversie", items: "SEO, contentstrategie, A/B-testen en CRO" },
      { group: "Mens en systeem", items: "UX en interactieontwerp, peoplemanagement, stakeholdermanagement" },
    ],
    linkedinLink: "Volledig profiel op LinkedIn",
    servicesHeading: "Waarmee ik je help",
    services: [
      { title: "Interim e-commerce manager", copy: "Tijdelijk de e-commerce operatie overnemen: strategie, listings, advertising, pricing, forecasting en rapportages. Hands-on in jullie team.", to: "/interim-ecommerce-manager" },
      { title: "Amazon NL specialist", copy: "Listings, A+ content en Amazon Ads, met ACOS en TACOS als stuur-KPI.", to: "/amazon-nl-specialist" },
      { title: "Bol.com consultant", copy: "Seller of vendor doorrekenen op EBITDA, het sellerkanaal opzetten en Bol Ads.", to: "/bol-com-consultant" },
      { title: "AI en e-commerce-automatisering", copy: "Feeds en processen automatiseren, van Channable tot de feedketen van marketplace naar ERP.", to: "/ai-ecommerce-automation" },
    ],
    tools: "Gewerkt met Channable, Helium10, Nielsen, Fredhopper, Algolia, Google Analytics, VMware en n8n.",
    allCasesLink: "Alle cases bekijken",
    contactHeading: "Zullen we 30 minuten praten?",
    contactLead: "Over een interim-opdracht, een marketplace-vraag of een vacature.",
    offer: "Na het gesprek heb je binnen 1 werkdag een schriftelijke offerte.",
    ratesLink: "Bekijk tarieven",
    howLink: "Zo werk ik",
    formHeading: "Liever een bericht sturen?",
    reasonHelp: "Recruiter? Kies 'Vacature'.",
    photoAlt: "Hans van Leeuwen, marketplace manager uit Amersfoort",
  },
  en: {
    crumb: "About",
    eyebrow: "About me",
    kicker: "Hans van Leeuwen, marketplace manager for Amazon, Bol.com and eBay",
    location: "Amersfoort, NL",
    display: "I design from the user's point of view and build until it works.",
    lead: "I have done that for eighteen years. Only the medium changes.",
    cta: "Book a 30-minute call",
    ctaShort: "Book a call",
    casesLink: "See my case studies",
    email: "Email",
    onThisPage: "On this page:",
    anchors: { story: "My story", career: "Career", services: "Services", contact: "Contact" },
    stats: [
      { value: "70%", label: "share of the earplug category on Amazon NL", source: "Alpine Hearing Protection · Nielsen, 2023" },
      { value: "< 2%", label: "out-of-stock, webshops in 4 countries and Amazon in 6", source: "Alpine Hearing Protection" },
      { value: "+40%", label: "organic traffic on KARWEI.nl, Gamma.nl and Gamma.be", source: "Intergamma" },
      { value: "+35%", label: "organic visibility, conversion +15%", source: "IGM, badkamerwinkel.nl and .be" },
    ],
    casesLink2: "See the case studies",
    storyHeading: "My story",
    storyIntro: "My craft is user experience, closely tied to interaction design. Whether it is a website, a product catalogue, a marketplace listing or an AI assistant: the method is the same.",
    chapters: [
      { period: "01 · From 2008", title: "Foundation: knowing what happens under the hood", paragraphs: [
        "I started in 2008 on the service desk at Pink Elephant. Within a few months I was managing servers remotely. At ASP4all I worked with VMware, vSphere, NetApp and Cisco UCS, and I earned my CCNA. That is my advantage as a designer: I know where a system bends and where it does not. I never design something that cannot be built.",
      ] },
      { period: "02 · 2012 to 2016", title: "Method: research first", paragraphs: [
        "At Hogeschool Utrecht (Communication & Media Design, concept specialisation) I learned the models I still use: the Fogg Behavior Model, Aarron Walter's hierarchy of user needs, Jesse James Garrett's Elements of UX and Steve Krug's Don't Make Me Think.",
        "At Edelman I applied that to their own website: user research and a competitor analysis of PR agencies first, design second. At Talpa I spent sixteen weeks researching the online community of Utopia and wrote the advice on design and content.",
      ] },
      { period: "03 · 2016 to 2022", title: "Where design turns into revenue", metric: { value: "+40%", label: "organic traffic · Intergamma" }, paragraphs: [
        "At Intergamma I was responsible for the online catalogue of KARWEI.nl, later also Gamma NL and BE. Thousands of products, filters and search results. Findability is UX. With Fredhopper, Algolia and Google Analytics I made sure visitors found what they were looking for. Organic traffic grew by 40%, and I trained the organisation in working with the catalogue.",
        "At IGM (badkamerwinkel.nl and .be) I made the platform less dependent on paid traffic. Product content, attributes and filtering in order: organic visibility +35%, conversion +15%.",
        "Then COVID came. At Webhelp I coached and trained teams that mapped the virus for the Dutch public health services (GGD). Not e-commerce. Getting people to do their best work under pressure.",
      ] },
      { period: "04 · 2021 to 2025", title: "Marketplaces", metric: { value: "+20%", label: "weekly sales · Back-to-School campaign" }, paragraphs: [
        "At Alpine Hearing Protection everything came together. As e-commerce manager I ran stock and customer service across webshops in four countries and Amazon in six. Out-of-stock dropped below 2%. I outsourced customer service, with our own protocols and manuals.",
        "Then I became marketplace manager, fully responsible for Amazon and Bol.com in seven countries. A product page on Amazon is an interface with strict rules. I tested images, A+ content and listing structure. I implemented Channable, set up the move from Bol.com vendor to seller and reduced Buy Box volatility through alignment with B2B partners. Result: 70% share of the earplug category on Amazon NL (Nielsen, 2023) and +20% weekly sales from a Back-to-School campaign.",
      ] },
      { period: "05 · Since December 2025", title: "Now: designing for speed", paragraphs: [
        "Since December 2025 I have worked in the automotive aftermarket. There I brought eBay, Amazon and Bol.com together in one marketplace operation and built the feed chain from marketplace to ERP. I automated finding the right parts based on the VIN, a first in the industry.",
      ], rules: {
        intro: "Today I mostly design systems, with fixed rules:",
        items: ["fast use over visual polish", "decision speed over flair", "fewer clicks", "high information density"],
        outro: "In my own projects, such as the SaaS platform MarketplaceGrowth.nl and the AI assistant Samantha, I design the interface and build the technology behind it.",
      } },
    ],
    thread: {
      eyebrow: "06 · The common thread",
      heading: "The common thread",
      pre: "Servers, design, catalogues, marketplaces, AI.",
      quote: "It looks like a zigzag. It is one line.",
      post: "I translate technology into something people understand and use, and I measure whether it works. I start with the end user and shape the message to the medium. I did that on the phone in 2008. I still do.",
      question: "Curious what this could mean for your marketplaces?",
    },
    careerHeading: "Career",
    resultsToggle: "Results",
    roles: [
      { period: "Dec 2025 to present", title: "E-commerce Manager", org: "Connect Car Parts", summary: "Brought eBay, Amazon and Bol.com together in one marketplace operation", details: ["Automated VIN-based parts lookup, a first in the industry", "Delivered revenue forecasts and KPI insights"] },
      { period: "Feb 2022 to Dec 2025", title: "Marketplace Manager", org: "Alpine Hearing Protection", summary: "Fully responsible for Amazon and Bol.com in seven countries", details: ["70% share of the earplug category on Amazon NL (Nielsen, 2023)", "20% more weekly sales from a Back-to-School campaign; image A/B tests lifted conversion", "Less Buy Box price volatility through B2B alignment; market data analysis with Helium10 and Nielsen", "Launched the Bol.com seller channel, moving from vendor to seller", "Automated marketplace content through Channable"] },
      { period: "Oct 2021 to Feb 2022", title: "E-commerce Manager", org: "Alpine Hearing Protection", summary: "Out-of-stock below 2%", details: ["Stock and customer service across webshops in four countries and Amazon in six", "Outsourced customer service with our own protocols and manuals"] },
      { period: "Feb 2020 to Feb 2022", title: "Team Coach", org: "Webhelp", summary: "Coached and trained teams that mapped the virus for the GGD" },
      { period: "Aug 2019 to Feb 2020", title: "E-commerce Manager", org: "IGM (badkamerwinkel.nl)", summary: "Organic visibility +35%, conversion +15%", details: ["SEO strategy and PPC campaigns", "Improved product content, attributes, filtering and sitemapping for badkamerwinkel.nl and .be"] },
      { period: "Feb 2016 to Aug 2019", title: "E-commerce Manager", org: "Intergamma (KARWEI and Gamma)", summary: "Online catalogue of KARWEI.nl, later Gamma NL and BE", details: ["Organic traffic +40% through SEO optimisation of the KARWEI.nl, Gamma.nl and Gamma.be catalogues", "Targeted ad campaigns; company-wide e-commerce and catalogue training", "Assistant e-commerce manager (Feb 2017 to Jan 2019), e-commerce manager from 2019"] },
      { period: "Jan to Jun 2015", title: "Online Marketer", org: "Talpa", summary: "Sixteen weeks of research into the online community of Utopia" },
      { period: "Sep 2013 to Jan 2014", title: "Graphic & UX Designer", org: "Edelman", summary: "User research and competitor analysis for the agency's own website" },
      { period: "2008 to 2011", title: "Service desk and server management", org: "Pink Elephant, ASP4all", summary: "Remote server management, CCNA" },
    ],
    eduHeading: "Education",
    edu: [
      { period: "2012 to 2016", title: "Communication & Media Design, concept specialisation", org: "Hogeschool Utrecht" },
      { period: "2007 to 2011", title: "MBO ICT Administrator (CCNA, VMware Certified)", org: "ROC Hilversum" },
      { period: "Certificates", title: "Foundations of Digital Marketing and E-commerce, Foundations of Project Management", org: "Google" },
    ],
    skillsHeading: "Areas of expertise",
    skills: [
      { group: "Marketplaces", items: "Marketplace management, Amazon Ads and Bol Ads, stock and supply chain" },
      { group: "Findability and conversion", items: "SEO, content strategy, A/B testing and CRO" },
      { group: "People and systems", items: "UX and interaction design, people management, stakeholder management" },
    ],
    linkedinLink: "Full profile on LinkedIn",
    servicesHeading: "How I can help",
    services: [
      { title: "Interim e-commerce manager", copy: "Temporarily taking over the e-commerce operation: strategy, listings, advertising, pricing, forecasting and reporting. Hands-on inside your team.", to: "/interim-ecommerce-manager" },
      { title: "Amazon NL specialist", copy: "Listings, A+ content and Amazon Ads, steered on ACOS and TACOS.", to: "/amazon-nl-specialist" },
      { title: "Bol.com consultant", copy: "Seller or vendor, modelled on EBITDA, setting up the seller channel and Bol Ads.", to: "/bol-com-consultant" },
      { title: "AI and e-commerce automation", copy: "Automating feeds and processes, from Channable to the feed chain from marketplace to ERP.", to: "/ai-ecommerce-automation" },
    ],
    tools: "Worked with Channable, Helium10, Nielsen, Fredhopper, Algolia, Google Analytics, VMware and n8n.",
    allCasesLink: "All case studies",
    contactHeading: "Shall we talk for 30 minutes?",
    contactLead: "About an interim assignment, a marketplace question or a vacancy.",
    offer: "After the call you receive a written quote within 1 working day.",
    ratesLink: "See rates",
    howLink: "How I work",
    formHeading: "Prefer to send a message?",
    reasonHelp: "Recruiter? Choose 'Job Opportunity'.",
    photoAlt: "Hans van Leeuwen, marketplace manager from Amersfoort",
  },
};
