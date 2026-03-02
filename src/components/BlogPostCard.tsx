import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BlogPost } from "@/data/types";
import { useLang } from "@/hooks/useLang";

const CATEGORY_COLORS: Record<string, string> = {
  professional: "bg-primary/90 text-primary-foreground",
  personal: "bg-amber-600/90 text-white",
};

const BlogPostCard = ({ post, index }: { post: BlogPost; index: number }) => {
  const { lang } = useLang();
  const displayTitle = (lang === "nl" && post.titleNl) ? post.titleNl : post.title;
  const postNumber = String(index + 1).padStart(3, "0");
  const categoryColor = CATEGORY_COLORS[post.category] ?? "bg-muted text-foreground";
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.article
      layout
      layoutId={post.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1], layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
    >
      <Link
        to={`/writing/${post.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-border"
      >
        <div className="relative aspect-[4/3]">
          {/* Cover image or gradient fallback */}
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={displayTitle}
              width={640}
              height={480}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary" />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top badges row */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${categoryColor}`}>
              {post.category}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {dateStr}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <div className="flex-1">
              <span className="mb-1 block font-mono text-xs tracking-wider text-white/50">
                {postNumber}
              </span>
              <h3 className="font-display text-xl font-semibold leading-tight text-white md:text-2xl">
                {displayTitle}
              </h3>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default BlogPostCard;
