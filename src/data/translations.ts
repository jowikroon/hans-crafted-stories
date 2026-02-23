export type Lang = "nl" | "en";

type TranslationStrings = {
  about: string;
  coreCompetencies: string;
  experience: string;
  education: string;
  downloadCvEn: string;
  downloadCvNl: string;
  bio: [string, string];
  experienceList: {
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }[];
  skills: string[];
  educationList: {
    institution: string;
    degree: string;
    period: string;
  }[];
};

export const translations: Record<Lang, TranslationStrings> = {
  en: {
    about: "About",
    coreCompetencies: "Core Competencies",
    experience: "Experience",
    education: "Education",
    downloadCvEn: "Download CV (EN)",
    downloadCvNl: "Download CV (NL)",
    bio: [
      "E-commerce Manager with 10+ years of experience accelerating digital commerce performance across marketplaces and D2C channels. Specializing in Amazon, Bol.com, and scalable revenue growth strategies.",
      "I combine a strong background in UX design with hands-on commercial expertise to create data-driven strategies that deliver measurable results. From achieving 70% market share on Amazon NL to cutting out-of-stock rates below 2%, I turn complexity into growth.",
    ],
    experienceList: [
      {
        company: "ABS All Brake Systems",
        role: "E-commerce Manager",
        period: "Dec 2025 – Present",
        highlights: [
          "Leading growth strategy for marketplaces and D2C webshop",
          "Implementing A/B testing frameworks and automation",
          "Forecasting revenue and delivering actionable KPI insights",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "Marketplace Manager",
        period: "Feb 2022 – Dec 2025",
        highlights: [
          "Achieved 70% market share in earplug category (Nielsen Data)",
          "Launched Bol.com seller channel, transitioning from vendor model",
          "20% weekly sales increase via Muffy Kids social campaign",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "E-commerce Manager",
        period: "Oct 2021 – Mar 2022",
        highlights: [
          "Cut out-of-stock rates below 2%",
          "Outsourced customer service, improving NPS scores",
          "Centralized data and refined shipping logistics",
        ],
      },
      {
        company: "Webhelp",
        role: "Team Coach",
        period: "Feb 2020 – Oct 2021",
        highlights: [
          "Directed COVID-19 tracking, aiding national strategies",
          "Implemented training to boost pandemic response skills",
        ],
      },
      {
        company: "IGM (badkamerwinkel.nl)",
        role: "E-commerce Manager",
        period: "Aug 2019 – Feb 2020",
        highlights: [
          "Enhanced organic traffic via SEO strategy",
          "Improved content, UX, and product listings",
        ],
      },
      {
        company: "Intergamma (Karwei & Gamma)",
        role: "E-Commerce Manager",
        period: "Feb 2017 – Aug 2019",
        highlights: [
          "Managed online catalogs for KARWEI.nl, Gamma.nl & Gamma.be",
          "Delivered company-wide e-commerce training",
          "Grew organic search traffic with SEO tactics",
        ],
      },
      {
        company: "Talpa",
        role: "Online Marketeer",
        period: "Jan 2015 – Jun 2015",
        highlights: [
          "Drove web and social media strategies for Dutch television",
        ],
      },
      {
        company: "Edelman",
        role: "Graphic & UX Designer",
        period: "Sep 2013 – Jan 2014",
        highlights: [
          "Spearheaded design projects at the world's largest PR agency",
        ],
      },
    ],
    skills: [
      "Marketplace Management",
      "E-commerce Strategy",
      "SEO & On-Page SEO",
      "PPC Advertising",
      "Content Strategy",
      "Data-Driven Decision Making",
      "A/B Testing & CRO",
      "People Management",
      "Growth Hacking",
      "UX / Interaction Design",
      "Agile Methodologies",
      "Inventory & Supply Chain",
      "Google Search Console",
      "WooCommerce",
      "Stakeholder Management",
    ],
    educationList: [
      {
        institution: "HU University of Applied Sciences Utrecht",
        degree: "B.A.Sc. Communication & Media Design",
        period: "2012 – 2016",
      },
      {
        institution: "ROC Hilversum",
        degree: "MBO – ICT Manager",
        period: "2007 – 2011",
      },
    ],
  },
  nl: {
    about: "Over mij",
    coreCompetencies: "Kerncompetenties",
    experience: "Werkervaring",
    education: "Opleiding",
    downloadCvEn: "Download CV (EN)",
    downloadCvNl: "Download CV (NL)",
    bio: [
      "E-commerce Manager met 10+ jaar ervaring in het versnellen van digitale commerceprestaties via marktplaatsen en D2C-kanalen. Gespecialiseerd in Amazon, Bol.com en schaalbare groeistrategieën.",
      "Ik combineer een sterke achtergrond in UX-design met hands-on commerciële expertise om datagedreven strategieën te creëren die meetbare resultaten opleveren. Van 70% marktaandeel op Amazon NL tot het terugbrengen van out-of-stock rates onder de 2% — ik zet complexiteit om in groei.",
    ],
    experienceList: [
      {
        company: "ABS All Brake Systems",
        role: "E-commerce Manager",
        period: "Dec 2025 – Heden",
        highlights: [
          "Leid groeistrategie voor marktplaatsen en D2C-webshop",
          "Implementatie van A/B-testframeworks en automatisering",
          "Omzetprognoses en leveren van actionable KPI-inzichten",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "Marketplace Manager",
        period: "Feb 2022 – Dec 2025",
        highlights: [
          "70% marktaandeel behaald in oordoppencategorie (Nielsen Data)",
          "Bol.com verkoopkanaal gelanceerd, transitie van vendor naar seller",
          "20% wekelijkse omzetstijging via Muffy Kids sociale campagne",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "E-commerce Manager",
        period: "Okt 2021 – Mrt 2022",
        highlights: [
          "Out-of-stock rates teruggebracht onder 2%",
          "Klantenservice uitbesteed, NPS-scores verbeterd",
          "Data gecentraliseerd en verzendlogistiek geoptimaliseerd",
        ],
      },
      {
        company: "Webhelp",
        role: "Team Coach",
        period: "Feb 2020 – Okt 2021",
        highlights: [
          "COVID-19-tracking geleid, bijgedragen aan nationale strategieën",
          "Trainingen geïmplementeerd ter versterking van pandemierespons",
        ],
      },
      {
        company: "IGM (badkamerwinkel.nl)",
        role: "E-commerce Manager",
        period: "Aug 2019 – Feb 2020",
        highlights: [
          "Organisch verkeer vergroot via SEO-strategie",
          "Content, UX en productpagina's verbeterd",
        ],
      },
      {
        company: "Intergamma (Karwei & Gamma)",
        role: "E-Commerce Manager",
        period: "Feb 2017 – Aug 2019",
        highlights: [
          "Online catalogi beheerd voor KARWEI.nl, Gamma.nl & Gamma.be",
          "Bedrijfsbrede e-commercetraining gegeven",
          "Organisch zoekverkeer vergroot met SEO-tactieken",
        ],
      },
      {
        company: "Talpa",
        role: "Online Marketeer",
        period: "Jan 2015 – Jun 2015",
        highlights: [
          "Web- en socialmediastrategieën aangestuurd voor Nederlandse televisie",
        ],
      },
      {
        company: "Edelman",
        role: "Grafisch & UX Designer",
        period: "Sep 2013 – Jan 2014",
        highlights: [
          "Designprojecten geleid bij 's werelds grootste PR-bureau",
        ],
      },
    ],
    skills: [
      "Marktplaatsbeheer",
      "E-commercestrategie",
      "SEO & On-Page SEO",
      "PPC-advertenties",
      "Contentstrategie",
      "Datagedreven besluitvorming",
      "A/B-testen & CRO",
      "Peoplemanagement",
      "Growth Hacking",
      "UX / Interactieontwerp",
      "Agile Methodologieën",
      "Voorraad & Supply Chain",
      "Google Search Console",
      "WooCommerce",
      "Stakeholdermanagement",
    ],
    educationList: [
      {
        institution: "Hogeschool Utrecht",
        degree: "B.A.Sc. Communicatie & Media Design",
        period: "2012 – 2016",
      },
      {
        institution: "ROC Hilversum",
        degree: "MBO – ICT Beheerder",
        period: "2007 – 2011",
      },
    ],
  },
};
