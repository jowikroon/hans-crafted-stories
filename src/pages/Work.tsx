import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { getCaseStudies, CaseStudyRow } from "@/lib/api/content";
import CaseStudyCard from "@/components/CaseStudyCard";
import { usePageElements } from "@/hooks/usePageElements";

const Work = () => {
  const [studies, setStudies] = useState<CaseStudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVisible } = usePageElements("work");

  useEffect(() => {
    getCaseStudies(true).then((s) => { setStudies(s); setLoading(false); });
  }, []);

  const mapped = studies.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    description: s.description,
    image: s.image,
    year: s.year,
    externalUrl: s.external_url ?? undefined,
  }));

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
        </motion.nav>
      )}

      {isVisible("page_header") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Selected Work</p>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Case Studies
          </h1>
          <p className="mb-14 max-w-xl text-base leading-relaxed text-muted-foreground">
            A collection of design and creative projects — from e-commerce concepts to 3D experiments and VR games.
          </p>
        </motion.div>
      )}

      {isVisible("case_study_grid") && (
        <div className="grid gap-10 md:grid-cols-2">
          {mapped.map((study, i) => (
            <CaseStudyCard key={study.id} study={study} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Work;
