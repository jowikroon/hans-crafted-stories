import { motion } from "framer-motion";
import { ArrowRight, Bot, Briefcase, CheckCircle, ChevronRight, Home, ShoppingCart, Store } from "lucide-react";
import { Link } from "@/components/LocalizedLink";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { PERSON_ENTITY, PROFESSIONAL_SERVICE_ENTITY } from "@/lib/seo/sharedEntities";
import { absoluteUrl, BASE_URL } from "@/lib/i18n/routes";
import { SERVICE_BYLINE, SERVICE_PAGES_UPDATED, type ServicePageDef } from "@/data/servicePages";
import hansProfile from "@/assets/hans-profile.jpg";

const fade = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const,
};

const ICONS = { briefcase: Briefcase, cart: ShoppingCart, store: Store, bot: Bot } as const;

const formatDate = (iso: string, lang: "nl" | "en") =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

const h2 = "mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl";

/**
 * Gedeelde opbouw van de vier dienstenpagina's. Volgorde is bewust answer-first:
 * wie/wat/voor wie/resultaat staan in de eerste 30% van de pagina, daarna bewijs,
 * werkwijze, tarief en zichtbare Q&A. Zie data/servicePages.ts voor de inhoud.
 */
const ServicePage = ({ page }: { page: ServicePageDef }) => {
  const { lang } = useLang();
  const t = page.copy[lang];
  const byline = SERVICE_BYLINE[lang];
  const Icon = ICONS[page.icon];
  const canonical = absoluteUrl(page.path, lang);

  useSEO({
    title: t.title,
    description: t.metaDesc,
    path: page.path,
    lang,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON_ENTITY,
        PROFESSIONAL_SERVICE_ENTITY,
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: t.title,
          description: t.metaDesc,
          isPartOf: { "@id": `${BASE_URL}/#website` },
          about: { "@id": `${BASE_URL}/#person` },
          author: { "@id": `${BASE_URL}/#person` },
          dateModified: SERVICE_PAGES_UPDATED,
          inLanguage: lang,
        },
        {
          "@type": "Service",
          "@id": `${canonical}#service`,
          name: page.serviceName,
          url: canonical,
          provider: { "@id": `${BASE_URL}/#organization` },
          areaServed: [
            { "@type": "Country", name: "Netherlands" },
            { "@type": "Place", name: "European Union" },
          ],
          description: t.metaDesc,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) },
            { "@type": "ListItem", position: 2, name: t.breadcrumb, item: canonical },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${canonical}#faq`,
          mainEntity: t.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">{t.eyebrow}</p>
        </div>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">{t.h1}</h1>
        <p className="mb-6 font-display text-base font-medium text-muted-foreground md:text-lg">{t.subtitle}</p>
        <p className="mb-8 max-w-3xl text-lg leading-relaxed text-foreground/90">{t.intro}</p>

        {/* Byline: de "wie" achter de pagina, zichtbaar en gelinkt (E-E-A-T). */}
        <div className="mb-14 flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-card p-4 text-sm">
          <img src={hansProfile} alt={byline.name} width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 rounded-full object-cover object-top" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{byline.name}</p>
            <p className="text-muted-foreground">{byline.role}</p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:text-right">
            <span>{byline.updated}: <time dateTime={SERVICE_PAGES_UPDATED}>{formatDate(SERVICE_PAGES_UPDATED, lang)}</time></span>
            <span>
              <Link to="/about" className="underline hover:text-foreground">{byline.about}</Link>
              {" · "}
              <a href="https://www.linkedin.com/in/hansvl3" rel="me noopener noreferrer" target="_blank" className="underline hover:text-foreground">{byline.linkedin}</a>
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className={h2}>{t.whenHeading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.when.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className={h2}>{t.servicesHeading}</h2>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {t.services.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card p-4">
              <CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className={h2}>{t.resultsHeading}</h2>
        <div className={`grid gap-6 ${t.results.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
          {t.results.map((r) => (
            <div key={r.desc} className="rounded-xl border-2 border-border/40 bg-card p-6 text-center">
              <p className="mb-2 font-display text-3xl font-bold text-primary">{r.stat}</p>
              <p className="text-sm text-foreground">{r.desc}</p>
              <p className="mt-2 text-xs text-muted-foreground">{r.source}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className={h2}>{t.practiceHeading}</h2>
        <p className="mb-6 max-w-3xl text-base leading-relaxed text-muted-foreground">{t.practiceIntro}</p>
        <div className="grid gap-6 md:grid-cols-2">
          {t.practice.map((c) => (
            <article key={c.href + c.title} className="flex flex-col rounded-xl border border-border/40 bg-card p-6">
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-foreground/90">{c.summary}</p>
              <Link to={c.href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                {c.linkLabel} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16 max-w-3xl">
        <h2 className={h2}>{t.approachHeading}</h2>
        <div className="space-y-5 text-base leading-relaxed text-foreground/90">
          {t.approach.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </motion.div>

      <motion.div {...fade} className="mb-16 max-w-3xl">
        <h2 className={h2}>{t.pricingHeading}</h2>
        <p className="mb-5 text-base leading-relaxed text-foreground/90">{t.pricingIntro}</p>
        <dl className="mb-5 grid gap-4 sm:grid-cols-3">
          {t.pricing.map((m) => (
            <div key={m.name} className="rounded-lg border border-border/40 bg-card p-4">
              <dt className="mb-1 font-semibold text-foreground">{m.name}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{m.fit}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.pricingNote}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16 max-w-3xl">
        <h2 className={h2}>{t.faqHeading}</h2>
        <div className="divide-y divide-border/40">
          {t.faq.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{f.q}</h3>
              <p className="text-base leading-relaxed text-foreground/90">{f.a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fade} className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center md:p-12">
        <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t.ctaHeading}</h2>
        <p className="mx-auto mb-6 max-w-xl text-sm text-muted-foreground">{t.ctaText}</p>
        <Link to="/about#contact" className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:opacity-90">
          {t.ctaButton} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-6 text-xs text-muted-foreground">
          {t.related.map((r, i) => (
            <span key={r.href}>
              {i > 0 && " · "}
              <Link to={r.href} className="underline hover:text-foreground">{r.label}</Link>
            </span>
          ))}
        </p>
      </motion.div>
    </section>
  );
};

export default ServicePage;
