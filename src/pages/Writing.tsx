import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { blogPosts } from "@/data/content";
import BlogPostCard from "@/components/BlogPostCard";

type Filter = "all" | "professional" | "personal";
type TagFilter = string | null;

const professionalTags = ["E-commerce", "AI", "UX"];

const Writing = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);

  const filtered = useMemo(() => {
    let posts = blogPosts;
    if (filter !== "all") posts = posts.filter((p) => p.category === filter);
    if (tagFilter) posts = posts.filter((p) => p.tags.includes(tagFilter));
    return posts;
  }, [filter, tagFilter]);

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Professional", value: "professional" },
    { label: "Personal", value: "personal" },
  ];

  return (
    <section className="section-container pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Writing</p>
        <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          Thoughts &amp; Essays
        </h1>
        <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">
          On design, e-commerce, technology, and life beyond the screen.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setTagFilter(null); }}
            className={`filter-chip ${filter === f.value ? "active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tag sub-filters for professional */}
      <AnimatePresence>
        {filter === "professional" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 flex flex-wrap gap-2 overflow-hidden"
          >
            {professionalTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`filter-chip ${tagFilter === tag ? "active" : ""}`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      <div>
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No posts match this filter.</p>
        )}
      </div>
    </section>
  );
};

export default Writing;
