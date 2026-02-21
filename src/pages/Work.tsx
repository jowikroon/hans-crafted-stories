import { motion } from "framer-motion";
import { caseStudies } from "@/data/content";
import CaseStudyCard from "@/components/CaseStudyCard";

const Work = () => (
  <section className="section-container pt-28">
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

    <div className="grid gap-10 md:grid-cols-2">
      {caseStudies.map((study, i) => (
        <CaseStudyCard key={study.id} study={study} index={i} />
      ))}
    </div>
  </section>
);

export default Work;
