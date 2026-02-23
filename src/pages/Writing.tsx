import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, ArrowUpDown, Home, ChevronRight, Briefcase, Heart, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import { getBlogPosts, BlogPostRow } from "@/lib/api/content";
import BlogPostCard from "@/components/BlogPostCard";
import { usePageElements } from "@/hooks/usePageElements";

type Filter = "all" | "professional" | "personal";
type TagFilter = string | null;
type SortOrder = "newest" | "oldest";

const categoryCards: { label: string; value: Filter; icon: React.ReactNode; color: string; activeColor: string; description: string }[] = [
  {
    label: "All",
    value: "all",
    icon: <LayoutGrid size={18} />,
    color: "from-primary/5 to-primary/10 text-primary border-primary/15 hover:border-primary/30",
    activeColor: "from-primary/15 to-primary/25 text-primary border-primary/40 shadow-md shadow-primary/10",
    description: "Everything",
  },
  {
    label: "Professional",
    value: "professional",
    icon: <Briefcase size={18} />,
    color: "from-emerald-500/5 to-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/15 hover:border-emerald-500/30",
    activeColor: "from-emerald-500/15 to-emerald-600/25 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-500/10",
    description: "E-commerce & Strategy",
  },
  {
    label: "Personal",
    value: "personal",
    icon: <Heart size={18} />,
    color: "from-amber-500/5 to-amber-600/10 text-amber-700 dark:text-amber-400 border-amber-500/15 hover:border-amber-500/30",
    activeColor: "from-amber-500/15 to-amber-600/25 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/10",
    description: "Life & Reflections",
  },
];

const Writing = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const { isVisible } = usePageElements("writing");

  useEffect(() => {
    getBlogPosts(true).then((p) => { setBlogPosts(p); setLoading(false); });
  }, []);

  const mappedPosts = useMemo(() =>
    blogPosts.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category as "professional" | "personal",
      tags: p.tags,
      date: p.created_at,
      readTime: p.read_time,
      slug: p.slug,
    })),
  [blogPosts]);

  const filtered = useMemo(() => {
    let posts = mappedPosts;
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
    posts = [...posts].sort((a, b) =>
      sort === "newest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return posts;
  }, [filter, tagFilter, search, sort, mappedPosts]);

  const activeTags = useMemo(() => {
    const postsForCategory =
      filter === "all" ? mappedPosts : mappedPosts.filter((p) => p.category === filter);
    return Array.from(new Set(postsForCategory.flatMap((p) => p.tags)));
  }, [filter, mappedPosts]);

  const getCategoryCount = (value: Filter) =>
    value === "all" ? mappedPosts.length : mappedPosts.filter((p) => p.category === value).length;

  const clearAll = () => {
    setFilter("all");
    setTagFilter(null);
    setSearch("");
  };

  const hasActiveFilters = filter !== "all" || tagFilter !== null || search.trim() !== "";

  if (loading) {
    return (
      <section className="section-container pt-28 pb-20">
        <p className="text-muted-foreground">Loading…</p>
      </section>
    );
  }

  return (
    <section className="section-container pt-28 pb-20">
      {/* Breadcrumb */}
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
          <span className="font-medium text-foreground">Writing</span>
          {filter !== "all" && (
            <>
              <ChevronRight size={11} className="text-muted-foreground/40" />
              <span className="font-medium capitalize text-primary">{filter}</span>
            </>
          )}
          {tagFilter && (
            <>
              <ChevronRight size={11} className="text-muted-foreground/40" />
              <span className="uppercase tracking-wide text-primary/70">{tagFilter}</span>
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
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">Writing</p>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Thoughts &amp; Essays
          </h1>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">
            On design, e-commerce, technology, and life beyond the screen.
          </p>
        </motion.div>
      )}

      {/* Category Cards */}
      {isVisible("category_cards") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 grid grid-cols-3 gap-3"
        >
          {categoryCards.map((cat, i) => {
            const isActive = filter === cat.value;
            const count = getCategoryCount(cat.value);
            return (
              <motion.button
                key={cat.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 + i * 0.06 }}
                onClick={() => { setFilter(cat.value); setTagFilter(null); }}
                className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-left transition-all duration-300 ${
                  isActive ? cat.activeColor : cat.color
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                    {cat.icon}
                  </div>
                  <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                    isActive ? "bg-background/80 shadow-sm" : "bg-background/40"
                  }`}>
                    {count}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{cat.label}</p>
                <p className="mt-0.5 text-[11px] opacity-60">{cat.description}</p>
                {isActive && (
                  <motion.div
                    layoutId="categoryIndicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-40"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Search + Sort row */}
      {(isVisible("search_bar") || isVisible("sort_button") || isVisible("tag_filters")) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 space-y-3"
        >
          <div className="flex items-center gap-2">
            {isVisible("search_bar") && (
              <div className="relative flex-1">
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
            )}

            {isVisible("sort_button") && (
              <button
                onClick={() => setSort(sort === "newest" ? "oldest" : "newest")}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-3 text-xs font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                <ArrowUpDown size={13} />
                <span className="hidden sm:inline">{sort === "newest" ? "Newest" : "Oldest"}</span>
              </button>
            )}
          </div>

          {isVisible("tag_filters") && (
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
                        className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide uppercase transition-all duration-200 ${
                          tagFilter === tag
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAll}
                        className="ml-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground/60 transition-colors hover:text-foreground"
                      >
                        <X size={11} />
                        Clear
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {isVisible("post_count") && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-xs text-muted-foreground/60"
        >
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          {hasActiveFilters && " matching"}
        </motion.p>
      )}

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
