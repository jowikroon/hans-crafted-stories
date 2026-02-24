import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { getCaseStudies, CaseStudyRow } from "@/lib/api/content";
import CaseStudyCard from "@/components/CaseStudyCard";
import CategoryCards from "@/components/CategoryCards";
import { usePageElements } from "@/hooks/usePageElements";
import { useCategoryCards } from "@/hooks/useCategoryCards";
import { useSEO } from "@/hooks/useSEO";

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

const Work = () => {
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { isVisible } = usePageElements("work");
  const { cards: dbCards } = useCategoryCards("work");

  useSEO({
    title: "Design Portfolio & Case Studies | E-commerce, 3D & UX | Hans van Leeuwen",
    description: "Explore Hans van Leeuwen's portfolio: e-commerce UX case studies, 3D creative work, VR game design, and branding projects with measurable results. Amazon & Bol.com specialist.",
    url: "https://hansvanleeuwen.com/work",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Design Portfolio & Case Studies",
      description: "A collection of e-commerce UX, 3D creative, VR game design, and branding case studies by Hans van Leeuwen.",
      url: "https://hansvanleeuwen.com/work",
      author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
      about: { "@type": "Thing", name: "E-commerce Design & Creative Portfolio" },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", position: 2, name: "Work", item: "https://hansvanleeuwen.com/work" },
        ],
      },
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
      studies.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        description: s.description,
        image: s.image,
        year: s.year,
        externalUrl: s.external_url ?? undefined,
        filterGroup: categoryGroupMap[s.category] ?? "visual",
      })),
    [studies]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return mapped;
    return mapped.filter((s) => s.filterGroup === filter);
  }, [filter, mapped]);

  const getCount = (value: string) =>
    value === "all" ? mapped.length : mapped.filter((s) => s.filterGroup === value).length;

  if (loading) {
    return (
      <section className="section-container pt-28">
        <p className="text-muted-foreground">Loading…</p>
      </section>
    );
  }

  return (
    <section className="section-container pt-28 pb-20">
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
          <span className="font-medium text-foreground">Work</span>
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
            Portfolio & Case Studies
          </p>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            E-commerce, 3D & UX Design Work
          </h1>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">
            A curated collection of case studies — from Amazon & Bol.com e-commerce UX concepts 
            to 3D creative experiments, VR games, and branding projects. Each project features 
            real results and measurable outcomes.
          </p>
        </motion.div>
      )}

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
        className="mb-6 text-xs text-muted-foreground/60"
      >
        {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        {filter !== "all" && " matching"}
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
          <p className="mb-2 text-muted-foreground">No projects in this category.</p>
          <button
            onClick={() => setFilter("all")}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Show all projects
          </button>
        </div>
      )}
    </section>
  );
};

export default Work;
