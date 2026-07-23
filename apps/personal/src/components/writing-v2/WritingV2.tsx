import { useState, useMemo, useEffect, useRef } from "react";
import { useSkin } from "@/hooks/useSkin";
import { Link, useSearchParams } from "react-router-dom";
import { getBlogPosts, isHansSession, BlogPostRow } from "@/lib/api/content";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { usePreloadedBlogPosts } from "@/contexts/PreloadedDataContext";
import "@/styles/writing-v2.css";
import { ensureFontCss, FONT_CSS } from "@/lib/fontCss";

type SortOrder = "newest" | "oldest";

interface MappedPost {
  id: string;
  title: string;
  excerpt: string;
  titleNl?: string;
  excerptNl?: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  slug: string;
  imageUrl?: string;
  isDraft: boolean;
  isPublic: boolean;
}

const FILTER_PILLS = [
  { tag: "all", label: "All" },
  { tag: "amazon", label: "Amazon" },
  { tag: "bol", label: "Bol.com" },
  { tag: "marketplace", label: "Marketplace" },
  { tag: "ecommerce", label: "E-commerce" },
  { tag: "ai", label: "AI" },
  { tag: "ux", label: "UX" },
];

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const WritingV2 = () => {
  // Fonts: loaded per-route, not via CSS @import (see fontCss.ts)
  useEffect(() => { ensureFontCss("fonts-writing", FONT_CSS.writing); ensureFontCss("fonts-newsreader", FONT_CSS.newsreader); }, []);
  const preloadedPosts = usePreloadedBlogPosts();
  const [blogPosts, setBlogPosts] = useState<BlogPostRow[]>(() => preloadedPosts ?? []);
  const [loading, setLoading] = useState(preloadedPosts === null);
  // Filter is URL-driven (/writing?tag=x) so article tag pills can deep-link
  // into a filtered index. Prerender-safe: useSearchParams works under the
  // MemoryRouter used by SSR as well.
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("tag") || "all";
  const setFilter = (tag: string) => {
    setSearchParams(tag === "all" ? {} : { tag }, { replace: true });
  };
  const { skin, setSkin, skins } = useSkin();
  const [sort, setSort] = useState<SortOrder>("newest");
  const [authed, setAuthed] = useState(false);
  const [publishedOnly, setPublishedOnly] = useState(false);
  const { lang } = useLang();
  const t = translations[lang].writing;
  const seo = translations[lang].seo;
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Filtered/sorted/draft views are near-duplicates of /writing -> keep them out
  // of the index but let link equity flow (noindex,follow). Canonical already
  // points at the clean /writing URL below.
  const isFilteredView = filter !== "all" || sort !== "newest" || publishedOnly;

  // Public posts drive an ItemList of BlogPosting entities (rich results).
  const publicPostsForLd = useMemo(
    () => blogPosts.filter((p) => p.published === true && p.status === "published"),
    [blogPosts],
  );

  const writingJsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://hansvanleeuwen.com/writing#page",
        name: t.heading,
        description: seo.writingDescription,
        url: "https://hansvanleeuwen.com/writing",
        isPartOf: { "@id": "https://hansvanleeuwen.com/#website" },
        author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://hansvanleeuwen.com/" },
          { "@type": "ListItem", position: 2, name: t.label, item: "https://hansvanleeuwen.com/writing" },
        ],
      },
      ...(publicPostsForLd.length
        ? [{
            "@type": "ItemList",
            "@id": "https://hansvanleeuwen.com/writing#articles",
            itemListElement: publicPostsForLd.slice(0, 20).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "BlogPosting",
                "@id": `https://hansvanleeuwen.com/writing/${p.slug}#post`,
                headline: p.title,
                url: `https://hansvanleeuwen.com/writing/${p.slug}`,
                datePublished: p.created_at,
                dateModified: p.updated_at,
                ...(p.image_url ? { image: p.image_url } : {}),
                description: p.meta_description || p.excerpt || undefined,
                author: { "@type": "Person", "@id": "https://hansvanleeuwen.com/#person", name: "Hans van Leeuwen" },
                publisher: { "@id": "https://hansvanleeuwen.com/#person" },
              },
            })),
          }]
        : []),
    ],
  }), [publicPostsForLd, t.heading, t.label, seo.writingDescription]);

  useSEO({
    title: seo.writingTitle,
    description: seo.writingDescription,
    url: "https://hansvanleeuwen.com/writing",
    robots: isFilteredView ? "noindex,follow" : undefined,
    hreflang: [
      { lang: "en", href: "https://hansvanleeuwen.com/writing" },
      { lang: "nl", href: "https://hansvanleeuwen.com/writing" },
      { lang: "x-default", href: "https://hansvanleeuwen.com/writing" },
    ],
    jsonLd: writingJsonLd,
  });

  useEffect(() => {
    let alive = true;
    isHansSession().then((h) => { if (alive) setAuthed(h); });
    // Always refetch live so newly published posts appear without a site rebuild.
    // Preloaded posts (SSR/prerender) are used only for the instant first paint.
    getBlogPosts(true).then((p) => {
      if (!alive) return;
      setBlogPosts(p);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const mappedPosts: MappedPost[] = useMemo(
    () =>
      blogPosts.map((p) => ({
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
        titleNl: p.title_nl || undefined,
        excerptNl: p.excerpt_nl || undefined,
        category: p.category,
        tags: p.tags ?? [],
        date: p.created_at,
        readTime: p.read_time,
        slug: p.slug,
        imageUrl: p.image_url || undefined,
        // Draft = not published. Surfaced to Hans only (RLS gates server-side).
        isDraft: !p.published || (typeof p.status === "string" && p.status === "draft"),
        // Public = exactly what anonymous visitors see (RLS: published + status=published).
        isPublic: p.published === true && p.status === "published",
      })),
    [blogPosts],
  );

  // Filter & sort
  const filtered = useMemo(() => {
    let posts = mappedPosts;
    if (authed && publishedOnly) {
      posts = posts.filter((p) => p.isPublic);
    }
    if (filter !== "all") {
      posts = posts.filter((p) => {
        const allTags = [...p.tags.map((x) => x.toLowerCase()), p.category.toLowerCase()];
        return allTags.some((tag) => tag.includes(filter.toLowerCase()));
      });
    }
    posts = [...posts].sort((a, b) =>
      sort === "newest"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return posts;
  }, [filter, sort, mappedPosts, authed, publishedOnly]);

  // Sticky toolbar shadow
  useEffect(() => {
    const tb = toolbarRef.current;
    if (!tb) return;
    const onScroll = () => {
      const isStuck = window.scrollY > 10 && tb.getBoundingClientRect().top <= 73;
      tb.classList.toggle("stuck", isStuck);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal animation on scroll
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const rows = document.querySelectorAll(".writing-v2 .post.rv");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px 8% 0px", threshold: 0.02 },
    );
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, [filtered]);

  // The featured post = first/newest
  const [featured, ...rest] = filtered;
  const featTitle = featured && lang === "nl" && featured.titleNl ? featured.titleNl : featured?.title;
  const featExcerpt = featured && lang === "nl" && featured.excerptNl ? featured.excerptNl : featured?.excerpt;
  const featLang = (lang === "nl" ? "NL" : "EN").toString();

  return (
    <div className="writing-v2">
      <div className="wrap">
        {/* Breadcrumb */}
        <nav className="crumb idx" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight />
          <span className="here" aria-current="page">
            Writing
          </span>
        </nav>

        {/* Masthead */}
        <section className="masthead">
          <span className="eyebrow">Insights &amp; Essays</span>
          <h1 className="title">{lang === "nl" ? "E-commerce inzichten & marketplace-optimalisatie" : "E-commerce Insights & Marketplace Optimization"}</h1>
          <p className="lede">
            {lang === "nl" ? (
              <>
                <strong>E-commerce inzichten en marketplace-optimalisatie</strong> door <strong>Hans van Leeuwen</strong>, freelance
                e-commerce manager en Amazon- en Bol.com-specialist in Amersfoort. Praktische essays over listing-optimalisatie,
                Amazon Ads en Bol Ads, AI-automatisering en marketplace-groei in NL en de EU, geschreven vanuit hands-on klantwerk.
              </>
            ) : (
              <>
                <strong>E-commerce insights and marketplace optimization</strong> by <strong>Hans van Leeuwen</strong>, a freelance
                e-commerce manager and Amazon and Bol.com specialist based in Amersfoort. Practical essays on listing optimization,
                Amazon Ads and Bol Ads, AI automation and marketplace growth across the NL and EU, drawn from hands-on client work.
              </>
            )}
          </p>
          <div className="proof">
            <div className="proof__item">
              <span className="proof__stat">70%</span>
              <span className="proof__label">
                {lang === "nl" ? "Amazon NL categorie-aandeel (Nielsen)" : "Amazon NL category share (Nielsen)"}
              </span>
            </div>
            <div className="proof__item">
              <span className="proof__stat">+20%</span>
              <span className="proof__label">
                {lang === "nl" ? "Wekelijkse sales via targeted campagnes" : "Weekly sales via targeted campaigns"}
              </span>
            </div>
            <div className="proof__item">
              <span className="proof__stat">&lt;2%</span>
              <span className="proof__label">
                {lang === "nl" ? "Out-of-stock rate, forecast-driven" : "Out-of-stock rate, forecast-driven"}
              </span>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="toolbar" ref={toolbarRef}>
          <div className="filters" role="group" aria-label="Filter by topic">
            {FILTER_PILLS.map((p) => {
              const pillCount = p.tag === "all"
                ? mappedPosts.length
                : mappedPosts.filter((post) => {
                    const allTags = [post.category, ...(post.tags || [])].map((tag) => (tag || "").toLowerCase());
                    return allTags.some((tag) => tag.includes(p.tag.toLowerCase()));
                  }).length;
              return (
                <a
                  key={p.tag}
                  href={p.tag === "all" ? "/writing" : `/writing?tag=${p.tag}`}
                  className={`pill ${filter === p.tag ? "on" : ""}`}
                  aria-pressed={filter === p.tag}
                  aria-label={`${p.label} (${pillCount})`}
                  onClick={(e) => { e.preventDefault(); setFilter(p.tag); }}
                >
                  {p.label} <span className="pill__count">({pillCount})</span>
                </a>
              );
            })}
            {filter !== "all" && !FILTER_PILLS.some((p) => p.tag === filter) && (
              <button
                type="button"
                className="pill on"
                aria-pressed="true"
                onClick={() => setFilter("all")}
                title={lang === "nl" ? "Filter wissen" : "Clear filter"}
              >
                {filter} ×
              </button>
            )}
            {filter !== "all" && (
              <button
                type="button"
                className="pill pill--clear"
                onClick={() => setFilter("all")}
                aria-label={lang === "nl" ? "Filter wissen" : "Clear filters"}
                title={lang === "nl" ? "Filter wissen" : "Clear filters"}
              >
                {lang === "nl" ? "Filter wissen" : "Clear filters"} ×
              </button>
            )}
            {authed && (
              <button
                type="button"
                className={`pill ${publishedOnly ? "on" : ""}`}
                aria-pressed={publishedOnly}
                onClick={() => setPublishedOnly((v) => !v)}
                title={lang === "nl" ? "Toon alleen wat bezoekers zien" : "Show only what visitors see"}
              >
                {lang === "nl" ? "Alleen gepubliceerd" : "Published only"}
              </button>
            )}
          </div>
          <div className="toolbar__right">
            <span className="count" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "essay" : "essays"}
            </span>
            <div className="skinpick">
              <label htmlFor="skinSel">{lang === "nl" ? "Stijl" : "Style"}</label>
              <select
                id="skinSel"
                value={skin}
                onChange={(e) => setSkin(e.target.value as typeof skin)}
                aria-label={lang === "nl" ? "Kies een stijl voor deze pagina" : "Choose a style for this page"}
              >
                {skins.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sort">
              <label htmlFor="sortSel">{lang === "nl" ? "Sorteer" : "Sort"}</label>
              <select
                id="sortSel"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
              >
                <option value="newest">{lang === "nl" ? "Nieuwste" : "Newest"}</option>
                <option value="oldest">{lang === "nl" ? "Oudste" : "Oldest"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="list">
          {loading ? (
            <p className="empty">{lang === "nl" ? "Essays worden geladen..." : "Loading essays..."}</p>
          ) : filtered.length === 0 ? (
            <p className="empty">
              {lang === "nl" ? "Geen essays voor dit onderwerp." : "No essays match that topic yet."}
            </p>
          ) : (
            <>
              {/* Featured post (first item) */}
              {featured && (
                <article className="post post--featured rv">
                  <div className={`feat__grid${featured.imageUrl ? "" : " feat__grid--solo"}`}>
                    <div className="feat__body">
                      <span className="feat__kicker">
                        {featured.isDraft
                          ? lang === "nl"
                            ? "Concept"
                            : "Draft"
                          : lang === "nl"
                          ? "Nieuwste essay"
                          : "Latest essay"}
                      </span>
                      <div className="post__meta">
                        <time className="post__date" dateTime={featured.date}>
                          {formatDate(featured.date, lang)}
                        </time>
                        <span className="dot"></span>
                        <span className="tag">{featured.category}</span>
                        <span className="dot"></span>
                        <span className="lang">{featLang}</span>
                        {featured.readTime && (
                          <>
                            <span className="dot"></span>
                            <span>{featured.readTime}</span>
                          </>
                        )}
                        {featured.isDraft && (
                          <>
                            <span className="dot"></span>
                            <span className="draft-pill">Concept</span>
                          </>
                        )}
                      </div>
                      <h2 className="post__title">
                        <Link
                          to={`/writing/${featured.slug}`}
                          className="post__title-link"
                          aria-label={`Featured essay: ${featTitle}`}
                        >
                          {featTitle}
                        </Link>
                      </h2>
                      <p className="post__excerpt">{featExcerpt}</p>
                      <span className="feat__cta">
                        {lang === "nl" ? "Lees het essay" : "Read the essay"}
                        <ArrowIcon />
                      </span>
                    </div>
                    {featured.imageUrl && (
                      <div className="feat__media">
                        <img
                          src={featured.imageUrl}
                          alt={featTitle ?? ""}
                          width={1200}
                          height={800}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      </div>
                    )}
                  </div>
                </article>
              )}

              {/* Rest of posts */}
              {rest.map((post) => {
                const title = lang === "nl" && post.titleNl ? post.titleNl : post.title;
                const excerpt = lang === "nl" && post.excerptNl ? post.excerptNl : post.excerpt;
                return (
                  <article key={post.id} className="post rv">
                    <div className="post__thumb">
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt={title}
                          width={600}
                          height={400}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </div>
                    <div className="post__body">
                      <div className="post__meta">
                        <time className="post__date" dateTime={post.date}>
                          {formatDate(post.date, lang)}
                        </time>
                        <span className="dot"></span>
                        <span className="tag">{post.category}</span>
                        <span className="dot"></span>
                        <span className="lang">{featLang}</span>
                        {post.readTime && (
                          <>
                            <span className="dot"></span>
                            <span>{post.readTime}</span>
                          </>
                        )}
                        {post.isDraft && (
                          <>
                            <span className="dot"></span>
                            <span className="draft-pill">Concept</span>
                          </>
                        )}
                      </div>
                      <h2 className="post__title">
                        <Link to={`/writing/${post.slug}`} className="post__title-link">
                          {title}
                        </Link>
                      </h2>
                      <p className="post__excerpt">{excerpt}</p>
                    </div>
                    <span className="post__go" aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </article>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingV2;
