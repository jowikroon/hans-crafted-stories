import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, ChevronRight, BarChart3 } from "lucide-react";
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
    title: "Bol.com Consultant — Freelance Bol.com Specialist & Ads Manager",
    metaDesc: "Freelance Bol.com consultant & specialist. Bol Ads, content optimization, catalog management & analytics. Vendor-to-seller transitions. Based in Amersfoort, NL.",
    breadcrumb: "Bol.com Consultant",
    h1: "Bol.com Consultant",
    subtitle: "Freelance Bol.com specialist — content, Bol Ads & marketplace growth",
    intro: "I help brands grow on Bol.com — the Netherlands' largest online marketplace. From optimizing product content and managing Bol Ads campaigns to transitioning from vendor to seller, I deliver measurable results with a hands-on approach.",
    services: [
      "Bol.com product content optimization (titles, descriptions, attributes)",
      "Bol Ads campaign setup, management & ROAS optimization",
      "Vendor-to-seller channel transition strategy",
      "Catalog management & data feed optimization",
      "Bol.com analytics & performance reporting",
      "Category analysis & competitive positioning",
      "Bol.com logistics optimization (LVB / FBB)",
      "Pricing strategy & Buy Box tactics on Bol.com",
    ],
    results: [
      { stat: "Vendor→Seller", desc: "successful channel transition with revenue growth maintained" },
      { stat: "70%", desc: "category market share (cross-marketplace, Nielsen Data)" },
      { stat: "20%", desc: "weekly sales growth from targeted Bol Ads campaigns" },
    ],
    ctaHeading: "Ready to grow on Bol.com?",
    ctaText: "Get a free Bol.com marketplace assessment — I'll map your opportunities and quick wins within 48 hours.",
    ctaButton: "Request your Bol.com audit",
  },
  nl: {
    title: "Bol.com Consultant — Freelance Bol.com Specialist & Ads Manager",
    metaDesc: "Freelance Bol.com consultant & specialist. Bol Ads, contentoptimalisatie, catalogusbeheer & analytics. Vendor-naar-seller transities. Gevestigd in Amersfoort.",
    breadcrumb: "Bol.com Consultant",
    h1: "Bol.com Consultant",
    subtitle: "Freelance Bol.com specialist — content, Bol Ads & marktplaatsgroei",
    intro: "Ik help merken groeien op Bol.com — de grootste online marktplaats van Nederland. Van het optimaliseren van productcontent en het beheren van Bol Ads campagnes tot vendor-naar-seller transities. Hands-on en meetbaar.",
    services: [
      "Bol.com productcontent optimalisatie (titels, beschrijvingen, attributen)",
      "Bol Ads campagne-opzet, beheer & ROAS-optimalisatie",
      "Vendor-naar-seller kanaal transitiestrategie",
      "Catalogusbeheer & data-feed optimalisatie",
      "Bol.com analytics & prestatierapportage",
      "Categorie-analyse & concurrentiepositionering",
      "Bol.com logistiek optimalisatie (LVB / FBB)",
      "Prijsstrategie & Buy Box tactieken op Bol.com",
    ],
    results: [
      { stat: "Vendor→Seller", desc: "succesvolle kanaaltransitie met behoud van omzetgroei" },
      { stat: "70%", desc: "marktaandeel in categorie (cross-marketplace, Nielsen Data)" },
      { stat: "20%", desc: "wekelijkse omzetgroei door gerichte Bol Ads campagnes" },
    ],
    ctaHeading: "Klaar om te groeien op Bol.com?",
    ctaText: "Ontvang een gratis Bol.com marktplaats assessment — ik breng je kansen en quick wins in kaart binnen 48 uur.",
    ctaButton: "Vraag je Bol.com audit aan",
  },
};

const BolComConsultant = () => {
  const { lang } = useLang();
  const t = content[lang];

  useSEO({
    title: t.title,
    description: t.metaDesc,
    url: "https://hansvanleeuwen.com/bol-com-consultant",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/bol-com-consultant" },
      { lang: "nl", href: "https://hansvanleeuwen.com/bol-com-consultant" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/bol-com-consultant" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          url: "https://hansvanleeuwen.com/bol-com-consultant",
          name: t.title,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@id": "https://hansvanleeuwen.com/#person" },
          inLanguage: lang === "nl" ? "nl" : "en",
        },
        {
          "@type": "Service",
          name: "Bol.com Marketplace Consulting",
          provider: { "@id": "https://hansvanleeuwen.com/#organization" },
          areaServed: { "@type": "Country", name: "Netherlands" },
          description: t.metaDesc,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: "https://hansvanleeuwen.com/bol-com-consultant" },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><BarChart3 size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Bol.com</p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lang === "nl" ? "Bol.com Diensten" : "Bol.com Services"}
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
          {lang === "nl" ? "Bewezen Bol.com Resultaten" : "Proven Bol.com Results"}
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
        <a href="mailto:hansvl3@gmail.com?subject=Bol.com Audit Request" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:gap-3 hover:shadow-lg">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        <p className="mt-6 text-xs text-muted-foreground/60">
          <Link to="/work" className="underline hover:text-foreground">{lang === "nl" ? "Bekijk Bol.com case studies" : "View Bol.com case studies"}</Link>
          {" · "}
          <Link to="/about" className="underline hover:text-foreground">{lang === "nl" ? "Over Hans" : "About Hans"}</Link>
          {" · "}
          <Link to="/amazon-nl-specialist" className="underline hover:text-foreground">{lang === "nl" ? "Amazon NL diensten" : "Amazon NL services"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default BolComConsultant;
