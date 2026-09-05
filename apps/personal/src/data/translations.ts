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
    music: string;
    about: string;
    commandCenter: string;
    search: string;
    searchPlaceholder: string;
    noResults: string;
    login: string;
    portal: string;
    workMenu: { allCases: string; services: string; amazon: string; bol: string; interim: string };
    workspace: { label: string; blogCms: string; samantha: string; portal: string; docs: string; dashboard: string; signOut: string; dashboards: string; dashCcp: string; dashHvl: string; dashMpg: string };
    cms: { write: string; manage: string; analytics: string };
  };

  /* ── Hero / Home ── */
  hero: {
    subtitle: string;
    heading: string;
    headingEmphasis: string;
    freelanceH2: string;
    description: string;
    location: string;
    ctaWork: string;
    ctaConsult: string;
    ctaAbout: string;
    resultsLabel: string;
    results: string[];
    resultsDetail: string[];
    whoIHelpLabel: string;
    whoIHelpHeading: string;
    whoIHelp: string[];
    problemsLabel: string;
    problemsHeading: string;
    problems: string[];
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
    relatedHeading: string;
    linkWork: string;
    linkAbout: string;
    linkAmazonNl: string;
    linkBolCom: string;
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
    relatedHeading: string;
    linkWriting: string;
    linkAbout: string;
    linkAmazonNl: string;
    linkBolCom: string;
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

  /* ── Contact form ── */
  contact: {
    heading: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    reason: string;
    reasonPlaceholder: string;
    reasonFreelance: string;
    reasonJob: string;
    reasonCollaboration: string;
    reasonGeneral: string;
    message: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    successMessage: string;
    errorMessage: string;
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
    aboutTitle: string;
    aboutDescription: string;
    notFoundTitle: string;
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
      "E-commerce Manager with 10+ years of experience accelerating digital commerce performance across marketplaces and D2C channels. Specializing in Amazon, Bol.com, AI-assisted e-commerce automation, and scalable revenue growth strategies.",
      "I combine a strong background in UX design with hands-on commercial expertise to create data-driven strategies that deliver measurable results. From achieving 70% market share on Amazon NL to cutting out-of-stock rates below 2%, I turn complexity into growth.",
    ],
    experienceList: [
      {
        company: "ABS All Brake Systems",
        role: "E-commerce Manager",
        period: "Dec 2025 – Present",
        highlights: [
          "Automated VIN-based part lookup, a first in the industry",
          "Connected eBay, Amazon and Bol.com into one marketplace operation",
          "Forecasting revenue and delivering actionable KPI insights",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "Marketplace Manager",
        period: "Feb 2022 – Dec 2025",
        highlights: [
          "Achieved 70% market share in the earplug category on Amazon NL (Nielsen, 2023)",
          "20% more weekly sales with a Back-to-School social ad campaign; A/B-tested images lifted conversion",
          "Less Buy Box price volatility through B2B channel alignment; market analysis with Helium10 and Nielsen",
          "Launched the Bol.com seller channel, transitioning from vendor to seller",
          "Automated marketplace content via Channable integration",
          "As e-commerce manager (Oct 2021 – Feb 2022): out-of-stock below 2%, logistics and customer service (NPS) restructured",
        ],
      },
      {
        company: "Webhelp",
        role: "Team Coach",
        period: "Feb 2020 – Feb 2022",
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
          "Organic visibility +35% and conversion +15% through SEO strategy and PPC campaigns",
          "Product content, attributes, filtering and site mapping improved for badkamerwinkel.nl/.be",
        ],
      },
      {
        company: "Intergamma (Karwei & Gamma)",
        role: "E-Commerce Manager",
        period: "Feb 2016 – Aug 2019",
        highlights: [
          "Organic traffic +40% through SEO optimisation of the KARWEI.nl, Gamma.nl and Gamma.be catalogues",
          "Targeted advertising campaigns for higher engagement; company-wide e-commerce and catalogue training",
          "Assistant e-commerce manager (Feb 2017 – Jan 2019), e-commerce manager from 2019",
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
        degree: "B.A.Sc. Communication & Media Studies, User Experience specialisation",
        period: "2012 – 2016",
      },
      {
        institution: "ROC Hilversum",
        degree: "MBO – ICT Manager (CCNA, VMware Certified)",
        period: "2007 – 2011",
      },
      {
        institution: "Google",
        degree: "Foundations of Digital Marketing and E-commerce · Foundations of Project Management",
        period: "certifications",
      },
    ],

    /* ── Navigation ── */
    nav: {
      home: "Home",
      work: "Portfolio",
      writing: "Articles",
      music: "Music",
      about: "About Hans",
      commandCenter: "Command Center",
      search: "Search",
      searchPlaceholder: "Search pages...",
      noResults: "No results found.",
      login: "Login",
      portal: "Portal",
      workMenu: { allCases: "Full portfolio", services: "Services", amazon: "Amazon NL Specialist", bol: "Bol.com Consultant", interim: "Interim E-commerce Manager" },
      workspace: { label: "Workspace", blogCms: "Blog CMS", samantha: "Samantha AI", portal: "Portal", docs: "Docs", dashboard: "Dashboard", signOut: "Sign out", dashboards: "Dashboards", dashCcp: "Connect Car Parts", dashHvl: "Hans van Leeuwen", dashMpg: "Marketplace Growth" },
      cms: { write: "Write", manage: "Manage", analytics: "Analytics" },
    },

    /* ── Hero ── */
    hero: {
      subtitle: "Freelance E-commerce Manager · Amazon & Bol.com Specialist",
      heading: "Driving marketplace growth through",
      headingEmphasis: "strategy",
      freelanceH2: "Grow Amazon NL & Bol.com revenue with a hands-on interim marketplace lead",
      description:
        "I'm Hans van Leeuwen, a freelance e-commerce and marketplace manager based in Amersfoort. After ten years growing Amazon and Bol.com revenue for brands, I know where marketplace growth actually comes from: sharp listings, disciplined ads, and reliable operations. I help brands across the Netherlands and EU turn their digital channels into revenue engines.",
      location: "Based in Amersfoort, Netherlands · Working with brands across Amsterdam, Utrecht, Rotterdam & the wider EU",
      ctaWork: "View portfolio & case studies",
      ctaConsult: "Contact me",
      ctaAbout: "About me",
      resultsLabel: "Proven results",
      results: [
        "70% market share on Amazon NL (earplug category, Nielsen Data)",
        "20% more weekly sales from a targeted Back-to-School social ad campaign",
        "Out-of-stock rates below 2% through forecasting & logistics",
      ],
      resultsDetail: [
        "Challenge: Competitive earplug category on Amazon NL (Alpine Hearing Protection). Action: Listing overhaul, A+ content, A/B-tested images and Buy Box alignment with B2B channels. Result: 70% category market share (Nielsen, 2023).",
        "Challenge: Flat weekly marketplace sales around the school season. Action: Built a targeted Back-to-School social ad campaign on top of optimised listings (Alpine Hearing Protection). Result: 20% more weekly sales.",
        "Challenge: Frequent stockouts hurting Buy Box. Action: Built demand forecasting model and optimized logistics. Result: Out-of-stock rate reduced to below 2%.",
      ],
      whoIHelpLabel: "Who I help",
      whoIHelpHeading: "Brands I work with",
      whoIHelp: [
        "D2C brands scaling into Amazon & Bol.com",
        "Category leaders defending market share on marketplaces",
        "Brands entering the Dutch & EU marketplace landscape",
        "Companies seeking an interim e-commerce manager or marketplace strategist",
      ],
      problemsLabel: "Problems I solve",
      problemsHeading: "Common challenges I tackle",
      problems: [
        "High ACOS eating into ad profitability",
        "Low conversion rates on product detail pages",
        "Stockouts and Buy Box loss due to poor forecasting",
        "Listing suppression and catalog compliance issues",
        "Weak organic ranking and poor indexing on Amazon or Bol.com",
        "No clear marketplace strategy or KPI framework",
      ],
      expertiseLabel: "Amazon & Bol.com Services",
      expertiseHeading: "Amazon & Bol.com Marketplace Management (NL/EU)",
      expertise: [
        {
          title: "Amazon Marketplace Management",
          description: "Listing optimization, A+ content, Amazon Ads (Sponsored Products, Brands, Display), pricing strategy, and operations. Your Amazon NL specialist for scalable growth.",
        },
        {
          title: "Bol.com Optimization",
          description: "Content optimization, Bol Ads management, catalog management, and performance analytics. Hands-on Bol.com consultant for the Netherlands' largest marketplace.",
        },
        {
          title: "Marketplace CRO & Growth",
          description: "Data-driven conversion rate optimization (CRO), A/B testing, and revenue scaling. Reduce friction, improve Buy Box win rate, and grow profitably.",
        },
        {
          title: "SEO & Content Strategy",
          description: "Search-first content strategies that drive organic traffic and improve marketplace rankings. UX design focused on reducing friction and increasing conversions.",
        },
      ],
      linkCases: "Portfolio & Amazon NL case studies →",
      linkWriting: "Amazon & Bol.com optimization articles →",
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
      relatedHeading: "Related",
      linkWork: "Portfolio & case studies",
      linkAbout: "About Hans",
      linkAmazonNl: "Amazon NL specialist",
      linkBolCom: "Bol.com consultant",
    },

    /* ── Work ── */
    work: {
      label: "Portfolio",
      heading: "Design, UX & e-commerce work",
      description:
        "A decade of design-driven e-commerce. UX and interaction design, 3D, VR and creative work, alongside Amazon NL & Bol.com case studies with measurable results.",
      projectSingular: "project",
      projectPlural: "projects",
      matching: "matching",
      noProjectsTitle: "No projects in this category.",
      showAll: "Show all projects",
      loading: "Loading…",
      relatedHeading: "Related",
      linkWriting: "E-commerce insights & articles",
      linkAbout: "About Hans",
      linkAmazonNl: "Amazon NL specialist",
      linkBolCom: "Bol.com consultant",
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
          body: "We only collect anonymous analytical data via Google Analytics 4 (GA4), managed through Google Tag Manager. This includes page views, session duration, and device type. No personal data such as names, email addresses, or IP addresses is stored, IP anonymization is enabled by default in GA4.",
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

    /* ── Contact form ── */
    contact: {
      heading: "Get in Touch",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your@email.com",
      reason: "Reason for Contact",
      reasonPlaceholder: "Select a reason…",
      reasonFreelance: "Freelance / Project Inquiry",
      reasonJob: "Job Opportunity",
      reasonCollaboration: "Speaking / Collaboration",
      reasonGeneral: "General Question",
      message: "Message",
      messagePlaceholder: "Tell me more…",
      send: "Send Message",
      sending: "Sending…",
      successMessage: "Message sent! I'll get back to you soon.",
      errorMessage: "Something went wrong. Please try again.",
    },

    /* ── SEO ── */
    seo: {
      homeTitle: "Freelance E-commerce Manager for Amazon & Bol.com (NL/EU) | Hans van Leeuwen",
      homeDescription: "Freelance e-commerce & marketplace manager, 10+ years on Amazon NL/DE & Bol.com: 70% category share (Nielsen 2023), out-of-stock under 2%, AI-assisted operations on n8n, Channable & Claude. Amersfoort, NL/EU.",
      writingTitle: "E-commerce Insights for Amazon NL & Bol.com | Hans van Leeuwen",
      writingDescription: "Articles on marketplace strategy, Amazon NL & Bol.com optimization, CRO, and UX. Netherlands/EU.",
      workTitle: "Amazon & Bol.com Case Studies: Marketplace Growth Portfolio | Hans van Leeuwen",
      workDescription: "Documented marketplace results by e-commerce & marketplace manager Hans van Leeuwen: Amazon NL/DE, Bol.com and e-commerce operations case studies, including Connect Car Parts (A.B.S. brake parts on Amazon DE, eBay DE and Magento).",
      privacyTitle: "Privacy Policy | Hans van Leeuwen",
      privacyDescription: "Read the privacy policy of hansvanleeuwen.com – how we handle your data, cookies, and analytics.",
      aboutTitle: "About Hans van Leeuwen – Interim E-commerce Manager & Marketplace Specialist",
      aboutDescription: "Interim e-commerce manager and marketplace specialist with 10+ years of experience in Amazon, Bol.com, marketplace strategy and AI-assisted digital commerce. Based in Amersfoort, NL.",
      notFoundTitle: "Page Not Found | Hans van Leeuwen",
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
      "Ik combineer een sterke achtergrond in UX-design met hands-on commerciële expertise om datagedreven strategieën te creëren die meetbare resultaten opleveren. Van 70% marktaandeel op Amazon NL tot het terugbrengen van out-of-stock rates onder de 2%, ik zet complexiteit om in groei.",
    ],
    experienceList: [
      {
        company: "ABS All Brake Systems",
        role: "E-commerce Manager",
        period: "Dec 2025 – Heden",
        highlights: [
          "VIN-gebaseerde onderdelen-lookup geautomatiseerd, een primeur in de branche",
          "eBay, Amazon en Bol.com verbonden tot één marketplace-operatie",
          "Omzetprognoses en leveren van actionable KPI-inzichten",
        ],
      },
      {
        company: "Alpine Hearing Protection",
        role: "Marketplace Manager",
        period: "Feb 2022 – Dec 2025",
        highlights: [
          "70% marktaandeel in de oordoppencategorie op Amazon NL (Nielsen, 2023)",
          "20% meer wekelijkse verkopen met een Back-to-School social-ad-campagne; A/B-tests op afbeeldingen verhoogden de conversie",
          "Minder prijsvolatiliteit in de Buy Box door B2B-afstemming; marktdata-analyse met Helium10 en Nielsen",
          "Bol.com-sellerkanaal gelanceerd, transitie van vendor naar seller",
          "Marketplace-content geautomatiseerd via Channable-integratie",
          "Als e-commerce manager (okt 2021 – feb 2022): out-of-stock onder 2%, logistiek en klantenservice (NPS) opnieuw ingericht",
        ],
      },
      {
        company: "Webhelp",
        role: "Team Coach",
        period: "Feb 2020 – Feb 2022",
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
          "Organische zichtbaarheid +35% en conversie +15% door SEO-strategie en PPC-campagnes",
          "Productcontent, attributen, filtering en sitemapping verbeterd voor badkamerwinkel.nl/.be",
        ],
      },
      {
        company: "Intergamma (Karwei & Gamma)",
        role: "E-Commerce Manager",
        period: "Feb 2016 – Aug 2019",
        highlights: [
          "Organisch verkeer +40% door SEO-optimalisatie van de catalogi van KARWEI.nl, Gamma.nl en Gamma.be",
          "Gerichte advertentiecampagnes voor hogere betrokkenheid; bedrijfsbrede e-commerce- en catalogustraining",
          "Assistent e-commerce manager (feb 2017 – jan 2019), e-commerce manager vanaf 2019",
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
        degree: "B.A.Sc. Communication & Media Studies, specialisatie User Experience",
        period: "2012 – 2016",
      },
      {
        institution: "ROC Hilversum",
        degree: "MBO – ICT Beheerder (CCNA, VMware Certified)",
        period: "2007 – 2011",
      },
      {
        institution: "Google",
        degree: "Foundations of Digital Marketing and E-commerce · Foundations of Project Management",
        period: "certificeringen",
      },
    ],

    /* ── Navigation ── */
    nav: {
      home: "Home",
      work: "Portfolio",
      writing: "Artikelen",
      music: "Muziek",
      about: "Over mij",
      commandCenter: "Command Center",
      search: "Zoeken",
      searchPlaceholder: "Zoek pagina's...",
      noResults: "Geen resultaten gevonden.",
      login: "Inloggen",
      portal: "Portal",
      workMenu: { allCases: "Volledig portfolio", services: "Diensten", amazon: "Amazon NL Specialist", bol: "Bol.com Consultant", interim: "Interim E-commerce Manager" },
      workspace: { label: "Werkruimte", blogCms: "Blog CMS", samantha: "Samantha AI", portal: "Portal", docs: "Docs", dashboard: "Dashboard", signOut: "Uitloggen", dashboards: "Dashboards", dashCcp: "Connect Car Parts", dashHvl: "Hans van Leeuwen", dashMpg: "Marketplace Growth" },
      cms: { write: "Schrijven", manage: "Beheren", analytics: "Analytics" },
    },

    /* ── Hero ── */
    hero: {
      subtitle: "Freelance E-commerce Manager · Amazon & Bol.com Specialist",
      heading: "Marktplaatsgroei realiseren door",
      headingEmphasis: "strategie",
      freelanceH2: "Groei Amazon NL & Bol.com omzet met een hands-on interim marktplaatsmanager",
      description:
        "Laat je omzet op Amazon NL & Bol.com groeien met een ervaren interim marketplace manager. Ik ben Hans van Leeuwen, freelance e-commerce en marketplace specialist gevestigd in Amersfoort. Na tien jaar omzetgroei op Amazon en Bol.com voor diverse merken, weet ik exact hoe je marktplaatsen omzet in winstgevende groeikanalen: strakke productlistings, scherpe advertenties en betrouwbare operations.",
      location: "Gevestigd in Amersfoort, Nederland · Werkzaam voor merken in Amsterdam, Utrecht, Rotterdam & de rest van de EU",
      ctaWork: "Bekijk portfolio & cases",
      ctaConsult: "Neem contact op met mij",
      ctaAbout: "Over mij",
      resultsLabel: "Bewezen resultaten",
      results: [
        "70% marktaandeel op Amazon NL (oordopjescategorie, Nielsen Data)",
        "20% meer wekelijkse verkopen door een gerichte Back-to-School social-ad-campagne",
        "Out-of-stock rate onder de 2% dankzij verbeterde forecasting & logistiek",
      ],
      resultsDetail: [
        "Uitdaging: Concurrerende oordoppencategorie op Amazon NL (Alpine Hearing Protection). Actie: Listings herbouwd, A+ content, A/B-tests op afbeeldingen en Buy Box-afstemming met B2B-kanalen. Resultaat: 70% categoriemarktaandeel (Nielsen, 2023).",
        "Uitdaging: Vlakke wekelijkse marketplace-omzet rond het schoolseizoen. Actie: Gerichte Back-to-School social-ad-campagne bovenop geoptimaliseerde listings (Alpine Hearing Protection). Resultaat: 20% meer wekelijkse verkopen.",
        "Uitdaging: Frequente stockouts met Buy Box-verlies. Actie: Vraagvoorspellingsmodel gebouwd en logistiek geoptimaliseerd. Resultaat: Out-of-stock rate onder de 2%.",
      ],
      whoIHelpLabel: "Voor wie ik werk",
      whoIHelpHeading: "Merken waarmee ik werk",
      whoIHelp: [
        "D2C-merken die opschalen naar Amazon & Bol.com",
        "Categorieleiders die marktaandeel verdedigen op marktplaatsen",
        "Merken die de Nederlandse & Europese marktplaats betreden",
        "Bedrijven op zoek naar een interim e-commerce manager of marktplaatsstrateeg",
      ],
      problemsLabel: "Problemen die ik oplos",
      problemsHeading: "Veelvoorkomende uitdagingen die ik aanpak",
      problems: [
        "Hoge ACOS die advertentiewinst opeet",
        "Lage conversieratio's op productdetailpagina's",
        "Stockouts en Buy Box-verlies door slechte forecasting",
        "Listing-suppressie en catalogus-complianceproblemen",
        "Zwakke organische ranking en slechte indexering op Amazon of Bol.com",
        "Geen duidelijke marktplaatsstrategie of KPI-framework",
      ],
      expertiseLabel: "Amazon & Bol.com Diensten",
      expertiseHeading: "Amazon & Bol.com Marktplaatsbeheer (NL/EU)",
      expertise: [
        {
          title: "Amazon Marktplaatsbeheer",
          description: "Listing-optimalisatie, A+-content, Amazon Ads (Sponsored Products, Brands, Display), prijsstrategie en operations. Uw Amazon NL specialist voor schaalbare groei.",
        },
        {
          title: "Bol.com Optimalisatie",
          description: "Content-optimalisatie, Bol Ads-beheer, catalogusbeheer en prestatieanalytics. Hands-on Bol.com consultant voor de grootste Nederlandse marktplaats.",
        },
        {
          title: "Marktplaats CRO & Groei",
          description: "Datagedreven conversie-optimalisatie (CRO), A/B-testen en omzetschaling. Verminder frictie, verbeter Buy Box-winrate en groei winstgevend.",
        },
        {
          title: "SEO & Contentstrategie",
          description: "Zoekgerichte contentstrategieën die organisch verkeer stimuleren en marktplaatsrankings verbeteren. UX-design gericht op frictieverlaging en hogere conversies.",
        },
      ],
      linkCases: "Portfolio & Amazon NL cases →",
      linkWriting: "Amazon & Bol.com optimalisatie artikelen →",
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
      relatedHeading: "Gerelateerd",
      linkWork: "Portfolio & cases",
      linkAbout: "Over Hans",
      linkAmazonNl: "Amazon NL specialist",
      linkBolCom: "Bol.com consultant",
    },

    /* ── Work ── */
    work: {
      label: "Portfolio",
      heading: "Design, UX & e-commerce werk",
      description:
        "Tien jaar design-gedreven e-commerce. UX- en interactieontwerp, 3D-, VR- en creatief werk, naast Amazon NL & Bol.com cases met meetbaar resultaat.",
      projectSingular: "project",
      projectPlural: "projecten",
      matching: "gevonden",
      noProjectsTitle: "Geen projecten in deze categorie.",
      showAll: "Toon alle projecten",
      loading: "Laden…",
      relatedHeading: "Gerelateerd",
      linkWriting: "E-commerce inzichten & artikelen",
      linkAbout: "Over Hans",
      linkAmazonNl: "Amazon NL specialist",
      linkBolCom: "Bol.com consultant",
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
          body: "Wij verzamelen uitsluitend anonieme analytische gegevens via Google Analytics 4 (GA4), beheerd via Google Tag Manager. Dit omvat onder andere paginaweergaven, sessieduur en apparaattype. Er worden geen persoonsgegevens zoals naam, e-mailadres of IP-adres opgeslagen, IP-anonimisering is standaard ingeschakeld in GA4.",
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

    /* ── Contact form ── */
    contact: {
      heading: "Contact",
      name: "Naam",
      namePlaceholder: "Je naam",
      email: "E-mail",
      emailPlaceholder: "je@email.com",
      reason: "Reden voor contact",
      reasonPlaceholder: "Selecteer een reden…",
      reasonFreelance: "Freelance / Projectaanvraag",
      reasonJob: "Vacature",
      reasonCollaboration: "Spreken / Samenwerking",
      reasonGeneral: "Algemene vraag",
      message: "Bericht",
      messagePlaceholder: "Vertel me meer…",
      send: "Verstuur bericht",
      sending: "Verzenden…",
      successMessage: "Bericht verzonden! Ik neem snel contact op.",
      errorMessage: "Er ging iets mis. Probeer het opnieuw.",
    },

    /* ── SEO ── */
    seo: {
      homeTitle: "Freelance E-commerce Manager inhuren voor Amazon & Bol.com | Hans van Leeuwen",
      homeDescription: "Freelance e-commerce & marketplace manager inhuren: 10+ jaar Amazon NL/DE & Bol.com, 70% categoriemarktaandeel (Nielsen 2023), out-of-stock onder 2%, AI-automatisering met n8n, Channable & Claude. Amersfoort, NL/EU.",
      writingTitle: "E-commerce Inzichten voor Amazon NL & Bol.com | Hans van Leeuwen",
      writingDescription: "Artikelen over marketplace-strategie, Amazon NL & Bol.com optimalisatie, CRO en UX. Nederland/EU.",
      workTitle: "Amazon & Bol.com case studies: portfolio marktplaatsgroei | Hans van Leeuwen",
      workDescription: "Gedocumenteerde marktplaatsresultaten van e-commerce & marketplace manager Hans van Leeuwen: case studies Amazon NL/DE, Bol.com en e-commerce-operaties, waaronder Connect Car Parts (A.B.S.-remonderdelen op Amazon DE, eBay DE en Magento).",
      privacyTitle: "Privacybeleid | Hans van Leeuwen",
      privacyDescription: "Lees het privacybeleid van hansvanleeuwen.com – hoe we omgaan met je gegevens, cookies en analytics.",
      aboutTitle: "Over Hans van Leeuwen – Interim E-commerce Manager & Marketplace Specialist",
      aboutDescription: "Interim e-commerce manager en marketplace specialist met 10+ jaar ervaring in Amazon, Bol.com, marktplaatsstrategie en digitale commerce. Gevestigd in Amersfoort, NL.",
      notFoundTitle: "Pagina Niet Gevonden | Hans van Leeuwen",
    },
  },
};
