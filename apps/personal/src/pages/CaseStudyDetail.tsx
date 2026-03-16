import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ChevronRight, ArrowRight, X, ChevronLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useSEO } from "@/hooks/useSEO";

const images = [
  { src: "/cases/connect-car-parts/ccp-10.png", alt: "Connect Car Parts — full campaign overview" },
  { src: "/cases/connect-car-parts/ccp-3.png", alt: "ABS vs Bosch vs Brembo vs ATE — brand comparison" },
  { src: "/cases/connect-car-parts/ccp-4.png", alt: "ABS Rem Schijven — product photography layout" },
  { src: "/cases/connect-car-parts/ccp-6.png", alt: "Frankberg Bremskit — brake kit promotion" },
  { src: "/cases/connect-car-parts/ccp-7.png", alt: "Frankberg — friction coefficient performance chart" },
  { src: "/cases/connect-car-parts/ccp-8.png", alt: "ABS — ECE Certified, Made in Europe" },
  { src: "/cases/connect-car-parts/ccp-9.png", alt: "ABS Brake Parts — full brand infographic" },
  { src: "/cases/connect-car-parts/ccp-1.png", alt: "Marketplace listing performance comparison" },
  { src: "/cases/connect-car-parts/ccp-14.png", alt: "How to choose the right brake disc — guide visual" },
  { src: "/cases/connect-car-parts/ccp-13.png", alt: "SEO analysis tool — marketplace optimization" },
];

const stats = [
  { label: "SKUs Optimized", value: "2,400+" },
  { label: "Marketplaces", value: "Amazon DE/NL/FR" },
  { label: "Content Types", value: "Listings, A+, Ads" },
  { label: "Quality Score Avg", value: "94/100" },
];

const CaseStudyDetail = () => {
  const { lang } = useLang();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const content = lang === "nl" ? {
    breadcrumbWork: "Portfolio",
    breadcrumbCase: "Connect Car Parts",
    label: "Case Study",
    title: "Connect Car Parts — Marketplace Content Optimalisatie",
    subtitle: "Van handmatige productlijsten naar geautomatiseerde, publish-ready Amazon content voor 2.400+ automotive onderdelen.",
    problemTitle: "De Uitdaging",
    problemText: "Connect Car Parts verkoopt premium remonderdelen (ABS, Frankberg) op Amazon DE, NL en FR. Met 2.400+ SKU's was handmatige contentcreatie onhoudbaar: inconsistente titels, ontbrekende attributen, policy-afwijzingen en geen kwaliteitsmeting per listing.",
    solutionTitle: "De Oplossing",
    solutionItems: [
      "Gestructureerde productdata-import vanuit hun ERP/PIM systeem",
      "AI-gestuurde contentgeneratie: titels, bullets, A+ content, backend keywords per land",
      "Automatische policy-validatie (Amazon-regels, byte-limieten, verboden claims)",
      "Kwaliteitsscore per listing met prioritering op omzetkans",
      "Visuele content: merkinfographics, vergelijkingstabellen, productfotografie-briefs",
    ],
    resultsTitle: "Resultaten",
    resultsItems: [
      "Gemiddelde kwaliteitsscore van 94/100 over alle listings",
      "Contentcreatie-tijd gereduceerd van 45 min naar 3 min per SKU",
      "Nul policy-afwijzingen na implementatie",
      "Consistente merkboodschap over 3 landen en 3 talen",
    ],
    galleryTitle: "Deliverables",
    ctaTitle: "Wil je hetzelfde voor jouw merk?",
    ctaText: "Dit project is gebouwd met dezelfde technologie die nu beschikbaar is als SaaS op marketplacegrowth.nl.",
    ctaButton: "Probeer de Content Builder",
  } : {
    breadcrumbWork: "Portfolio",
    breadcrumbCase: "Connect Car Parts",
    label: "Case Study",
    title: "Connect Car Parts — Marketplace Content Optimization",
    subtitle: "From manual product listings to automated, publish-ready Amazon content for 2,400+ automotive parts.",
    problemTitle: "The Challenge",
    problemText: "Connect Car Parts sells premium brake parts (ABS, Frankberg) on Amazon DE, NL, and FR. With 2,400+ SKUs, manual content creation was unsustainable: inconsistent titles, missing attributes, policy rejections, and no quality measurement per listing.",
    solutionTitle: "The Solution",
    solutionItems: [
      "Structured product data import from their ERP/PIM system",
      "AI-powered content generation: titles, bullets, A+ content, backend keywords per country",
      "Automatic policy validation (Amazon rules, byte limits, forbidden claims)",
      "Quality score per listing with prioritization on revenue opportunity",
      "Visual content: brand infographics, comparison tables, product photography briefs",
    ],
    resultsTitle: "Results",
    resultsItems: [
      "Average quality score of 94/100 across all listings",
      "Content creation time reduced from 45 min to 3 min per SKU",
      "Zero policy rejections after implementation",
      "Consistent brand messaging across 3 countries and 3 languages",
    ],
    galleryTitle: "Deliverables",
    ctaTitle: "Want the same for your brand?",
    ctaText: "This project was built with the same technology now available as SaaS on marketplacegrowth.nl.",
    ctaButton: "Try the Content Builder",
  };

  useSEO({
    title: lang === "nl"
      ? "Connect Car Parts — Marketplace Content Optimalisatie | Hans van Leeuwen"
      : "Connect Car Parts — Marketplace Content Optimization | Hans van Leeuwen",
    description: lang === "nl"
      ? "Case study: AI-gestuurde Amazon content optimalisatie voor 2.400+ automotive onderdelen. Kwaliteitsscore 94/100, 93% tijdsbesparing per SKU."
      : "Case study: AI-powered Amazon content optimization for 2,400+ automotive parts. Quality score 94/100, 93% time reduction per SKU.",
    url: "https://hansvanleeuwen.com/work/connect-car-parts",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: content.title,
      description: content.subtitle,
      author: { "@type": "Person", name: "Hans van Leeuwen", url: "https://hansvanleeuwen.com/about" },
      publisher: { "@id": "https://hansvanleeuwen.com/#organization" },
      url: "https://hansvanleeuwen.com/work/connect-car-parts",
    },
  });

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === "ArrowRight" && lightboxIndex < images.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxIndex]);

  return (
    <section className="section-container pt-28 pb-20">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
          <Home size={12} />
          <span>Home</span>
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <Link to="/work" className="transition-colors hover:text-foreground">
          {content.breadcrumbWork}
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{content.breadcrumbCase}</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {content.label}
        </p>
        <h1 className="mb-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl">
          {content.title}
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {content.subtitle}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-5">
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="mb-16 overflow-hidden rounded-2xl border border-border/50"
      >
        <img
          src={images[0].src}
          alt={images[0].alt}
          className="w-full object-cover"
          loading="eager"
        />
      </motion.div>

      {/* Problem / Solution / Results */}
      <div className="mb-16 grid gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
            {content.problemTitle}
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {content.problemText}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
            {content.solutionTitle}
          </h2>
          <ul className="space-y-2">
            {content.solutionItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 rounded-2xl border border-primary/20 bg-primary/5 p-8"
      >
        <h2 className="mb-4 font-display text-2xl font-medium text-foreground">
          {content.resultsTitle}
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {content.resultsItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-foreground">
              <span className="mt-1 text-primary">&#10003;</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="mb-6 font-display text-2xl font-medium text-foreground">
          {content.galleryTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.slice(1).map((img, i) => (
            <motion.button
              key={img.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setLightboxIndex(i + 1)}
              className="group overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-border/50 bg-card p-8 text-center md:p-12"
      >
        <h2 className="mb-3 font-display text-2xl font-medium text-foreground md:text-3xl">
          {content.ctaTitle}
        </h2>
        <p className="mx-auto mb-6 max-w-lg text-muted-foreground">
          {content.ctaText}
        </p>
        <a
          href="https://marketplacegrowth.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {content.ctaButton}
          <ArrowRight size={16} />
        </a>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Image lightbox"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              aria-label="Close lightbox"
              className="absolute right-4 top-4 rounded-full bg-card p-2 text-foreground transition-colors hover:bg-muted"
            >
              <X size={20} />
            </button>
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                aria-label="Previous image"
                className="absolute left-4 rounded-full bg-card p-2 text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                aria-label="Next image"
                className="absolute right-4 rounded-full bg-card p-2 text-foreground transition-colors hover:bg-muted"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CaseStudyDetail;
