import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/components/LocalizedLink";
import { Home, ChevronRight } from "lucide-react";
import { getCaseStudies, CaseStudyRow } from "@/lib/api/content";
import CaseStudyCard from "@/components/CaseStudyCard";
import CategoryCards from "@/components/CategoryCards";
import { usePageElements } from "@/hooks/usePageElements";
import { useCategoryCards } from "@/hooks/useCategoryCards";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageContent } from "@/hooks/usePageContent";

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

const internalRoutes: Record<string, string> = {
  "connect-car-parts": "/work/connect-car-parts",
};

const Work = () => {
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { isVisible } = usePageElements("work");
  const { cards: dbCards } = useCategoryCards("work");
  const { lang } = useLang();
  const tw = translations[lang].work;
  const seo = translations[lang].seo;
  const { getValue } = usePageContent("work");

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
          "@id": "https://hansvanleeuwen.com/work#page",
          name: seo.workTitle,
          description: seo.workDescription,
          url: "https://hansvanleeuwen.com/work",
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
          author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: tw.label, item: "https://hansvanleeuwen.com/work" },
          ],
        },
      ],
    },
  });

  useEffect(() => {
    getCaseStudies(true).then((s) => {
      setStudies(s);
      setLoading(false);
    });
  }, []);

  const mapped = useMemo(
    () =>
      studies.map((s) => {
        const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return {
          id: s.id,
          title: s.title,
          titleNl: s.title_nl || undefined,
          category: s.category,
          description: s.description,
          descriptionNl: s.description_nl || undefined,
          image: s.image,
          year: s.year,
          externalUrl: s.external_url ?? undefined,
          internalUrl: internalRoutes[slug],
          filterGroup: categoryGroupMap[s.category] ?? "visual",
        };
      }),
    [studies]
  );

  // Inject CreativeWork JSON-LD for each case study
  useEffect(() => {
    const scriptId = "case-studies-jsonld";
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = scriptId;
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    const items = mapped.map((s, i) => ({
      "@type": "CreativeWork",
      "@id": `https://hansvanleeuwen.com/work#${s.id}`,
      position: i + 1,
      name: s.title,
      description: s.description,
      image: s.image,
      dateCreated: s.year,
      genre: s.category,
      author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
      ...(s.externalUrl ? { url: s.externalUrl } : { /* empty */ }),
    }));
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Design & UX Portfolio",
      itemListElement: items,
    });
    return () => { document.getElementById(scriptId)?.remove(); };
  }, [mapped]);

  const filtered = useMemo(() => {
    if (filter === "all") return mapped;
    return mapped.filter((s) => s.filterGroup === filter);
  }, [filter, mapped]);

  const getCount = (value: string) =>
    value === "all" ? mapped.length + 2 : mapped.filter((s) => s.filterGroup === value).length;

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <p className="text-muted-foreground">{getValue("work_loading_text", tw.loading)}</p>
      </section>
    );
  }

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
          {filter !== "all" && (
            <>
              <ChevronRight size={11} className="text-muted-foreground/40" />
              <span className="font-medium capitalize text-primary">
                {dbCards.find((c) => c.value === filter)?.label ?? filter}
              </span>
            </>
          )}
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
          <h1 className="hvl-page-title mb-4 text-foreground">
            {getValue("work_heading", tw.heading)}
          </h1>
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

      {filter === "all" && <div className="mb-10 grid gap-5 md:grid-cols-2">
      <Link
        to="/work/connect-car-parts"
        className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/40 sm:p-8"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {lang === "nl" ? "Uitgelichte AI-automation case" : "Featured AI automation case study"}
        </p>
        <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
          Connect Car Parts
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {lang === "nl"
            ? "Hoe ik productdata, AI-ondersteunde listingcontent en orderbewaking voor een auto-onderdelenbedrijf samenbreng. De case beschrijft circa 400 actieve SKU's en een intern gemeten daling van 45 naar 3 minuten contentcreatie per SKU."
            : "How I bring together product data, AI-assisted listing content and order monitoring for an automotive-parts business. The case documents about 400 active SKUs and an internally measured reduction from 45 to 3 minutes of content production per SKU."}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {lang === "nl" ? "Lees de case" : "Read the case study"} <ChevronRight size={16} />
        </span>
      </Link>
      <Link
        to={lang === "en" ? "/en/writing/vendor-of-seller-bol-com-alpine" : "/writing/vendor-of-seller-bol-com-alpine"}
        className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-secondary/40 sm:p-8"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {lang === "nl" ? "Uitgelichte marketplace case · 2021–2025" : "Featured marketplace case · 2021–2025"}
        </p>
        <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">Alpine Hearing Protection</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {lang === "nl"
            ? "Marketplace-expansie en een Bol.com vendor-naar-seller-transitie. Het merk behaalde 70% aandeel in de oordoppencategorie op Amazon NL (Nielsen, 2023); out-of-stock bleef onder 2% (2021–2022). Een Back-to-School social-ad-campagne leverde 20% meer wekelijkse verkopen op (eigen cv-materiaal)."
            : "Marketplace expansion and a Bol.com vendor-to-seller transition. The brand reached 70% of the earplug category on Amazon NL (Nielsen, 2023); out-of-stock remained below 2% (2021–2022). A Back-to-School social-ad campaign increased weekly sales by 20% (CV records)."}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {lang === "nl" ? "Lees de Bol.com-case" : "Read the Bol.com case (Dutch)"} <ChevronRight size={16} />
        </span>
      </Link>
      </div>}

      {isVisible("category_cards") && dbCards.length > 0 && (
        <CategoryCards
          cards={dbCards}
          activeValue={filter}
          getCount={getCount}
          onSelect={setFilter}
        />
      )}

      {/* Result count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 text-xs text-muted-foreground"
      >
        {filtered.length + (filter === "all" ? 2 : 0)} {filtered.length + (filter === "all" ? 2 : 0) === 1 ? tw.projectSingular : tw.projectPlural}
        {filter !== "all" && ` ${tw.matching}`}
      </motion.p>

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
    </section>
  );
};

export default Work;
