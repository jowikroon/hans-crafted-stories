import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, ArrowUpDown, Home, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getBlogPosts, BlogPostRow } from "@/lib/api/content";
import BlogPostCard from "@/components/BlogPostCard";
import CategoryCards from "@/components/CategoryCards";
import { usePageElements } from "@/hooks/usePageElements";
import { useCategoryCards } from "@/hooks/useCategoryCards";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePageContent } from "@/hooks/usePageContent";

type Filter = string;
type TagFilter = string | null;
type SortOrder = "newest" | "oldest";

const TAG_CATEGORY_COLORS: Record<string, { bg: string; active: string }> = {
  professional: {
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
    active: "bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30",
  },
  personal: {
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
    active: "bg-amber-500/25 text-amber-800 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/30",
  },
};

const Writing = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const { isVisible } = usePageElements("writing");
  const { cards: dbCards } = useCategoryCards("writing");
  const { lang } = useLang();
  const t = translations[lang].writing;
  const seo = translations[lang].seo;
  const { getValue } = usePageContent("writing");
  useSEO({
    title: seo.writingTitle,
    description: seo.writingDescription,
    url: "https://hansvanleeuwen.com/writing",
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/writing" },
      { lang: "nl", href: "https://hansvanleeuwen.com/writing" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/writing" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://hansvanleeuwen.com/writing#page",
          name: t.heading,
          description: seo.writingDescription,
          url: "https://hansvanleeuwen.com/writing",
          isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
          about: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person" },
          author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
            { "@type": "ListItem", position: 2, name: t.label, item: "https://hansvanleeuwen.com/writing" },
          ],
        },
      ],
    },
  });

  useEffect(() => {
    getBlogPosts(true).then((p) => { setBlogPosts(p); setLoading(false); });
  }, []);

  const mappedPosts = useMemo(() =>
    blogPosts.map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      titleNl: p.title_nl || undefined,
      excerptNl: p.excerpt_nl || undefined,
      category: p.category as "professional" | "personal",
      tags: p.tags,
      date: p.created_at,
      readTime: p.read_time,
      slug: p.slug,
      imageUrl: p.image_url || undefined,
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

  // Map each tag to its dominant category for color coding
  const tagCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const post of mappedPosts) {
      for (const tag of post.tags) {
        if (!map[tag]) map[tag] = post.category;
      }
    }
    return map;
  }, [mappedPosts]);

  const getTagColors = (tag: string, isActive: boolean) => {
    const category = tagCategoryMap[tag];
    const colors = TAG_CATEGORY_COLORS[category];
    if (!colors) {
      return isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground";
    }
    return isActive ? colors.active : colors.bg;
  };

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
        <p className="text-muted-foreground">{getValue("writing_loading_text", t.loading)}</p>
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
          <span className="font-medium text-foreground">{t.label}</span>
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
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">{getValue("writing_label", t.label)}</p>
          <h1 className="mb-4 font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            {getValue("writing_heading", t.heading)}
          </h1>
          <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground">
            {getValue("writing_subtitle", t.subtitle)}
          </p>
          <p className="mb-10 text-sm text-muted-foreground">
            {t.relatedHeading} —{" "}
            <Link to="/work" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.linkWork}
            </Link>
            {" · "}
            <Link to="/about" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.linkAbout}
            </Link>
            {" · "}
            <Link to="/amazon-nl-specialist" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.linkAmazonNl}
            </Link>
            {" · "}
            <Link to="/bol-com-consultant" className="font-semibold text-foreground underline-offset-4 hover:underline">
              {t.linkBolCom}
            </Link>
          </p>
        </motion.div>
      )}

      {/* Category Cards */}
      {isVisible("category_cards") && dbCards.length > 0 && (
        <CategoryCards
          cards={dbCards}
          activeValue={filter}
          getCount={getCategoryCount}
          onSelect={(value) => { setFilter(value); setTagFilter(null); }}
        />
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
                  placeholder={getValue("writing_search_placeholder", t.searchPlaceholder)}
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
                <span className="hidden sm:inline">{sort === "newest" ? t.newest : t.oldest}</span>
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
                          getTagColors(tag, tagFilter === tag)
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
                        {t.clear}
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
          {filtered.length} {filtered.length === 1 ? t.postSingular : t.postPlural}
          {hasActiveFilters && ` ${t.matching}`}
        </motion.p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <BlogPostCard key={post.id} post={post} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-2 text-muted-foreground">{getValue("writing_no_posts_title", t.noPostsTitle)}</p>
            <button
              onClick={clearAll}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {getValue("writing_clear_filters", t.clearFilters)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Writing;
