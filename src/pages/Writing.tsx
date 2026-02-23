import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { blogPosts } from "@/data/content";
import BlogPostCard from "@/components/BlogPostCard";

type Filter = "all" | "professional" | "personal";
type TagFilter = string | null;

const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));

const Writing = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let posts = blogPosts;
    if (filter !== "all") posts = posts.filter((p) => p.category === filter);
    if (tagFilter) posts = posts.filter((p) => p.tags.includes(tagFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts;
  }, [filter, tagFilter, search]);

  const activeTags = useMemo(() => {
    const postsForCategory =
      filter === "all" ? blogPosts : blogPosts.filter((p) => p.category === filter);
    return Array.from(new Set(postsForCategory.flatMap((p) => p.tags)));
  }, [filter]);

  const filters: { label: string; value: Filter; count: number }[] = [
    { label: "All", value: "all", count: blogPosts.length },
    { label: "Professional", value: "professional", count: blogPosts.filter((p) => p.category === "professional").length },
    { label: "Personal", value: "personal", count: blogPosts.filter((p) => p.category === "personal").length },
  ];

  const clearAll = () => {
    setFilter("all");
    setTagFilter(null);
    setSearch("");
  };

  const hasActiveFilters = filter !== "all" || tagFilter !== null || search.trim() !== "";

  return (
    <section className="section-container pt-28 pb-20">
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

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 space-y-4"
      >
        {/* Search + Category Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-0.5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setTagFilter(null);
                }}
                className={`relative rounded-md px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
                  filter === f.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span
                  className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums ${
                    filter === f.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground/60"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        <AnimatePresence mode="wait">
          {activeTags.length > 0 && (
            <motion.div
              key={filter}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <SlidersHorizontal size={13} className="mr-1 text-muted-foreground/40" />
                {activeTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase transition-all duration-200 ${
                      tagFilter === tag
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}

                {/* Clear all */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <X size={11} />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Result count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 text-xs text-muted-foreground/60"
      >
        {filtered.length} {filtered.length === 1 ? "post" : "posts"}
        {hasActiveFilters && " matching"}
      </motion.p>

      {/* Posts */}
      <div>
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-2 text-muted-foreground">No posts match your filters.</p>
            <button
              onClick={clearAll}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Writing;
