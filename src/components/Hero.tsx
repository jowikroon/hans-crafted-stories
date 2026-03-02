import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import FeaturedArticles from "@/components/FeaturedArticles";
import HomeFAQ from "@/components/HomeFAQ";
import ServiceDetails from "@/components/ServiceDetails";
import { ArrowRight, ShoppingCart, BarChart3, Search, TrendingUp, MapPin, Users, AlertTriangle } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageContent } from "@/hooks/usePageContent";

const icons = [
  <ShoppingCart size={20} />,
  <BarChart3 size={20} />,
  <TrendingUp size={20} />,
  <Search size={20} />,
];

const Hero = () => {
  const { lang } = useLang();
  const isNl = lang === "nl";
  const t = translations[lang].hero;
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
        className="section-container flex min-h-[85vh] flex-col justify-center pt-28"
        aria-label="Introduction"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {getValue("hero_subtitle", t.subtitle)}
          </p>
          <h1 className="mb-3 font-display text-4xl font-medium leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {isNl
              ? <>Freelance E-commerce Manager &amp; Amazon/Bol.com <em className="text-primary">Specialist</em></>
              : <>Freelance E-commerce Manager — <em className="text-primary">{getValue("hero_heading_emphasis", t.headingEmphasis)}</em>, growth &amp; design</>
            }
          </h1>
          <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">
            {getValue("hero_freelance_h2", t.freelanceH2)}
          </p>
          <p className="mb-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {getValue("hero_description", t.description)}
          </p>
          <p className="mb-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isNl ? "Bekijk mijn " : "Explore my "}
            <Link to="/work" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {isNl ? "Amazon NL & Bol.com marketplace cases met meetbare resultaten" : "Amazon NL & Bol.com case studies with measurable results"}
            </Link>
            {isNl ? " of lees " : " or read "}
            <Link to="/writing" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {isNl ? "Amazon & Bol.com optimalisatie artikelen" : "Amazon & Bol.com optimization articles"}
            </Link>
            .
          </p>
          <p className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground/70">
            <MapPin size={13} className="shrink-0 text-primary/60" />
            {getValue("hero_location", t.location)}
          </p>
          <div className="flex flex-wrap gap-4" role="group" aria-label={isNl ? "Actieknoppen" : "Call to action"}>
            <Link
              to="/work"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all duration-300 hover:gap-3 hover:shadow-lg"
              aria-label={getValue("hero_cta_work", t.ctaWork)}
            >
              {getValue("hero_cta_work", t.ctaWork)}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/about#contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-foreground/40 hover:bg-secondary hover:shadow-sm"
              aria-label={getValue("hero_cta_consult", t.ctaConsult)}
            >
              {getValue("hero_cta_consult", t.ctaConsult)}
            </Link>
            <Link
              to="/about#contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-foreground/30 hover:text-foreground"
            >
              {t.ctaConsultSecondary}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            {isNl
              ? "Reactie binnen 48 uur · Vrijblijvend · Voor merken en retailers op Amazon NL & Bol.com"
              : "Response within 48h · No obligation · For brands & retailers on Amazon NL & Bol.com"}
          </p>
        </motion.div>
      </section>

      {/* Results / Proof Section — enriched mini case studies */}
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
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
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
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.whoIHelpLabel}
          </h2>
          <p className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
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
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.problemsLabel}
          </h2>
          <p className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
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
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {getValue("expertise_label", t.expertiseLabel)}
          </h2>
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
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
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Quick links — keyword-rich anchors */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <Link to="/amazon-nl-specialist" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Amazon NL specialist →" : "Amazon NL specialist →"}
          </Link>
          <Link to="/bol-com-consultant" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Bol.com consultant →" : "Bol.com consultant →"}
          </Link>
          <Link to="/interim-ecommerce-manager" className="font-semibold transition-colors hover:text-foreground">
            {isNl ? "Interim e-commerce manager →" : "Interim e-commerce manager →"}
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

      {/* Service Details — deliverables, engagement model, industries */}
      <ServiceDetails />

      {/* FAQ Section — matches FAQPage schema for parity */}
      <HomeFAQ />

      {/* Featured Articles */}
      <FeaturedArticles />
    </main>
  );
};

export default Hero;
