import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, ChevronRight, Home, Receipt, XCircle } from "lucide-react";
import { Link } from "@/components/LocalizedLink";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { PERSON_ENTITY, PROFESSIONAL_SERVICE_ENTITY } from "@/lib/seo/sharedEntities";
import { absoluteUrl, BASE_URL } from "@/lib/i18n/routes";
import { PRICING_EN, PRICING_NL, RATES_PAGE, SERVICE_PAGES_UPDATED } from "@/data/servicePages";

const fade = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-60px" } as const,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const,
};
const h2 = "mb-6 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl";

/** /rates · /nl/tarieven — één plek voor de tariefvraag, met dezelfde bedragen als de dienstenpagina's (data/servicePages.ts). */
const Rates = () => {
  const { lang } = useLang();
  const t = RATES_PAGE[lang];
  const pricing = lang === "nl" ? PRICING_NL : PRICING_EN;
  const canonical = absoluteUrl("/rates", lang);

  useSEO({
    title: t.title,
    description: t.metaDesc,
    path: "/rates",
    lang,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        PERSON_ENTITY,
        PROFESSIONAL_SERVICE_ENTITY,
        { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: t.title, description: t.metaDesc, isPartOf: { "@id": `${BASE_URL}/#website` }, about: { "@id": `${BASE_URL}/#person` }, dateModified: SERVICE_PAGES_UPDATED, inLanguage: lang },
        { "@type": "BreadcrumbList", itemListElement: [ { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/", lang) }, { "@type": "ListItem", position: 2, name: t.breadcrumb, item: canonical } ] },
        { "@type": "FAQPage", "@id": `${canonical}#faq`, mainEntity: t.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Receipt size={20} /></div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">{t.breadcrumb}</p>
        </div>
        <h1 className="mb-6 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">{t.h1}</h1>
        <p className="mb-12 max-w-3xl text-lg leading-relaxed text-foreground/90">{t.intro}</p>
      </motion.div>

      <motion.div {...fade} className="mb-16">
        <h2 className={h2}>{pricing.heading}</h2>
        <dl className="mb-4 grid gap-4 sm:grid-cols-3">
          {pricing.models.map((m) => (
            <div key={m.name} className="rounded-xl border-2 border-border/40 bg-card p-5">
              <dt className="mb-2 font-display text-lg font-semibold text-foreground">{m.name}</dt>
              <dd className="text-sm leading-relaxed text-muted-foreground">{m.fit}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{pricing.note}</p>
      </motion.div>

      <div className="mb-16 grid gap-10 md:grid-cols-2">
        <motion.div {...fade}>
          <h2 className={h2}>{t.includedHeading}</h2>
          <ul className="space-y-3" role="list">
            {t.included.map((i) => (<li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground"><CheckCircle size={18} className="mt-0.5 shrink-0 text-primary" />{i}</li>))}
          </ul>
        </motion.div>
        <motion.div {...fade}>
          <h2 className={h2}>{t.notIncludedHeading}</h2>
          <ul className="space-y-3" role="list">
            {t.notIncluded.map((i) => (<li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground"><XCircle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />{i}</li>))}
          </ul>
        </motion.div>
      </div>

      <motion.div {...fade} className="mb-16 max-w-3xl">
        <h2 className={h2}>{t.compareHeading}</h2>
        <p className="mb-6 text-base leading-relaxed text-foreground/90">{t.compareIntro}</p>
        <div className="overflow-hidden rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <tbody>
              {t.compare.map((row) => (
                <tr key={row.label} className="border-b border-border/40 last:border-0">
                  <th scope="row" className="bg-card px-4 py-3 text-left font-semibold text-foreground">{row.label}</th>
                  <td className="px-4 py-3 text-foreground">{row.value}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <Link to="/interim-ecommerce-manager" className="underline hover:text-foreground">{lang === "nl" ? "Interim e-commerce manager inhuren" : "Interim e-commerce manager"}</Link>
          {" · "}
          <Link to="/amazon-nl-specialist" className="underline hover:text-foreground">{lang === "nl" ? "Amazon NL specialist inhuren" : "Amazon NL specialist"}</Link>
          {" · "}
          <Link to="/bol-com-consultant" className="underline hover:text-foreground">{lang === "nl" ? "Bol.com consultant inhuren" : "Bol.com consultant"}</Link>
        </p>
      </motion.div>
    </section>
  );
};

export default Rates;
