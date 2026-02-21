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
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover group cursor-pointer"
    >
      <Wrapper {...linkProps} className="block">
        <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
          {study.image && !study.image.includes("placeholder") ? (
            <img
              src={study.image}
              alt={study.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted transition-transform duration-700 group-hover:scale-105">
              <span className="font-display text-2xl text-muted-foreground/40">{study.category}</span>
            </div>
          )}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="mb-1 font-display text-lg font-medium leading-snug text-foreground">
              {study.title}
              {study.externalUrl && (
                <ExternalLink size={14} className="ml-2 inline-block text-muted-foreground" />
              )}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{study.description}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{study.year}</span>
        </div>
      </Wrapper>
    </motion.article>
  );
};

export default CaseStudyCard;
