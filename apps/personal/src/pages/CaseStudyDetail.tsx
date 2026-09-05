import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/components/LocalizedLink";
import { Home, ChevronRight, ArrowRight, X, ChevronLeft } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useSEO } from "@/hooks/useSEO";

const images = [
  { src: "/cases/connect-car-parts/ccp-10.png", alt: "Connect Car Parts, full campaign overview" },
  { src: "/cases/connect-car-parts/ccp-3.png", alt: "ABS vs Bosch vs Brembo vs ATE, brand comparison" },
  { src: "/cases/connect-car-parts/ccp-4.png", alt: "ABS Rem Schijven, product photography layout" },
  { src: "/cases/connect-car-parts/ccp-6.png", alt: "Frankberg Bremskit, brake kit promotion" },
  { src: "/cases/connect-car-parts/ccp-7.png", alt: "Frankberg, friction coefficient performance chart" },
  { src: "/cases/connect-car-parts/ccp-8.png", alt: "ABS, ECE Certified, Made in Europe" },
  { src: "/cases/connect-car-parts/ccp-9.png", alt: "ABS Brake Parts, full brand infographic" },
  { src: "/cases/connect-car-parts/ccp-1.png", alt: "Marketplace listing performance comparison" },
  { src: "/cases/connect-car-parts/ccp-14.png", alt: "How to choose the right brake disc, guide visual" },
  { src: "/cases/connect-car-parts/ccp-13.png", alt: "SEO analysis tool, marketplace optimization" },
];

const stats = {
  nl: [
    { label: "Actieve SKU's live", value: "~400" },
    { label: "Productrecords van content voorzien", value: "2.400+" },
    { label: "Kanalen", value: "Magento · Amazon DE · eBay DE" },
    { label: "Ordermonitoring", value: "elke 30 min" },
  ],
  en: [
    { label: "Active SKUs live", value: "~400" },
    { label: "Product records with generated content", value: "2,400+" },
    { label: "Channels", value: "Magento · Amazon DE · eBay DE" },
    { label: "Order monitoring", value: "every 30 min" },
  ],
};

const CaseStudyDetail = () => {
  const { lang } = useLang();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const content = lang === "nl" ? {
    breadcrumbWork: "Case studies",
    breadcrumbCase: "Connect Car Parts",
    label: "Case study · 2025–2026",
    title: "Connect Car Parts: A.B.S.-remonderdelen op Amazon DE, eBay DE en Magento",
    subtitle: "Hoe één operator een multi-channel onderdelenbusiness runt met gestructureerde productdata, feedautomatisering en AI-ondersteunde content, met de mens op prijs, merkstem en compliance.",
    contextTitle: "Context en rol",
    contextText: [
      "Connect Car Parts is de e-commerce-operatie van ABS All Brake Systems: een Nederlandse verkoper van remonderdelen (schijven, blokken, slangen, wiellagersets) van het merk A.B.S. en aanvullende merken zoals Frankberg. De verkoop loopt via een eigen Magento-webshop en via Amazon DE en eBay DE; Bol.com en het volledige A.B.S.-assortiment op eBay DE zijn in uitrol. Ik werk hier sinds december 2025 als e-commerce manager en run de marketplace-kant van begin tot eind.",
      "Twee getallen die vaak door elkaar lopen: de actieve catalogus die live staat telt circa 400 SKU's met voertuig-fitmentdata (K-types) en OE-kruisverwijzingen; het aantal productrecords dat door de contentpipeline is gegaan ligt boven de 2.400, omdat elk record per land en per kanaal een eigen versie krijgt en omdat het bredere A.B.S.-assortiment wordt voorbereid.",
    ],
    problemTitle: "De uitdaging",
    problemText: "Een remonderdeel verkoopt alleen als de koper zeker weet dat het op zijn auto past. Dat vraagt per SKU om fitment-data, OE-nummers, technische specificaties en per marketplace andere titel-, attribuut- en compliance-regels (GPSR, ISO, merkvermelding). Handmatig kostte een publish-ready listing gemiddeld 45 minuten; met duizenden records over drie landen en drie talen was dat niet vol te houden, en fouten in fitment of claims leidden direct tot retouren of afkeuringen.",
    solutionTitle: "De aanpak",
    solutionItems: [
      "Gestructureerde productdata-import vanuit ERP/PIM en de A.B.S. TecDoc-export, met K-type-koppeling per voertuig",
      "Feedmanagement via Channable met merk-gesplitste GPSR- en ISO-regels per kanaal (Amazon DE, eBay DE, Bol.com)",
      "AI-ondersteunde contentgeneratie: titels, bullets, A+ Content en backend keywords per land, met bron- en zekerheidslabel",
      "Automatische policy-validatie (Amazon-regels, bytelimieten, verboden claims) vóór publicatie; menselijke controle op prijs en merkstem",
      "Kwaliteitsscore per listing met prioritering op omzetkans; visuele content zoals merkinfographics en vergelijkingstabellen",
      "Geautomatiseerde VIN-zoekfunctie in de webshop, een primeur in de branche, zodat de koper op kenteken het juiste onderdeel vindt",
      "Ordermonitoring elke 30 minuten via n8n met alerts bij uitval; dagelijkse radar op Channable-feedkwaliteit en marketplace-regels",
    ],
    resultsTitle: "Wat het opleverde",
    resultsItems: [
      "Gemiddelde kwaliteitsscore van 94/100 over alle gegenereerde listings (interne meting van de contentpipeline, 2025)",
      "Contentcreatie-tijd van 45 minuten naar 3 minuten per SKU (−93%, interne tijdmeting)",
      "Nul policy-afwijzingen na implementatie van de validatiestap",
      "Consistente merkboodschap over 3 landen en 3 talen",
      "eBay, Amazon en Bol.com gekoppeld tot één marketplace-operatie met één productdatabron",
      "Omzetprognoses en KPI-rapportage die de directie wekelijks gebruikt",
    ],
    ongoingTitle: "Lopend werk",
    ongoingText: "De Amazon DE-catalogus wordt gelanceerd inclusief Duitse btw-registratie, het volledige A.B.S.-assortiment gaat naar eBay DE en Bol.com met marketplace-specifieke contentregels en voertuigcompatibiliteitsbestanden, en een wekelijkse concurrentiescan volgt prijs- en assortimentsbewegingen op Amazon DE en eBay DE. Wat ik daarbij leer over agents die successen melden zonder bewijs, beschreef ik in mijn artikelen over AI-betrouwbaarheid en meta-monitoring.",
    galleryTitle: "Deliverables",
    ctaTitle: "Hetzelfde voor jouw catalogus?",
    ctaText: "Deze aanpak werkt voor elke grote catalogus met technische productdata. Bekijk de dienstenpagina's of plan een kennismaking.",
    ctaButton: "Plan een kennismaking",
    links: [
      { href: "/ai-ecommerce-automation", label: "AI e-commerce automatisering" },
      { href: "/amazon-nl-specialist", label: "Amazon-diensten" },
      { href: "/writing/ai-agent-verzint-succes", label: "Artikel: AI-agent verzint succes" },
    ],
  } : {
    breadcrumbWork: "Case studies",
    breadcrumbCase: "Connect Car Parts",
    label: "Case study · 2025–2026",
    title: "Connect Car Parts: A.B.S. brake parts on Amazon DE, eBay DE and Magento",
    subtitle: "How one operator runs a multi-channel parts business with structured product data, feed automation and AI-assisted content, with a human on pricing, brand voice and compliance.",
    contextTitle: "Context and role",
    contextText: [
      "Connect Car Parts is the e-commerce operation of ABS All Brake Systems: a Dutch seller of brake parts (discs, pads, hoses, wheel-bearing kits) under the A.B.S. brand and complementary brands such as Frankberg. Sales run through its own Magento storefront and on Amazon DE and eBay DE; Bol.com and the full A.B.S. assortment on eBay DE are being rolled out. I've worked here as e-commerce manager since December 2025 and run the marketplace side end to end.",
      "Two numbers that are often confused: the active catalogue that is live counts roughly 400 SKUs with vehicle-fitment data (K-types) and OE cross-references; the number of product records that have gone through the content pipeline exceeds 2,400, because every record gets its own version per country and channel and because the wider A.B.S. assortment is being prepared.",
    ],
    problemTitle: "The challenge",
    problemText: "A brake part only sells when the buyer is certain it fits their car. That requires fitment data, OE numbers and technical specifications per SKU, plus different title, attribute and compliance rules per marketplace (GPSR, ISO, brand mention). Done by hand, a publish-ready listing took 45 minutes on average; with thousands of records across three countries and three languages that was unsustainable, and errors in fitment or claims led straight to returns or rejections.",
    solutionTitle: "The approach",
    solutionItems: [
      "Structured product data import from ERP/PIM and the A.B.S. TecDoc export, with K-type mapping per vehicle",
      "Feed management through Channable with brand-split GPSR and ISO rules per channel (Amazon DE, eBay DE, Bol.com)",
      "AI-assisted content generation: titles, bullets, A+ Content and backend keywords per country, with source and confidence labels",
      "Automatic policy validation (Amazon rules, byte limits, forbidden claims) before publishing; human review on pricing and brand voice",
      "Quality score per listing with prioritisation on revenue opportunity; visual content such as brand infographics and comparison tables",
      "Automated VIN-based parts lookup in the storefront, a first in the industry, so buyers find the right part by licence plate",
      "Order monitoring every 30 minutes through n8n with failure alerts; daily radar on Channable feed quality and marketplace rules",
    ],
    resultsTitle: "What it delivered",
    resultsItems: [
      "Average quality score of 94/100 across all generated listings (internal measurement of the content pipeline, 2025)",
      "Content creation time from 45 minutes to 3 minutes per SKU (−93%, internal time measurement)",
      "Zero policy rejections after implementing the validation step",
      "Consistent brand messaging across 3 countries and 3 languages",
      "eBay, Amazon and Bol.com connected into one marketplace operation with a single product-data source",
      "Revenue forecasts and KPI reporting used weekly by management",
    ],
    ongoingTitle: "Ongoing work",
    ongoingText: "The Amazon DE catalogue is being launched including German VAT registration, the full A.B.S. assortment is moving to eBay DE and Bol.com with marketplace-specific content rules and vehicle compatibility files, and a weekly competitor scan tracks price and assortment movements on Amazon DE and eBay DE. What I keep learning about agents reporting success without evidence is documented in my articles on AI reliability and meta-monitoring.",
    galleryTitle: "Deliverables",
    ctaTitle: "The same for your catalogue?",
    ctaText: "This approach works for any large catalogue with technical product data. See the service pages or book an intro call.",
    ctaButton: "Book an intro call",
    links: [
      { href: "/ai-ecommerce-automation", label: "AI e-commerce automation" },
      { href: "/amazon-nl-specialist", label: "Amazon services" },
      { href: "/writing/ai-agent-verzint-succes", label: "Article: my AI agent invented success (Dutch)" },
    ],
  };

  useSEO({
    title: lang === "nl"
      ? "Case study Connect Car Parts: A.B.S.-remonderdelen op Amazon DE, eBay DE & Magento | Hans van Leeuwen"
      : "Connect Car Parts Case Study: A.B.S. Brake Parts on Amazon DE, eBay DE & Magento | Hans van Leeuwen",
    description: lang === "nl"
      ? "Hoe Hans van Leeuwen de marketplace-operatie van Connect Car Parts runt: ~400 actieve SKU's A.B.S.-remonderdelen op Amazon DE, eBay DE en Magento, 2.400+ productrecords van AI-content voorzien (94/100), Channable-feeds en n8n-monitoring."
      : "How Hans van Leeuwen runs marketplace operations for Connect Car Parts: ~400 active A.B.S. brake-part SKUs on Amazon DE, eBay DE and Magento, 2,400+ product records with AI-generated content (94/100), Channable feeds and n8n monitoring.",
    path: "/work/connect-car-parts",
    lang,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: content.title,
      description: content.subtitle,
      author: { "@type": "Person", name: "Hans van Leeuwen", url: "https://hansvanleeuwen.com/about" },
      publisher: { "@id": "https://hansvanleeuwen.com/#organization" },
      url: `https://hansvanleeuwen.com${lang === "nl" ? "/nl" : ""}/work/connect-car-parts`,
      inLanguage: lang,
      dateModified: "2026-09-05",
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
        {stats[lang].map((stat) => (
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

      {/* Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 max-w-3xl"
      >
        <h2 className="mb-4 font-display text-2xl font-medium text-foreground">{content.contextTitle}</h2>
        <div className="space-y-4 leading-relaxed text-muted-foreground">
          {content.contextText.map((p) => <p key={p}>{p}</p>)}
        </div>
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

      {/* Ongoing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 max-w-3xl"
      >
        <h2 className="mb-4 font-display text-2xl font-medium text-foreground">{content.ongoingTitle}</h2>
        <p className="leading-relaxed text-muted-foreground">{content.ongoingText}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {content.links.map((l, i) => (
            <span key={l.href}>{i > 0 && " · "}<Link to={l.href} className="underline hover:text-foreground">{l.label}</Link></span>
          ))}
        </p>
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
        <Link
          to="/about#contact"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {content.ctaButton}
          <ArrowRight size={16} />
        </Link>
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
