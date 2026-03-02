import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, ChevronRight, ShoppingCart } from "lucide-react";
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
    title: "Amazon NL Specialist — Freelance Amazon Netherlands Account Manager",
    metaDesc: "Freelance Amazon NL specialist & account manager. Listings, A+ content, Sponsored Products & Brands, Buy Box optimization. 10+ years, based in Amersfoort.",
    breadcrumb: "Amazon NL Specialist",
    h1: "Amazon NL Specialist",
    subtitle: "Freelance Amazon Netherlands account manager — listings, ads & growth",
    intro: "I help brands sell more on Amazon Netherlands through optimized listings, data-driven advertising, and strategic account management. From launch to scale — hands-on, measurable, and results-focused.",
    services: [
      "Product listing optimization (titles, bullets, backend keywords, images)",
      "A+ Content / Enhanced Brand Content creation",
      "Amazon Ads: Sponsored Products, Sponsored Brands, Sponsored Display",
      "Buy Box strategy & pricing optimization",
      "Catalog management & listing suppression resolution",
      "Amazon SEO & keyword research for NL market",
      "Competitor analysis & category benchmarking",
      "Inventory planning & demand forecasting",
    ],
    results: [
      { stat: "70%", desc: "market share in earplug category on Amazon NL (Nielsen Data)" },
      { stat: "<2%", desc: "out-of-stock rate through improved demand forecasting" },
      { stat: "20%", desc: "weekly sales increase via targeted Sponsored campaigns" },
    ],
    ctaHeading: "Ready to grow on Amazon Netherlands?",
    ctaText: "Get a free 7-point Amazon NL audit — I'll identify your top growth opportunities within 48 hours.",
    ctaButton: "Request your Amazon audit",
  },
  nl: {
    title: "Amazon NL Specialist — Freelance Amazon Nederland Accountmanager",
    metaDesc: "Freelance Amazon NL specialist & accountmanager. Listings, A+ content, Sponsored Products & Brands, Buy Box optimalisatie. 10+ jaar, gevestigd in Amersfoort.",
    breadcrumb: "Amazon NL Specialist",
    h1: "Amazon NL Specialist",
    subtitle: "Freelance Amazon Nederland accountmanager — listings, ads & groei",
    intro: "Ik help merken meer te verkopen op Amazon Nederland door geoptimaliseerde listings, datagedreven advertenties en strategisch accountmanagement. Van lancering tot schaling — hands-on, meetbaar en resultaatgericht.",
    services: [
      "Productlisting optimalisatie (titels, bullets, backend keywords, afbeeldingen)",
      "A+ Content / Enhanced Brand Content creatie",
      "Amazon Ads: Sponsored Products, Sponsored Brands, Sponsored Display",
      "Buy Box strategie & prijsoptimalisatie",
      "Catalogusbeheer & listing suppressie oplossen",
      "Amazon SEO & keywordonderzoek voor de NL-markt",
      "Concurrentie-analyse & categorie-benchmarking",
      "Voorraadplanning & demand forecasting",
    ],
    results: [
      { stat: "70%", desc: "marktaandeel in oordoppencategorie op Amazon NL (Nielsen Data)" },
      { stat: "<2%", desc: "out-of-stock rate dankzij verbeterde demand forecasting" },
      { stat: "20%", desc: "wekelijkse omzetstijging via gerichte Sponsored campagnes" },
    ],
    ctaHeading: "Klaar om te groeien op Amazon Nederland?",
    ctaText: "Ontvang een gratis 7-punts Amazon NL audit — ik identificeer je grootste groeikansen binnen 48 uur.",
    ctaButton: "Vraag je Amazon audit aan",
  },
};

const AmazonNlSpecialist = () => {
  const { lang } = useLang();
  const t = content[lang];

  useSEO({
    title: t.title,
    description: t.metaDesc,
    url: "https://hansvanleeuwen.com/amazon-nl-specialist",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/amazon-nl-specialist" },
      { lang: "nl", href: "https://hansvanleeuwen.com/amazon-nl-specialist" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/amazon-nl-specialist" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          url: "https://hansvanleeuwen.com/amazon-nl-specialist",
          name: t.title,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@id": "https://hansvanleeuwen.com/#person" },
          inLanguage: lang === "nl" ? "nl" : "en",
        },
        {
          "@type": "Service",
          name: "Amazon NL Account Management",
          provider: { "@id": "https://hansvanleeuwen.com/#organization" },
          areaServed: { "@type": "Country", name: "Netherlands" },
          description: t.metaDesc,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: "https://hansvanleeuwen.com/amazon-nl-specialist" },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShoppingCart size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Amazon Netherlands</p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lang === "nl" ? "Amazon NL Diensten" : "Amazon NL Services"}
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

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lang === "nl" ? "Bewezen Amazon NL Resultaten" : "Proven Amazon NL Results"}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {t.results.map((r, i) => (
            <div key={i} className="rounded-xl border-2 border-border/40 bg-card p-6 text-center">
              <p className="mb-2 font-display text-3xl font-bold text-primary">{r.stat}</p>
              <p className="text-sm text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:p-12 text-center">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.ctaHeading}</h2>
        <p className="mb-6 max-w-xl mx-auto text-sm text-muted-foreground">{t.ctaText}</p>
        <a href="mailto:hansvl3@gmail.com?subject=Amazon NL Audit Request" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:gap-3 hover:shadow-lg">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-6 text-xs text-muted-foreground/60">
          <Link to="/work" className="underline hover:text-foreground">{lang === "nl" ? "Bekijk Amazon case studies" : "View Amazon case studies"}</Link>
          {" · "}
          <Link to="/about" className="underline hover:text-foreground">{lang === "nl" ? "Over Hans" : "About Hans"}</Link>
          {" · "}
          <Link to="/bol-com-consultant" className="underline hover:text-foreground">{lang === "nl" ? "Bol.com diensten" : "Bol.com services"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default AmazonNlSpecialist;
