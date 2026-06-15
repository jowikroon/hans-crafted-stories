import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, ChevronRight, Cpu } from "lucide-react";
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
    title: "AI E-commerce Automation — Marketplace Operations on n8n, Supabase & Claude",
    metaDesc:
      "Freelance AI e-commerce automation specialist. Run Amazon NL & Bol.com operations with n8n, Supabase and Claude — product data, ads reporting and content workflows automated. Amersfoort, NL/EU.",
    breadcrumb: "AI E-commerce Automation",
    h1: "AI E-commerce Automation for Amazon & Bol.com",
    subtitle: "Run a full marketplace operation with an automation stack — not a large team",
    intro:
      "Hans van Leeuwen is a freelance e-commerce manager specializing in Amazon, Bol.com, marketplace growth, product data and AI-assisted e-commerce operations. This is the AI-automation practice: pipelines that remove repetitive manual marketplace work and surface decisions faster, with a human in the loop on strategy, pricing and brand voice.",
    layersHeading: "The four automation layers",
    layers: [
      "Product data — feed normalization, enrichment and nightly validation across channels (flag missing EAN/brand/category before a listing breaks)",
      "Operations — stock, pricing and order sync between Amazon NL/DE, Bol.com and the webstore so out-of-stock states propagate in minutes",
      "Advertising — automated ROAS/ACOS reporting and budget alerts instead of weekly manual exports",
      "Intelligence — competitor and ranking monitoring plus weekly KPI reports generated automatically",
    ],
    stackHeading: "The stack",
    stack: [
      "n8n — workflow orchestration (the glue between marketplaces, data and AI)",
      "Supabase — the data layer for product, performance and reporting tables",
      "Claude — content drafting, classification and first-draft analysis",
      "Channable — feed and marketplace sync across Amazon, Bol.com, eBay and the webstore",
    ],
    proofHeading: "Proof — I run my own operations this way",
    proof: [
      { stat: "70%", desc: "market share on Amazon NL in a competitive category (Nielsen-verified)" },
      { stat: "<2%", desc: "out-of-stock rate held through automated demand forecasting" },
      { stat: "2×/wk", desc: "automated SEO + competitor intelligence pipeline running on this very site" },
    ],
    ctaHeading: "Spending hours on manual exports and ad reporting?",
    ctaText:
      "Start with a free automation audit — I map your current manual workload and identify the three highest-ROI workflows to automate first, with a written plan inside 48 hours.",
    ctaButton: "Request your automation audit",
  },
  nl: {
    title: "AI E-commerce Automatisering — Marketplace-operatie op n8n, Supabase & Claude",
    metaDesc:
      "Freelance AI e-commerce automatiseringsspecialist. Draai Amazon NL & Bol.com operaties met n8n, Supabase en Claude — productdata, ads-rapportage en content-workflows geautomatiseerd. Amersfoort, NL/EU.",
    breadcrumb: "AI E-commerce Automatisering",
    h1: "AI E-commerce Automatisering voor Amazon & Bol.com",
    subtitle: "Draai een volledige marketplace-operatie met een automatiseringsstack — geen groot team",
    intro:
      "Hans van Leeuwen is een freelance e-commerce manager gespecialiseerd in Amazon, Bol.com, marketplace-groei, productdata en AI-gedreven e-commerce operaties. Dit is de AI-automatiseringspraktijk: pipelines die repetitief handwerk weghalen en beslissingen sneller zichtbaar maken, met een mens in de lus op strategie, prijs en merkstem.",
    layersHeading: "De vier automatiseringslagen",
    layers: [
      "Productdata — feed-normalisatie, verrijking en nachtelijke validatie over kanalen (signaleer ontbrekende EAN/merk/categorie vóór een listing breekt)",
      "Operatie — voorraad-, prijs- en order-sync tussen Amazon NL/DE, Bol.com en de webshop zodat out-of-stock binnen minuten doorwerkt",
      "Advertising — geautomatiseerde ROAS/ACOS-rapportage en budgetalerts in plaats van wekelijkse handmatige exports",
      "Intelligence — concurrentie- en ranking-monitoring plus wekelijkse KPI-rapporten die automatisch gegenereerd worden",
    ],
    stackHeading: "De stack",
    stack: [
      "n8n — workflow-orkestratie (de lijm tussen marketplaces, data en AI)",
      "Supabase — de datalaag voor product-, performance- en rapportagetabellen",
      "Claude — content schrijven, classificeren en eerste-versie-analyse",
      "Channable — feed- en marketplace-sync over Amazon, Bol.com, eBay en de webshop",
    ],
    proofHeading: "Bewijs — ik draai mijn eigen operaties zo",
    proof: [
      { stat: "70%", desc: "marktaandeel op Amazon NL in een competitieve categorie (Nielsen-geverifieerd)" },
      { stat: "<2%", desc: "out-of-stock rate vastgehouden via geautomatiseerde demand forecasting" },
      { stat: "2×/wk", desc: "geautomatiseerde SEO + concurrentie-intelligence pipeline op deze site" },
    ],
    ctaHeading: "Uren kwijt aan handmatige exports en ads-rapportage?",
    ctaText:
      "Begin met een gratis automatiserings-audit — ik breng je huidige handmatige werklast in kaart en identificeer de drie workflows met de hoogste ROI om eerst te automatiseren, met een geschreven plan binnen 48 uur.",
    ctaButton: "Vraag je automatiserings-audit aan",
  },
};

const FAQ = [
  {
    q: "What is AI e-commerce automation?",
    a: "A set of pipelines — product data, operations, advertising and reporting — that remove repetitive manual marketplace work and speed up decisions, with a human in the loop on strategy, pricing and brand voice. It is not 'an AI that runs your store'; it is concrete, monitored workflows built on n8n, Supabase and Claude.",
  },
  {
    q: "Which platforms and tools does Hans automate?",
    a: "Amazon (NL, DE and other EU marketplaces), Bol.com, eBay and own-store platforms such as Magento, plus the feed and automation layer that connects them — Channable for feeds and n8n for orchestration, with Supabase as the data layer and Claude for content and analysis.",
  },
  {
    q: "Do I need to replace my team?",
    a: "No. Automation removes the repetitive 80% so your team focuses on strategy, merchandising and brand. The human stays in the loop on pricing limits, brand voice and final decisions.",
  },
  {
    q: "How does an engagement start?",
    a: "With a free automation audit: Hans maps your current manual workload and returns a prioritized plan within 48 hours, identifying the three highest-ROI workflows to automate first.",
  },
  {
    q: "Is my data and account access safe?",
    a: "Pipelines run on your own infrastructure and accounts; marketplace credentials are never shared in plain text. The automation layer is auditable and you keep full control of access.",
  },
];

const AiEcommerceAutomation = () => {
  const { lang } = useLang();
  const t = content[lang];

  useSEO({
    title: t.title,
    description: t.metaDesc,
    url: "https://hansvanleeuwen.com/ai-ecommerce-automation",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/ai-ecommerce-automation" },
      { lang: "nl", href: "https://hansvanleeuwen.com/ai-ecommerce-automation" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/ai-ecommerce-automation" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          url: "https://hansvanleeuwen.com/ai-ecommerce-automation",
          name: t.title,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@id": "https://hansvanleeuwen.com/#person" },
          inLanguage: lang === "nl" ? "nl" : "en",
        },
        {
          "@type": "Service",
          name: "AI E-commerce Automation",
          provider: { "@id": "https://hansvanleeuwen.com/#organization" },
          areaServed: { "@type": "Country", name: "Netherlands" },
          description: t.metaDesc,
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: "https://hansvanleeuwen.com/ai-ecommerce-automation" },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Cpu size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">AI E-commerce</p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.layersHeading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.layers.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.stackHeading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.stack.map((item, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.proofHeading}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {t.proof.map((r, i) => (
            <div key={i} className="rounded-xl border-2 border-border/40 bg-card p-6 text-center">
              <p className="mb-2 font-display text-3xl font-bold text-primary">{r.stat}</p>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lang === "nl" ? "Veelgestelde vragen" : "Frequently asked questions"}
        </h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-lg border border-border/40 bg-card p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.ctaHeading}</h2>
        <p className="mb-6 max-w-xl mx-auto text-sm text-muted-foreground">{t.ctaText}</p>
        <a href="mailto:hansvl3@gmail.com?subject=AI E-commerce Automation Audit" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:gap-3 hover:shadow-lg">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-6 text-xs text-muted-foreground/60">
          <Link to="/work" className="underline hover:text-foreground">{lang === "nl" ? "Bekijk case studies" : "View case studies"}</Link>
          {" · "}
          <Link to="/amazon-nl-specialist" className="underline hover:text-foreground">{lang === "nl" ? "Amazon NL specialist" : "Amazon NL specialist"}</Link>
          {" · "}
          <Link to="/bol-com-consultant" className="underline hover:text-foreground">{lang === "nl" ? "Bol.com consultant" : "Bol.com consultant"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default AiEcommerceAutomation;
