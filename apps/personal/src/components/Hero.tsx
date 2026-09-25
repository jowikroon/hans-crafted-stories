import { motion } from "framer-motion";
import { Link } from "@/components/LocalizedLink";
import FeaturedArticles from "@/components/FeaturedArticles";
import HomeFAQ from "@/components/HomeFAQ";
import ServiceDetails from "@/components/ServiceDetails";
import { ArrowRight, ShoppingCart, BarChart3, Search, TrendingUp, MapPin, Users, AlertTriangle } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageContent } from "@/hooks/usePageContent";
import Magnetic from "@/components/Magnetic";
import hansProfile from "@/assets/hans-profile.jpg";
import { SERVICE_BYLINE, SERVICE_PAGES_UPDATED } from "@/data/servicePages";

const icons = [
  <ShoppingCart size={20} />,
  <BarChart3 size={20} />,
  <TrendingUp size={20} />,
  <Search size={20} />,
];

// Volgorde = translations.hero.expertise; elke kaart linkt exact-match naar zijn dienstenpagina (plan Q4, werkstroom A).
const SERVICE_PATHS = ["/amazon-nl-specialist", "/bol-com-consultant", "/interim-ecommerce-manager", "/ai-ecommerce-automation"];

const formatDate = (iso: string, lang: "nl" | "en") =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

const Hero = () => {
  const { lang } = useLang();
  const isNl = lang === "nl";
  const t = translations[lang].hero;
  const byline = SERVICE_BYLINE[lang];
  const { getValue } = usePageContent("home");

  const expertise = [
    { title: getValue("expertise_1_title", t.expertise[0].title), description: getValue("expertise_1_desc", t.expertise[0].description) },
    { title: getValue("expertise_2_title", t.expertise[1].title), description: getValue("expertise_2_desc", t.expertise[1].description) },
    { title: getValue("expertise_3_title", t.expertise[2].title), description: getValue("expertise_3_desc", t.expertise[2].description) },
    { title: getValue("expertise_4_title", t.expertise[3].title), description: getValue("expertise_4_desc", t.expertise[3].description) },
  ];

  return (
    <main>
      {/* Hero Section */}
      <section
        className="section-container flex min-h-[78vh] flex-col justify-center pt-10"
        aria-label="Introduction"
      >
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_300px]">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-primary"><span className="inline-block h-px w-7 bg-primary" aria-hidden="true" />
            {getValue("hero_subtitle", t.subtitle)}
          </p>
          {/* Korte hero (audit F4.1/F6.1): naam blijft in de H1 (#345), max. twee zinnen subcopy, CTA's direct eronder; context volgt daarna.
              Woordkeus H1 volgt Hans op main: #364 ("Marketplace Manager", zonder "E-commerce &") en #367 (komma na de naam,
              geen em dash). NL-nadruk komt, net als op main, rechtstreeks uit de vertaling: de CMS-sleutel valt zonder _nl-rij terug op Engels. */}
          <h1 className="mb-5 font-display text-4xl font-medium leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Hans van Leeuwen, {t.heading} <em className="text-primary">{isNl ? t.headingEmphasis : getValue("hero_heading_emphasis", t.headingEmphasis)}</em>, {t.headingEnd}
          </h1>
          <p className="mb-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {getValue("hero_description", t.description)}
          </p>
          <div className="flex flex-wrap gap-4" role="group" aria-label={isNl ? "Actieknoppen" : "Call to action"}>
            <Magnetic>
              <Link
                to="/about#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all duration-300 hover:gap-3 hover:shadow-lg"
              >
                {getValue("hero_cta_consult", t.ctaConsult)}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                to="/work"
                className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-foreground/40 hover:bg-secondary hover:shadow-sm"
              >
                {getValue("hero_cta_work", t.ctaWork)}
              </Link>
            </Magnetic>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t.availability}
            {isNl ? " · Reactie binnen 48 uur · Vrijblijvend" : " · Response within 48h · No obligation"}
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isNl ? "Bekijk mijn " : "Explore my "}
            <Link to="/work" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {isNl ? "marketplace-cases voor Amazon & Bol.com" : "Amazon & Bol.com marketplace cases"}
            </Link>
            {isNl ? " of lees " : " or read "}
            <Link to="/writing" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {isNl ? "artikelen over Amazon & Bol.com" : "articles on Amazon & Bol.com"}
            </Link>
            .
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin size={13} className="shrink-0 text-primary/60" />
            {getValue("hero_location", t.location)}
          </p>
        </motion.div>
        {/* Portrait: echte foto (E-E-A-T), eager + fetchpriority want boven de vouw op md+; op mobiel verborgen zodat de H1 de LCP blijft. SEO-run april-items "zero images". */}
        <figure className="hidden md:block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/50">
            <img
              src={hansProfile}
              alt={isNl
                ? "Hans van Leeuwen, freelance en interim e-commerce manager voor Amazon NL/DE en Bol.com, Amersfoort"
                : "Hans van Leeuwen, freelance and interim e-commerce manager for Amazon NL/DE and Bol.com, Amersfoort"}
              width={600}
              height={800}
              loading="eager"
              decoding="async"
              {...{ fetchpriority: "high" }}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">{byline.name} · {isNl ? "Amersfoort" : "Amersfoort, NL"}</figcaption>
        </figure>
        </div>
      </section>

      {/* Results / Proof Section, enriched mini case studies */}
      <section
        className="section-container pb-8 pt-2"
        aria-label={getValue("hero_results_label", t.resultsLabel)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="sr-only">{getValue("hero_results_label", t.resultsLabel)}</h2>
          <div className="flex flex-wrap gap-6 md:gap-10">
          {t.results.map((result, i) => (
            <Link to="/work" key={i} className="group flex items-start gap-3 transition-colors hover:text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/5 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <div className="max-w-[260px]">
                <p className="text-sm font-semibold leading-snug text-foreground">{result}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground group-hover:text-muted-foreground/80">
                  {t.resultsDetail[i]}
                </p>
              </div>
            </Link>
          ))}
          </div>
          {/* Byline + zichtbare revisiedatum (freshness + E-E-A-T; april-items "last updated"). Twin: dateModified in prerender.mjs (home). */}
          <p className="mt-8 border-t border-border/40 pt-4 text-xs text-muted-foreground">
            {byline.updated}: <time dateTime={SERVICE_PAGES_UPDATED}>{formatDate(SERVICE_PAGES_UPDATED, lang)}</time>
            {" · "}
            <Link to="/about" className="underline hover:text-foreground">{byline.about}</Link>
            {" · "}
            <a href="https://www.linkedin.com/in/hansvl3" rel="me noopener noreferrer" target="_blank" className="underline hover:text-foreground">{byline.linkedin}</a>
          </p>
        </motion.div>
      </section>

      {/* Who I Help Section */}
      <section
        className="section-container pb-10"
        aria-label={t.whoIHelpLabel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-2 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-primary"><span className="inline-block h-px w-7 bg-primary" aria-hidden="true" />
            {t.whoIHelpLabel}
          </h2>
          <p className="mb-6 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            {t.whoIHelpHeading}
          </p>
        </motion.div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {t.whoIHelp.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-lg border border-border/30 bg-card p-4"
            >
              <Users size={16} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Problems I Solve Section */}
      <section
        className="section-container pb-16"
        aria-label={t.problemsLabel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-2 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-primary"><span className="inline-block h-px w-7 bg-primary" aria-hidden="true" />
            {t.problemsLabel}
          </h2>
          <p className="mb-6 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            {t.problemsHeading}
          </p>
        </motion.div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.problems.map((problem, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-lg border border-border/30 bg-card p-4"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-primary/70" />
              <span className="text-sm leading-relaxed text-muted-foreground">{problem}</span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Expertise Section */}
      <section
        className="section-container pb-20"
        aria-label={getValue("expertise_label", t.expertiseLabel)}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-2 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-primary"><span className="inline-block h-px w-7 bg-primary" aria-hidden="true" />
            {getValue("expertise_label", t.expertiseLabel)}
          </h2>
          <p className="mb-8 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
            {getValue("expertise_heading", t.expertiseHeading)}
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {expertise.map((item, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-xl border-2 border-border/40 bg-card p-5 transition-all duration-300 hover:border-orange-500/40 hover:shadow-[0_0_12px_hsl(25_95%_53%/0.15)] hover:-translate-y-0.5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                {icons[i]}
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-foreground">
                <Link to={SERVICE_PATHS[i]} className="underline-offset-4 hover:underline">{item.title}</Link>
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Quick links, keyword-rich anchors */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <Link to="/interim-ecommerce-manager" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Interim e-commerce manager inhuren →" : "Interim e-commerce manager →"}
          </Link>
          <Link to="/amazon-nl-specialist" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Amazon NL specialist inhuren →" : "Amazon NL specialist →"}
          </Link>
          <Link to="/bol-com-consultant" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Bol.com consultant inhuren →" : "Bol.com consultant →"}
          </Link>
          <Link to="/ai-ecommerce-automation" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "AI e-commerce automation →" : "AI e-commerce automation →"}
          </Link>
          <Link to="/work" className="font-semibold transition-colors hover:text-foreground">
            {t.linkCases}
          </Link>
          <Link to="/writing" className="font-semibold transition-colors hover:text-foreground">
            {t.linkWriting}
          </Link>
          <Link to="/about" className="font-semibold transition-colors hover:text-foreground">
            {t.linkAbout}
          </Link>
        </motion.div>
      </section>

      {/* Service Details, deliverables, engagement model, industries */}
      <ServiceDetails />

      {/* FAQ Section, matches FAQPage schema for parity */}
      <HomeFAQ />

      {/* Featured Articles */}
      <FeaturedArticles />
    </main>
  );
};

export default Hero;
