import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Layers } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const content = {
  en: {
    deliverablesLabel: "What You Get",
    deliverablesHeading: "Core Deliverables",
    deliverables: [
      "Marketplace audit & growth roadmap",
      "Product listing optimization (SEO, A+ Content, images)",
      "Amazon & Bol.com advertising management (PPC)",
      "Conversion rate optimization & A/B testing",
      "Catalog management & inventory forecasting",
      "Monthly performance reporting & insights",
    ],
    processLabel: "How It Works",
    processHeading: "Engagement Model",
    steps: [
      { title: "Discovery", desc: "Audit your current marketplace presence, identify quick wins and long-term growth levers." },
      { title: "Strategy", desc: "Build a tailored action plan with KPIs, timelines, and clear ownership." },
      { title: "Execution", desc: "Hands-on implementation — from listing optimization to ad campaigns — with weekly check-ins." },
      { title: "Scale", desc: "Iterate based on data, expand to new channels, and compound results over time." },
    ],
    industriesLabel: "Industries & Categories",
    industriesHeading: "Sectors I Work With",
    industries: [
      "Health & Personal Care",
      "Consumer Electronics",
      "Automotive Parts & Accessories",
      "Home & Garden",
      "Sports & Outdoor",
      "Beauty & Cosmetics",
      "Food & Supplements",
      "Fashion & Accessories",
    ],
  },
  nl: {
    deliverablesLabel: "Wat Je Krijgt",
    deliverablesHeading: "Kernleveringen",
    deliverables: [
      "Marketplace audit & groeiroadmap",
      "Product listing optimalisatie (SEO, A+ Content, afbeeldingen)",
      "Amazon & Bol.com advertentiebeheer (PPC)",
      "Conversie-optimalisatie & A/B-testen",
      "Catalogusbeheer & voorraadbeheer",
      "Maandelijkse prestatierapportage & inzichten",
    ],
    processLabel: "Werkwijze",
    processHeading: "Samenwerkingsmodel",
    steps: [
      { title: "Analyse", desc: "Audit van je huidige marketplace aanwezigheid, identificatie van quick wins en groei-hefbomen." },
      { title: "Strategie", desc: "Op maat gemaakt actieplan met KPI's, tijdlijnen en duidelijke verantwoordelijkheden." },
      { title: "Uitvoering", desc: "Hands-on implementatie — van listing optimalisatie tot advertentiecampagnes — met wekelijkse check-ins." },
      { title: "Opschalen", desc: "Itereren op basis van data, uitbreiden naar nieuwe kanalen en resultaten versterken." },
    ],
    industriesLabel: "Branches & Categorieën",
    industriesHeading: "Sectoren Waarmee Ik Werk",
    industries: [
      "Gezondheid & Persoonlijke Verzorging",
      "Consumentenelektronica",
      "Auto-onderdelen & Accessoires",
      "Huis & Tuin",
      "Sport & Outdoor",
      "Beauty & Cosmetica",
      "Voeding & Supplementen",
      "Mode & Accessoires",
    ],
  },
};

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.5, ease } as const,
};

const ServiceDetails = () => {
  const { lang } = useLang();
  const t = content[lang];

  return (
    <>
      {/* Deliverables */}
      <section className="section-container pb-12 pt-0" aria-label={t.deliverablesLabel}>
        <motion.div {...fadeUp}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.deliverablesLabel}
          </h2>
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t.deliverablesHeading}
          </p>
        </motion.div>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.deliverables.map((item, i) => (
            <motion.li
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4"
            >
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Engagement Model */}
      <section className="section-container pb-12 pt-0" aria-label={t.processLabel}>
        <motion.div {...fadeUp}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.processLabel}
          </h2>
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t.processHeading}
          </p>
        </motion.div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="relative rounded-xl border-2 border-border/40 bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </div>
              <h3 className="mb-1 text-sm font-bold text-foreground">{step.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
              {i < t.steps.length - 1 && (
                <ArrowRight size={14} className="absolute right-3 top-5 hidden text-muted-foreground/30 lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Service Area — captures high-intent keyword variants */}
      <section className="section-container pb-12 pt-0" aria-label={lang === "nl" ? "Interim E-commerce Manager" : "Interim E-commerce Manager"}>
        <motion.div {...fadeUp}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {lang === "nl" ? "Interim & Freelance" : "Interim & Freelance"}
          </h2>
          <p className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {lang === "nl"
              ? "Interim E-commerce Manager voor Amazon NL & Bol.com"
              : "Interim E-commerce Manager for Amazon NL & Bol.com"}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {lang === "nl"
              ? "Op zoek naar een hands-on interim e-commerce manager of freelance marketplace consultant? Ik werk als interim lead, account manager en marketplace specialist voor merken die structurele groei zoeken op Amazon Nederland en Bol.com. Van strategie tot dagelijkse uitvoering — flexibel inzetbaar per project of op contractbasis."
              : "Looking for a hands-on interim e-commerce manager or freelance marketplace consultant? I work as an interim lead, account manager, and marketplace specialist for brands seeking structural growth on Amazon Netherlands and Bol.com. From strategy to day-to-day execution — available per project or on contract."}
          </p>
        </motion.div>
      </section>

      {/* Industries */}
      <section className="section-container pb-20 pt-0" aria-label={t.industriesLabel}>
        <motion.div {...fadeUp}>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.industriesLabel}
          </h2>
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t.industriesHeading}
          </p>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          {t.industries.map((industry, i) => (
            <motion.span
              key={i}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <Layers size={14} className="text-primary/60" />
              {industry}
            </motion.span>
          ))}
        </div>
      </section>
    </>
  );
};

export default ServiceDetails;
