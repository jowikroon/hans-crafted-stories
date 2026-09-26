import { motion } from "framer-motion";
import { Link } from "@/components/LocalizedLink";
import { Home, ChevronRight, ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useSEO } from "@/hooks/useSEO";
import { MARKETPLACE_PRODUCT_DATA_CASE } from "@/data/marketplaceCases";

/**
 * Geanonimiseerde marketplace-case (2026-09-23). Vervangt de vroegere
 * klantcase met cijfers en merkbeelden; tekst komt uit data/marketplaceCases.ts
 * zodat prerender, /work en deze pagina dezelfde inhoud tonen.
 */
const CaseStudyDetail = () => {
  const { lang } = useLang();
  const c = MARKETPLACE_PRODUCT_DATA_CASE.copy[lang];
  const workLabel = lang === "nl" ? "Werk" : "Work";

  useSEO({
    title: lang === "nl" ? "Case: marketplace-productdata | Hans van Leeuwen" : "Case: Marketplace Product Data | Hans van Leeuwen",
    description: c.description,
    path: MARKETPLACE_PRODUCT_DATA_CASE.path,
    lang,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: c.title,
      description: c.description,
      author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen", url: "https://hansvanleeuwen.com/about" },
      publisher: { "@id": "https://hansvanleeuwen.com/#organization" },
      url: `https://hansvanleeuwen.com${lang === "nl" ? "/nl" : ""}${MARKETPLACE_PRODUCT_DATA_CASE.path}`,
      inLanguage: lang,
      dateModified: MARKETPLACE_PRODUCT_DATA_CASE.dateModified,
    },
  });

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
          {workLabel}
        </Link>
        <ChevronRight size={11} className="text-muted-foreground/40" />
        <span className="font-medium text-foreground">{c.breadcrumb}</span>
      </motion.nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">{c.label}</p>
        <h1 className="mb-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl">{c.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{c.description}</p>
      </motion.div>

      {/* Workflow tiles (kwalitatief, geen cijfers) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="sr-only">{c.tilesHeading}</h2>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {c.tiles.map((tile) => (
            <li key={tile} className="rounded-xl border border-border/50 bg-card p-5">
              <p className="text-base font-semibold text-foreground">{tile}</p>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Body */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 max-w-3xl space-y-4 leading-relaxed text-muted-foreground"
      >
        {c.body.map((p) => <p key={p}>{p}</p>)}
      </motion.div>

      {/* Responsibilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 rounded-2xl border border-primary/20 bg-primary/5 p-8"
      >
        <h2 className="mb-4 font-display text-2xl font-medium text-foreground">{c.responsibilitiesHeading}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {c.responsibilities.map((item) => (
            <li key={item} className="flex gap-2 text-foreground">
              <span className="mt-1 text-primary" aria-hidden="true">&#10003;</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">{c.disclaimer}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {c.links.map((l, i) => (
            <span key={l.href}>{i > 0 && " · "}<Link to={l.href} className="underline hover:text-foreground">{l.label}</Link></span>
          ))}
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-border/50 bg-card p-8 text-center md:p-12"
      >
        <h2 className="mb-3 font-display text-2xl font-medium text-foreground md:text-3xl">{c.ctaTitle}</h2>
        <p className="mx-auto mb-6 max-w-lg text-muted-foreground">{c.ctaText}</p>
        <Link
          to="/about#contact"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {c.ctaButton}
          <ArrowRight size={16} />
        </Link>
      </motion.div>
    </section>
  );
};

export default CaseStudyDetail;
