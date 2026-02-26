export type Lang = "nl" | "en";

type TranslationStrings = {
  /* ── About page (existing) ── */
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

  /* ── Navigation ── */
  nav: {
    home: string;
    work: string;
    writing: string;
    about: string;
    search: string;
    searchPlaceholder: string;
    noResults: string;
    login: string;
    portal: string;
  };

  /* ── Hero / Home ── */
  hero: {
    subtitle: string;
    heading: string;
    headingEmphasis: string;
    description: string;
    ctaWork: string;
    ctaAbout: string;
    expertiseLabel: string;
    expertiseHeading: string;
    expertise: { title: string; description: string }[];
    linkCases: string;
    linkWriting: string;
    linkAbout: string;
  };

  /* ── Writing page ── */
  writing: {
    label: string;
    heading: string;
    subtitle: string;
    searchPlaceholder: string;
    newest: string;
    oldest: string;
    postSingular: string;
    postPlural: string;
    matching: string;
    noPostsTitle: string;
    clearFilters: string;
    clear: string;
    loading: string;
  };

  /* ── Work page ── */
  work: {
    label: string;
    heading: string;
    description: string;
    projectSingular: string;
    projectPlural: string;
    matching: string;
    noProjectsTitle: string;
    showAll: string;
    loading: string;
  };

  /* ── Privacy page ── */
  privacy: {
    title: string;
    lastUpdated: string;
    sections: { heading: string; body: string }[];
  };

  /* ── Cookie consent ── */
  cookie: {
    title: string;
    description: string;
    privacyLink: string;
    accept: string;
    decline: string;
    close: string;
  };

  /* ── 404 ── */
  notFound: {
    heading: string;
    message: string;
    returnHome: string;
  };

  /* ── Breadcrumb ── */
  breadcrumb: {
    home: string;
  };

  /* ── Footer ── */
  footer: {
    privacy: string;
  };

  /* ── SEO ── */
  seo: {
    homeTitle: string;
    homeDescription: string;
    writingTitle: string;
    writingDescription: string;
    workTitle: string;
    workDescription: string;
    privacyTitle: string;
    privacyDescription: string;
  };
};

export const translations: Record<Lang, TranslationStrings> = {
  en: {
    /* ── About ── */
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

    /* ── Navigation ── */
    nav: {
      home: "Home",
      work: "Work",
      writing: "Writing",
      about: "About",
      search: "Search",
      searchPlaceholder: "Search pages...",
      noResults: "No results found.",
      login: "Login",
      portal: "Portal",
    },

    /* ── Hero ── */
    hero: {
      subtitle: "E-commerce Manager · Marketplace Specialist",
      heading: "Driving e-commerce growth through",
      headingEmphasis: "strategy",
      description:
        "I'm Hans van Leeuwen — an e-commerce manager based in Amersfoort, specializing in Amazon, Bol.com, and marketplace growth strategies. I help businesses turn digital channels into revenue engines.",
      ctaWork: "View my work",
      ctaAbout: "About me",
      expertiseLabel: "What I do",
      expertiseHeading: "E-commerce expertise that drives results",
      expertise: [
        {
          title: "Marketplace Management",
          description: "Amazon, Bol.com, and multi-channel marketplace strategy to maximize visibility and sales.",
        },
        {
          title: "Growth & Optimization",
          description: "Data-driven conversion optimization, A/B testing, and revenue scaling for e-commerce businesses.",
        },
        {
          title: "SEO & Content Strategy",
          description: "Search-first content strategies that drive organic traffic and improve marketplace rankings.",
        },
        {
          title: "Digital Commerce UX",
          description: "User experience design focused on reducing friction and increasing customer lifetime value.",
        },
      ],
      linkCases: "Case Studies →",
      linkWriting: "Writing & Insights →",
      linkAbout: "About Hans →",
    },

    /* ── Writing ── */
    writing: {
      label: "Writing",
      heading: "Thoughts & Essays",
      subtitle: "On design, e-commerce, technology, and life beyond the screen.",
      searchPlaceholder: "Search posts...",
      newest: "Newest",
      oldest: "Oldest",
      postSingular: "post",
      postPlural: "posts",
      matching: "matching",
      noPostsTitle: "No posts match your filters.",
      clearFilters: "Clear all filters",
      clear: "Clear",
      loading: "Loading…",
    },

    /* ── Work ── */
    work: {
      label: "Portfolio & Case Studies",
      heading: "E-commerce, 3D & UX Design Work",
      description:
        "A curated collection of case studies — from Amazon & Bol.com e-commerce UX concepts to 3D creative experiments, VR games, and branding projects. Each project features real results and measurable outcomes.",
      projectSingular: "project",
      projectPlural: "projects",
      matching: "matching",
      noProjectsTitle: "No projects in this category.",
      showAll: "Show all projects",
      loading: "Loading…",
    },

    /* ── Privacy ── */
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: February 2026",
      sections: [
        {
          heading: "1. Who are we?",
          body: 'This website is operated by Hans van Leeuwen, e-commerce manager based in Amersfoort, the Netherlands. For questions about this privacy policy, please contact <a href="mailto:hansvl3@gmail.com" class="text-primary underline">hansvl3@gmail.com</a>.',
        },
        {
          heading: "2. What data do we collect?",
          body: "We only collect anonymous analytical data via Google Analytics 4 (GA4), managed through Google Tag Manager. This includes page views, session duration, and device type. No personal data such as names, email addresses, or IP addresses is stored — IP anonymization is enabled by default in GA4.",
        },
        {
          heading: "3. Cookies",
          body: "We use analytical cookies only after your explicit consent (opt-in). Without consent, no tracking cookies are placed. You can withdraw your consent at any time by clearing your browser data.",
        },
        {
          heading: "4. Google Consent Mode v2",
          body: "This website uses Google Consent Mode v2. This means all storage types (analytics, advertising, personalization) are denied by default for visitors from the EEA, until you actively grant consent.",
        },
        {
          heading: "5. Third-party sharing",
          body: 'We do not share personal data with third parties. Analytical data is processed exclusively by Google in accordance with their <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-primary underline">privacy policy</a>.',
        },
        {
          heading: "6. Your rights",
          body: "Under the GDPR, you have the right to access, rectify, and delete your data. Since we do not store personal data, this is not applicable in practice. For questions, you can always reach out.",
        },
        {
          heading: "7. Changes",
          body: "This privacy policy may be updated. The most recent version is always available on this page.",
        },
      ],
    },

    /* ── Cookie ── */
    cookie: {
      title: "Cookies & Privacy",
      description:
        "We use analytical cookies to understand and improve the website experience. No personal data is shared with third parties.",
      privacyLink: "Privacy Policy",
      accept: "Accept",
      decline: "Decline",
      close: "Close",
    },

    /* ── 404 ── */
    notFound: {
      heading: "404",
      message: "Oops! Page not found",
      returnHome: "Return to Home",
    },

    /* ── Breadcrumb ── */
    breadcrumb: { home: "Home" },

    /* ── Footer ── */
    footer: { privacy: "Privacy" },

    /* ── SEO ── */
    seo: {
      homeTitle: "E-commerce Manager & Marketplace Specialist (Amazon & Bol.com) | Hans van Leeuwen",
      homeDescription: "Hans van Leeuwen – E-commerce manager with 10+ years of experience. Driving marketplace growth on Amazon & Bol.com through strategy, UX optimization, and revenue scaling. Based in Amersfoort, NL.",
      writingTitle: "E-commerce Insights & Articles | Hans van Leeuwen",
      writingDescription: "Read Hans van Leeuwen's thoughts on e-commerce strategy, marketplace optimization, Amazon & Bol.com growth, UX design, and digital commerce trends.",
      workTitle: "Design Portfolio & Case Studies | E-commerce, 3D & UX | Hans van Leeuwen",
      workDescription: "Explore Hans van Leeuwen's portfolio: e-commerce UX case studies, 3D creative work, VR game design, and branding projects with measurable results.",
      privacyTitle: "Privacy Policy | Hans van Leeuwen",
      privacyDescription: "Read the privacy policy of hansvanleeuwen.com – how we handle your data, cookies, and analytics.",
    },
  },

  nl: {
    /* ── About ── */
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

    /* ── Navigation ── */
    nav: {
      home: "Home",
      work: "Werk",
      writing: "Artikelen",
      about: "Over mij",
      search: "Zoeken",
      searchPlaceholder: "Zoek pagina's...",
      noResults: "Geen resultaten gevonden.",
      login: "Inloggen",
      portal: "Portal",
    },

    /* ── Hero ── */
    hero: {
      subtitle: "E-commerce Manager · Marketplace Specialist",
      heading: "E-commercegroei realiseren door",
      headingEmphasis: "strategie",
      description:
        "Ik ben Hans van Leeuwen — e-commerce manager gevestigd in Amersfoort, gespecialiseerd in Amazon, Bol.com en marktplaatsgroeistrategieën. Ik help bedrijven digitale kanalen om te zetten in omzetmotoren.",
      ctaWork: "Bekijk mijn werk",
      ctaAbout: "Over mij",
      expertiseLabel: "Wat ik doe",
      expertiseHeading: "E-commerce-expertise die resultaat oplevert",
      expertise: [
        {
          title: "Marktplaatsbeheer",
          description: "Amazon, Bol.com en multi-channel marktplaatsstrategie voor maximale zichtbaarheid en omzet.",
        },
        {
          title: "Groei & Optimalisatie",
          description: "Datagedreven conversieoptimalisatie, A/B-testen en omzetschaling voor e-commercebedrijven.",
        },
        {
          title: "SEO & Contentstrategie",
          description: "Zoekgerichte contentstrategieën die organisch verkeer stimuleren en marktplaatsrankings verbeteren.",
        },
        {
          title: "Digitale Commerce UX",
          description: "User experience design gericht op het verminderen van wrijving en het verhogen van klantwaarde.",
        },
      ],
      linkCases: "Cases →",
      linkWriting: "Artikelen & Inzichten →",
      linkAbout: "Over Hans →",
    },

    /* ── Writing ── */
    writing: {
      label: "Artikelen",
      heading: "Gedachten & Essays",
      subtitle: "Over design, e-commerce, technologie en het leven voorbij het scherm.",
      searchPlaceholder: "Zoek artikelen...",
      newest: "Nieuwste",
      oldest: "Oudste",
      postSingular: "artikel",
      postPlural: "artikelen",
      matching: "gevonden",
      noPostsTitle: "Geen artikelen gevonden met deze filters.",
      clearFilters: "Wis alle filters",
      clear: "Wissen",
      loading: "Laden…",
    },

    /* ── Work ── */
    work: {
      label: "Portfolio & Cases",
      heading: "E-commerce, 3D & UX Designwerk",
      description:
        "Een zorgvuldig samengestelde collectie cases — van Amazon & Bol.com e-commerce UX-concepten tot 3D-creatieve experimenten, VR-games en brandingprojecten. Elk project bevat concrete resultaten en meetbare uitkomsten.",
      projectSingular: "project",
      projectPlural: "projecten",
      matching: "gevonden",
      noProjectsTitle: "Geen projecten in deze categorie.",
      showAll: "Toon alle projecten",
      loading: "Laden…",
    },

    /* ── Privacy ── */
    privacy: {
      title: "Privacybeleid",
      lastUpdated: "Laatst bijgewerkt: februari 2026",
      sections: [
        {
          heading: "1. Wie zijn wij?",
          body: 'Deze website wordt beheerd door Hans van Leeuwen, e-commerce manager gevestigd in Amersfoort, Nederland. Voor vragen over dit privacybeleid kun je contact opnemen via <a href="mailto:hansvl3@gmail.com" class="text-primary underline">hansvl3@gmail.com</a>.',
        },
        {
          heading: "2. Welke gegevens verzamelen wij?",
          body: "Wij verzamelen uitsluitend anonieme analytische gegevens via Google Analytics 4 (GA4), beheerd via Google Tag Manager. Dit omvat onder andere paginaweergaven, sessieduur en apparaattype. Er worden geen persoonsgegevens zoals naam, e-mailadres of IP-adres opgeslagen — IP-anonimisering is standaard ingeschakeld in GA4.",
        },
        {
          heading: "3. Cookies",
          body: "Wij gebruiken analytische cookies uitsluitend na jouw expliciete toestemming (opt-in). Zonder toestemming worden er geen tracking-cookies geplaatst. Je kunt je toestemming op elk moment intrekken door je browsergegevens te wissen.",
        },
        {
          heading: "4. Google Consent Mode v2",
          body: "Deze website maakt gebruik van Google Consent Mode v2. Dit betekent dat alle opslagtypen (analytics, advertenties, personalisatie) standaard worden geweigerd voor bezoekers uit de EER, totdat je actief toestemming geeft.",
        },
        {
          heading: "5. Delen met derden",
          body: 'Wij delen geen persoonsgegevens met derden. Analytische data wordt uitsluitend verwerkt door Google conform hun <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-primary underline">privacybeleid</a>.',
        },
        {
          heading: "6. Je rechten",
          body: "Op grond van de AVG heb je recht op inzage, rectificatie en verwijdering van je gegevens. Aangezien wij geen persoonsgegevens opslaan, is dit in de praktijk niet van toepassing. Voor vragen kun je altijd contact opnemen.",
        },
        {
          heading: "7. Wijzigingen",
          body: "Dit privacybeleid kan worden bijgewerkt. De meest recente versie is altijd beschikbaar op deze pagina.",
        },
      ],
    },

    /* ── Cookie ── */
    cookie: {
      title: "Cookies & Privacy",
      description:
        "Wij gebruiken analytische cookies om het gebruik van de website te begrijpen en te verbeteren. Geen persoonlijke data wordt gedeeld met derden.",
      privacyLink: "Privacybeleid",
      accept: "Accepteren",
      decline: "Weigeren",
      close: "Sluiten",
    },

    /* ── 404 ── */
    notFound: {
      heading: "404",
      message: "Oeps! Pagina niet gevonden",
      returnHome: "Terug naar Home",
    },

    /* ── Breadcrumb ── */
    breadcrumb: { home: "Home" },

    /* ── Footer ── */
    footer: { privacy: "Privacy" },

    /* ── SEO ── */
    seo: {
      homeTitle: "E-commerce Manager & Marketplace Specialist (Amazon & Bol.com) | Hans van Leeuwen",
      homeDescription: "Hans van Leeuwen – E-commerce manager met 10+ jaar ervaring. Marktplaatsgroei op Amazon & Bol.com via strategie, UX-optimalisatie en omzetschaling. Gevestigd in Amersfoort, NL.",
      writingTitle: "E-commerce Inzichten & Artikelen | Hans van Leeuwen",
      writingDescription: "Lees de artikelen van Hans van Leeuwen over e-commercestrategie, marktplaatsoptimalisatie, Amazon & Bol.com groei, UX-design en digitale commercetrends.",
      workTitle: "Designportfolio & Cases | E-commerce, 3D & UX | Hans van Leeuwen",
      workDescription: "Bekijk het portfolio van Hans van Leeuwen: e-commerce UX-cases, 3D-creatief werk, VR-gamedesign en brandingprojecten met meetbare resultaten.",
      privacyTitle: "Privacybeleid | Hans van Leeuwen",
      privacyDescription: "Lees het privacybeleid van hansvanleeuwen.com – hoe we omgaan met je gegevens, cookies en analytics.",
    },
  },
};
