import { useState, useEffect, useMemo, useCallback } from "react";
import DisplayHeading from "@/components/DisplayHeading";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/components/LocalizedLink";
import { Home, ChevronRight, ArrowRight } from "lucide-react";
import { getCaseStudies, CaseStudyRow } from "@/lib/api/content";
import CaseStudyCard from "@/components/CaseStudyCard";
import CategoryCards from "@/components/CategoryCards";
import { usePageElements } from "@/hooks/usePageElements";
import { useCategoryCards } from "@/hooks/useCategoryCards";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageContent } from "@/hooks/usePageContent";
import { usePreloadedCaseStudies } from "@/contexts/PreloadedDataContext";
import { MARKETPLACE_CASES } from "@/data/marketplaceCases";

// Map detailed categories to filter groups
const categoryGroupMap: Record<string, string> = {
  "3D / Creative": "3d-vr",
  "3D Design": "3d-vr",
  "VR / Game Design": "3d-vr",
  "Game Design": "3d-vr",
  "Creative / Campaign": "visual",
  "Infographic": "visual",
  "Typography": "visual",
  "E-commerce / UX": "web-ux",
  "Web Design": "web-ux",
};

type LoadState = "loading" | "ready" | "error";

/**
 * /work — twee duidelijk gescheiden groepen (audit F2.6/F5.2):
 *  1. zakelijke marketplace-cases uit data/marketplaceCases.ts (code, altijd in HTML én DOM);
 *  2. creatieve projecten uit het CMS (case_studies). De prerender laadt dezelfde query en
 *     geeft die als __PRELOADED__ mee, zodat HTML en browser dezelfde verzameling tonen.
 * Een CMS-fout geeft een herstelbare foutmelding i.p.v. eindeloos "Loading…" (F2.7).
 */
const Work = () => {
  const preloaded = usePreloadedCaseStudies();
  const [studies, setStudies] = useState<CaseStudyRow[]>(preloaded ?? []);
  const [state, setState] = useState<LoadState>(preloaded ? "ready" : "loading");
  const [filter, setFilter] = useState("all");
  const { isVisible } = usePageElements("work");
  const { cards: dbCards } = useCategoryCards("work");
  const { lang } = useLang();
  const tw = translations[lang].work;
  const seo = translations[lang].seo;
  const { getValue: getCmsValue } = usePageContent("work");
  // De H1 is code-eigendom: prerender (zonder CMS) en browser tonen zo altijd dezelfde kop (B2-pariteit).
  const getValue = (key: string, fallback: string) => (key === "work_heading" ? fallback : getCmsValue(key, fallback));
  const prefix = lang === "nl" ? "/nl" : "";

  useSEO({
    title: seo.workTitle,
    description: seo.workDescription,
    path: "/work",
    lang,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": `https://hansvanleeuwen.com${prefix}/work#page`,
          name: seo.workTitle,
          description: seo.workDescription,
          url: `https://hansvanleeuwen.com${prefix}/work`,
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
          author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
          inLanguage: lang,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `https://hansvanleeuwen.com${prefix || "/"}` },
            { "@type": "ListItem", position: 2, name: tw.label, item: `https://hansvanleeuwen.com${prefix}/work` },
          ],
        },
      ],
    },
  });

  const load = useCallback(() => {
    setState("loading");
    getCaseStudies(true)
      .then((s) => {
        setStudies(s);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    // Met preloaded data (prerender) niet opnieuw laden: dezelfde verzameling als de HTML.
    if (!preloaded) load();
  }, [preloaded, load]);

  const localizeCategory = useCallback(
    (category: string) => tw.categoryLabels[category] ?? category,
    [tw],
  );

  const mapped = useMemo(
    () =>
      studies.map((s) => ({
        id: s.id,
        title: s.title,
        titleNl: s.title_nl || undefined,
        category: localizeCategory(s.category),
        description: s.description,
        descriptionNl: s.description_nl || undefined,
        image: s.image,
        year: s.year,
        externalUrl: s.external_url ?? undefined,
        filterGroup: categoryGroupMap[s.category] ?? "visual",
      })),
    [studies, localizeCategory],
  );

  // Eén ItemList met eerst de zakelijke case(s), dan de creatieve projecten.
  useEffect(() => {
    const scriptId = "case-studies-jsonld";
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const business = MARKETPLACE_CASES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://hansvanleeuwen.com${prefix}${c.path}`,
      name: c.copy[lang].title,
    }));
    const creative = mapped.map((s, i) => ({
      "@type": "ListItem",
      position: business.length + i + 1,
      item: {
        "@type": "CreativeWork",
        "@id": `https://hansvanleeuwen.com/work#${s.id}`,
        name: s.title,
        description: s.description,
        image: s.image,
        dateCreated: s.year,
        genre: s.category,
        author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
        ...(s.externalUrl ? { url: s.externalUrl } : { /* empty */ }),
      },
    }));
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: seo.workTitle,
      itemListElement: [...business, ...creative],
    });
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [mapped, lang, prefix, seo.workTitle]);

  const filtered = useMemo(() => {
    if (filter === "all") return mapped;
    return mapped.filter((s) => s.filterGroup === filter);
  }, [filter, mapped]);

  const getCount = (value: string) =>
    value === "all" ? mapped.length : mapped.filter((s) => s.filterGroup === value).length;

  const cards = useMemo(
    () => dbCards.map((c) => ({ ...c, ...(tw.filterLabels[c.value] ?? {}) })),
    [dbCards, tw],
  );

  return (
    <section className="mx-auto max-w-6xl px-6 pt-6 pb-20">
      {isVisible("breadcrumb") && (
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
          <span className="font-medium text-foreground">{tw.label}</span>
        </motion.nav>
      )}

      {isVisible("page_header") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {getValue("work_label", tw.label)}
          </p>
          <DisplayHeading as="h1" className="mb-4">
            {getValue("work_heading", tw.heading)}
          </DisplayHeading>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">
            {getValue("work_description", tw.description)}
          </p>
          <p className="mb-10 text-sm text-muted-foreground">
            {tw.relatedHeading}:{" "}
            <Link to="/writing" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {tw.linkWriting}
            </Link>
            {" · "}
            <Link to="/about" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {tw.linkAbout}
            </Link>
            {" · "}
            <Link to="/amazon-nl-specialist" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {tw.linkAmazonNl}
            </Link>
            {" · "}
            <Link to="/bol-com-consultant" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {tw.linkBolCom}
            </Link>
          </p>
        </motion.div>
      )}

      {/* 1. Zakelijke marketplace-cases (code-bron, identiek in prerender en browser) */}
      <section aria-labelledby="work-cases-heading" className="mb-16">
        <h2 id="work-cases-heading" className="mb-2 font-display text-2xl font-medium text-foreground">{tw.casesHeading}</h2>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{tw.casesIntro}</p>
        <ul className="grid gap-5 md:grid-cols-2">
          {MARKETPLACE_CASES.map((c) => (
            <li key={c.slug}>
              <Link
                to={c.path}
                className="group block h-full rounded-xl border-2 border-primary/20 bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">{c.copy[lang].label}</p>
                <DisplayHeading as="h3" size="card" className="mb-2">{c.copy[lang].title}</DisplayHeading>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{c.copy[lang].cardSummary}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {tw.readCase} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 2. Creatieve projecten (CMS) — aparte, herkenbare categorie */}
      <section aria-labelledby="work-creative-heading">
        <h2 id="work-creative-heading" className="mb-2 font-display text-2xl font-medium text-foreground">{tw.creativeHeading}</h2>
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{tw.creativeIntro}</p>

        {state === "loading" && (
          <p className="text-muted-foreground" role="status">{getValue("work_loading_text", tw.loading)}</p>
        )}

        {state === "error" && (
          <div className="rounded-xl border border-border/60 bg-card p-6" role="alert">
            <p className="mb-3 text-sm text-foreground">{tw.loadError}</p>
            <button
              onClick={load}
              className="rounded-full border-2 border-border px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              {tw.retry}
            </button>
          </div>
        )}

        {state === "ready" && (
          <>
            {isVisible("category_cards") && cards.length > 0 && (
              <CategoryCards cards={cards} activeValue={filter} getCount={getCount} onSelect={setFilter} />
            )}

            <p className="mb-6 text-xs text-muted-foreground" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? tw.projectSingular : tw.projectPlural}
              {filter !== "all" && ` ${tw.matching}`}
            </p>

            {isVisible("case_study_grid") && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((study, i) => (
                    <CaseStudyCard key={study.id} study={study} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="mb-2 text-muted-foreground">{getValue("work_no_projects_title", tw.noProjectsTitle)}</p>
                <button
                  onClick={() => setFilter("all")}
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {getValue("work_show_all_label", tw.showAll)}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
};

export default Work;
