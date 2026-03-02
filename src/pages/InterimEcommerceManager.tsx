import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, ChevronRight, Briefcase } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";

const fade = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const,
};

const content = {
  en: {
    title: "Interim E-commerce Manager — Freelance Marketplace Lead (NL/EU)",
    metaDesc: "Interim e-commerce manager for Amazon NL & Bol.com. Hands-on marketplace leadership, operations & KPI-driven growth. 10+ years, based in Amersfoort, Netherlands.",
    breadcrumb: "Interim E-commerce Manager",
    h1: "Interim E-commerce Manager",
    subtitle: "Freelance marketplace lead — strategy, operations & hands-on execution",
    intro: "Need senior e-commerce leadership without the permanent headcount? I step in as your interim e-commerce manager — driving marketplace strategy, managing daily operations, and delivering KPI-driven growth on Amazon NL, Bol.com, and beyond.",
    whenToHire: "When to Bring in an Interim E-commerce Manager",
    scenarios: [
      "You need to fix ACOS and restructure ad campaigns fast",
      "Your marketplace listings are underperforming and need a strategic overhaul",
      "You're launching on Amazon NL or Bol.com and need expert guidance",
      "Your e-commerce manager left and you need immediate coverage",
      "You want to transition from vendor to seller model",
      "You need forecasting to prevent costly stockouts",
    ],
    services: [
      "Full marketplace P&L ownership and reporting",
      "Team management and cross-functional coordination",
      "Amazon & Bol.com channel strategy and execution",
      "Advertising budget management and ROAS optimization",
      "KPI dashboard setup (Looker Studio, GA4, platform analytics)",
      "Vendor and agency relationship management",
      "Weekly stakeholder reporting and strategic reviews",
      "Process documentation and knowledge transfer",
    ],
    ctaHeading: "Need an interim e-commerce lead?",
    ctaText: "Let's discuss your situation — I'll share how I can help within a 30-minute introductory call. No obligation.",
    ctaButton: "Schedule a 30-min call",
  },
  nl: {
    title: "Interim E-commerce Manager — Freelance Marktplaats Lead (NL/EU)",
    metaDesc: "Interim e-commerce manager voor Amazon NL & Bol.com. Hands-on marktplaats leiderschap, operations & KPI-gedreven groei. 10+ jaar, gevestigd in Amersfoort.",
    breadcrumb: "Interim E-commerce Manager",
    h1: "Interim E-commerce Manager",
    subtitle: "Freelance marktplaats lead — strategie, operations & hands-on uitvoering",
    intro: "Senior e-commerce leiderschap nodig zonder vast dienstverband? Ik stap in als je interim e-commerce manager — ik stuur marktplaatsstrategie aan, beheer dagelijkse operations en lever KPI-gedreven groei op Amazon NL, Bol.com en daarbuiten.",
    whenToHire: "Wanneer een Interim E-commerce Manager Inschakelen",
    scenarios: [
      "Je moet ACOS fixen en advertentiecampagnes snel herstructureren",
      "Je marketplace listings presteren ondermaats en hebben een strategische revisie nodig",
      "Je lanceert op Amazon NL of Bol.com en hebt expertbegeleiding nodig",
      "Je e-commerce manager is vertrokken en je hebt directe vervanging nodig",
      "Je wilt overstappen van vendor naar seller model",
      "Je hebt forecasting nodig om kostbare stockouts te voorkomen",
    ],
    services: [
      "Volledig marktplaats P&L eigenaarschap en rapportage",
      "Teammanagement en cross-functionele coördinatie",
      "Amazon & Bol.com kanaalstrategie en uitvoering",
      "Advertentiebudget beheer en ROAS optimalisatie",
      "KPI dashboard opzet (Looker Studio, GA4, platform analytics)",
      "Leverancier- en bureaurelatie management",
      "Wekelijkse stakeholder rapportage en strategische reviews",
      "Procesdocumentatie en kennisoverdracht",
    ],
    ctaHeading: "Een interim e-commerce lead nodig?",
    ctaText: "Laten we je situatie bespreken — ik deel hoe ik kan helpen in een kennismakingsgesprek van 30 minuten. Vrijblijvend.",
    ctaButton: "Plan een 30-min gesprek",
  },
};

const InterimEcommerceManager = () => {
  const { lang } = useLang();
  const t = content[lang];

  useSEO({
    title: t.title,
    description: t.metaDesc,
    url: "https://hansvanleeuwen.com/interim-ecommerce-manager",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
      { lang: "nl", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          url: "https://hansvanleeuwen.com/interim-ecommerce-manager",
          name: t.title,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@id": "https://hansvanleeuwen.com/#person" },
          inLanguage: lang === "nl" ? "nl" : "en",
        },
        {
          "@type": "Service",
          name: "Interim E-commerce Management",
          provider: { "@id": "https://hansvanleeuwen.com/#organization" },
          areaServed: [
            { "@type": "Country", name: "Netherlands" },
            { "@type": "Place", name: "European Union" },
          ],
          description: t.metaDesc,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: "https://hansvanleeuwen.com/interim-ecommerce-manager" },
          ],
        },
      ],
    },
  });

  return (
    <section className="relative section-container pt-28 pb-20">
      <motion.nav {...fade} className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground"><Home size={12} /><span>Home</span></Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{t.breadcrumb}</span>
      </motion.nav>

      <motion.div {...fade}>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Briefcase size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">{lang === "nl" ? "Interim & Freelance" : "Interim & Freelance"}</p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.whenToHire}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.scenarios.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lang === "nl" ? "Wat Ik Lever als Interim Lead" : "What I Deliver as Interim Lead"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.services.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.ctaHeading}</h2>
        <p className="mb-6 max-w-xl mx-auto text-sm text-muted-foreground">{t.ctaText}</p>
        <a href="mailto:hansvl3@gmail.com?subject=Interim E-commerce Manager Inquiry" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:gap-3 hover:shadow-lg">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-6 text-xs text-muted-foreground/60">
          <Link to="/work" className="underline hover:text-foreground">{lang === "nl" ? "Bekijk case studies" : "View case studies"}</Link>
          {" · "}
          <Link to="/amazon-nl-specialist" className="underline hover:text-foreground">{lang === "nl" ? "Amazon NL diensten" : "Amazon NL services"}</Link>
          {" · "}
          <Link to="/bol-com-consultant" className="underline hover:text-foreground">{lang === "nl" ? "Bol.com diensten" : "Bol.com services"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default InterimEcommerceManager;
