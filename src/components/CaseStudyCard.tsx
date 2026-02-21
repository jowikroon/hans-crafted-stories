import { motion } from "framer-motion";
import { CaseStudy } from "@/data/types";

const CaseStudyCard = ({ study, index }: { study: CaseStudy; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    className="card-hover group cursor-pointer"
  >
    <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted transition-transform duration-700 group-hover:scale-105">
        <span className="font-display text-2xl text-muted-foreground/40">{study.category}</span>
      </div>
    </div>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="mb-1 font-display text-lg font-medium leading-snug text-foreground">
          {study.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{study.description}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{study.year}</span>
    </div>
  </motion.article>
);

export default CaseStudyCard;
