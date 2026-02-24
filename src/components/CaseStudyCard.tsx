import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { CaseStudy } from "@/data/types";

const CaseStudyCard = ({ study, index }: { study: CaseStudy; index: number }) => {
  const Wrapper = study.externalUrl ? "a" : "div";
  const linkProps = study.externalUrl
    ? { href: study.externalUrl, target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <Wrapper {...linkProps} className="group block overflow-hidden rounded-xl border-2 border-border/50 bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {study.image && !study.image.includes("placeholder") ? (
            <img
              src={study.image}
              alt={study.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <span className="font-display text-2xl text-muted-foreground/30">{study.category}</span>
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Year badge */}
          <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground backdrop-blur-sm">
            {study.year}
          </div>

          {/* External link indicator on hover */}
          {study.externalUrl && (
            <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
              <ExternalLink size={14} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {study.category}
            </span>
          </div>
          <h3 className="mb-1 font-display text-base font-medium leading-snug text-foreground line-clamp-1">
            {study.title}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{study.description}</p>
        </div>
      </Wrapper>
    </motion.article>
  );
};

export default CaseStudyCard;
