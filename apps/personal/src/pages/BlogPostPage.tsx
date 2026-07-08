import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, ChevronRight, Link2, Linkedin, Twitter, ArrowRight, ArrowUpRight } from "lucide-react";
import { getBlogPost, getBlogPosts, BlogPostRow } from "@/lib/api/content";
import { usePreloadedBlogPost } from "@/contexts/PreloadedDataContext";
import { useSEO } from "@/hooks/useSEO";
import { useLang } from "@/hooks/useLang";
import { getBlogPostHead, getBlogPostJsonLd } from "@/lib/seo/blogPostHead";
import { toast } from "sonner";
import hansProfile from "@/assets/hans-profile.jpg";
import "@/styles/article-v2.css";
import { applyMaskTokens, type MaskingConfig } from "@/lib/masking";

/* ────────────────────────────────────────────────────────────
   BlogPostPage — article reader, redesign v2.

   Pixel-port of the claude.ai/design prototype viewArticle
   (project/assets/site-spa.css → ARTICLE READING VIEW), rendered
   with the scoped .article-v2 stylesheet. Preserves everything the
   previous reader did so SEO / SSR / drafts stay intact:
     - Auth/preload-aware fetch via usePreloadedBlogPost + getBlogPost
     - Bilingual NL/EN via useLang (title_nl / excerpt_nl / content_nl)
     - useSEO with canonical + JSON-LD BlogPosting (getBlogPost* helpers)
     - Draft detection → noindex + visible CONCEPT banner for Hans-auth
     - Prerender-safe: scroll-spy + clipboard guarded for typeof window

   New in v2:
     - Centered .ahead with category line, serif title, dek, byline
     - .ahero full-width image
     - .reading rail: sticky TOC (>=3 H2s) with scroll-spy + progress bar
     - design .prose (lead / h2 / h3 / ul / pull / callout)
     - .atags · .share · dark "Sparren?" .cta · "Meer lezen" .ncards
   ──────────────────────────────────────────────────────────── */

/* Markdown → design-prose HTML.
   Enriches the previous renderer to also emit the design's lead / pull /
   callout blocks, and stamps H2s with id="sec-N" so the TOC can scroll-spy.
   Output trust model is unchanged — content originates from the CMS. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
type MaskCtx = { cfg: MaskingConfig | null | undefined; counters: Record<string, number> };
const inlineMd = (s: string, mask?: MaskCtx) => {
  let out = esc(s);
  if (mask) out = applyMaskTokens(out, mask.cfg, mask.counters);
  return out
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
};

interface RenderResult { html: string; headings: { id: string; text: string }[]; }

function renderArticle(md: string, maskingCfg?: MaskingConfig | null): RenderResult {
  const mask: MaskCtx = { cfg: maskingCfg, counters: {} };
  const lines = md.split("\n");
  const headings: { id: string; text: string }[] = [];
  const out: string[] = [];
  let listBuf: string[] = [];
  let h2Count = 0;
  let firstParaDone = false;

  const flushList = () => {
    if (listBuf.length) {
      out.push(`<ul>${listBuf.map((li) => `<li>${li}</li>`).join("")}</ul>`);
      listBuf = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "") { flushList(); continue; }

    // Image: ![alt](url) on its own line. url may be an inline data: URI
    // (e.g. a self-contained SVG chart) or an https: URL. Renders a figure.
    const imgm = t.match(/^!\[([^\]]*)\]\((data:[^)]+|https?:\/\/[^)]+)\)$/);
    if (imgm) {
      flushList();
      const ialt = esc(imgm[1].trim());
      const isrc = imgm[2];
      out.push(`<figure class="fig"><img src="${isrc}" alt="${ialt}" decoding="async" />${ialt ? `<figcaption>${ialt}</figcaption>` : ""}</figure>`);
      continue;
    }

    // H1 — CMS content often opens with the title as an H1, duplicating the page
    // title (.atitle). Drop a redundant leading H1; promote any later H1 to a
    // chapter so it never renders as a literal "#".
    if (t.startsWith("# ")) {
      flushList();
      const text = t.slice(2).trim();
      if (out.length === 0 && !firstParaDone) continue;
      const id = `sec-${++h2Count}`;
      headings.push({ id, text });
      out.push(`<h2 id="${id}">${esc(text)}</h2>`);
      continue;
    }

    // H2 — gets an id for TOC scroll-spy
    if (t.startsWith("## ")) {
      flushList();
      const text = t.slice(3).trim();
      const id = `sec-${++h2Count}`;
      headings.push({ id, text });
      out.push(`<h2 id="${id}">${esc(text)}</h2>`);
      continue;
    }
    if (t.startsWith("### ")) { flushList(); out.push(`<h3>${esc(t.slice(4).trim())}</h3>`); continue; }

    // Blockquote → pull quote
    if (t.startsWith("> ")) { flushList(); out.push(`<p class="pull">${inlineMd(t.slice(2).trim(), mask)}</p>`); continue; }

    // Callout:  :::Kicker | body   (graceful: also plain "::: body")
    if (t.startsWith(":::")) {
      flushList();
      const body = t.slice(3).trim();
      const [k, ...rest] = body.split("|");
      const kicker = rest.length ? k.trim() : "Noot";
      const text = rest.length ? rest.join("|").trim() : body;
      out.push(`<div class="callout"><div class="callout__k">${esc(kicker)}</div><p>${inlineMd(text, mask)}</p></div>`);
      continue;
    }

    // List item
    if (t.startsWith("- ")) { listBuf.push(inlineMd(t.slice(2).trim(), mask)); continue; }

    // Bold-only line → section heading (H2). Older articles / CMS content use
    // "**Heading**" on its own line instead of "## Heading"; promote it so it
    // gets a chapter in the TOC and the heading style, not a bold paragraph.
    const boldOnly = t.match(/^\*\*(.+?)\*\*$/);
    if (boldOnly && !boldOnly[1].includes("**") && firstParaDone) {
      flushList();
      const text = boldOnly[1].trim();
      const id = `sec-${++h2Count}`;
      headings.push({ id, text });
      out.push(`<h2 id="${id}">${esc(text)}</h2>`);
      continue;
    }

    // Paragraph — the very first one becomes the lead
    flushList();
    if (!firstParaDone) { out.push(`<p class="lead">${inlineMd(t, mask)}</p>`); firstParaDone = true; }
    else out.push(`<p>${inlineMd(t, mask)}</p>`);
  }
  flushList();
  return { html: out.join("\n"), headings };
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const preloaded = usePreloadedBlogPost(slug);
  const [post, setPost] = useState<BlogPostRow | null | undefined>(
    () => (preloaded ?? undefined) as BlogPostRow | undefined
  );
  const { lang } = useLang();
  const articleRef = useRef<HTMLElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    // Preloaded (SSR/prerender) gives the instant first paint, but always refetch
    // live so content edits (new figures, published/unpublished changes) appear
    // without waiting for a site rebuild.
    if (!preloaded || preloaded.slug !== slug) setPost(undefined);
    getBlogPost(slug).then(setPost);
  }, [slug, preloaded]);

  // Language-aware fields
  const displayTitle = post ? (lang === "nl" && post.title_nl ? post.title_nl : post.title) : "";
  const displayExcerpt = post ? (lang === "nl" && post.excerpt_nl ? post.excerpt_nl : post.excerpt) : "";
  const displayContent = post ? (lang === "nl" && post.content_nl ? post.content_nl : post.content) : "";

  const { html: bodyHtml, headings } = useMemo(
    () => renderArticle(displayContent || "", post?.masking),
    [displayContent, post?.masking]
  );
  const showToc = headings.length >= 3;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const seoHead = post ? getBlogPostHead(post) : null;
  const seoUrl = seoHead?.canonical || `https://hansvanleeuwen.com/writing/${slug}`;
  const isDraft = !!post && (post.published === false || (post as { status?: string }).status === "draft");

  useSEO({
    enabled: post !== undefined,
    title: post ? seoHead?.title || `${displayTitle} | Hans van Leeuwen` : "Post not found | Hans van Leeuwen",
    description: displayExcerpt || "Read this article by Hans van Leeuwen on e-commerce, marketplace strategy, and digital commerce.",
    url: seoUrl,
    type: "article",
    jsonLd: post && !isDraft ? getBlogPostJsonLd(post) : undefined,
    noindex: isDraft,
  });

  /* ── TOC scroll-spy + reading-progress bar (prerender-safe) ── */
  useEffect(() => {
    if (typeof window === "undefined" || !post || !showToc) return;
    const root = articleRef.current;
    if (!root) return;
    const secs = headings
      .map((h) => root.querySelector<HTMLElement>(`#${h.id}`))
      .filter((el): el is HTMLElement => !!el);
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".toc a"));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progRef.current) progRef.current.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      if (!secs.length) return;
      let cur = secs[0];
      secs.forEach((s) => { if (s.getBoundingClientRect().top <= 140) cur = s; });
      links.forEach((a) => a.classList.toggle("active", a.dataset.toc === cur.id));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [post, showToc, headings, slug]);

  const scrollToHeading = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = articleRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      toast.success(lang === "nl" ? "Link gekopieerd" : "Link copied to clipboard");
    }
  };

  if (post === undefined) {
    return (
      <div className="article-v2">
        <div className="art"><p className="adek" style={{ marginTop: 40 }}>{lang === "nl" ? "Laden…" : "Loading…"}</p></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="article-v2">
        <div className="art" style={{ textAlign: "center", paddingTop: 60 }}>
          <h1 className="atitle">{lang === "nl" ? "Artikel niet gevonden" : "Post not found"}</h1>
          <div style={{ marginTop: 24 }}>
            <Link to="/writing" className="cta__btn">← {lang === "nl" ? "Terug naar Writing" : "Back to Writing"}</Link>
          </div>
        </div>
      </div>
    );
  }

  const dateStr = new Date(post.created_at).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const catLine = post.category ? post.category : "Marketplace";

  const shareTwitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(displayTitle)}`;
  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="article-v2">
      <div ref={progRef} className="prog" />

      {isDraft && (
        <div className="draftbar" role="status" aria-live="polite">
          <div className="draftbar__in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span className="draftbar__badge">Concept</span>
              <span style={{ fontWeight: 500 }}>
                Deze versie is alleen voor jou zichtbaar. Niet vindbaar in Google. Niet gedeeld op /writing voor anonieme bezoekers.
              </span>
            </div>
            <Link to={`/write/${post.id}`} className="draftbar__edit">Bewerk in CMS →</Link>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="crumb" aria-label="Breadcrumb">
        <Link to="/"><Home size={12} /><span>Home</span></Link>
        <ChevronRight size={12} />
        <Link to="/writing">Writing</Link>
        <ChevronRight size={12} />
        <span className="here" aria-current="page">{displayTitle}</span>
      </nav>

      <article className="art rise" ref={articleRef}>
        {/* Head */}
        <div className="ahead">
          <div className="ahead__cat">{catLine} <span className="langtag">{lang.toUpperCase()}</span></div>
          <h1 className="atitle">{displayTitle}</h1>
          {displayExcerpt && <p className="adek">{displayExcerpt}</p>}
          <div className="byline">
            <span className="byline__av">H<img src={hansProfile} alt="Hans van Leeuwen" loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLImageElement).remove(); }} /></span>
            <div>
              <div className="byline__n">Hans van Leeuwen</div>
              <div className="byline__r">E-commerce &amp; Marketplace Specialist</div>
            </div>
            <span className="dot" />
            <span className="byline__t">{dateStr} · {post.read_time}</span>
          </div>
        </div>

        {/* Hero */}
        {post.image_url && (
          <figure className="ahero"><img src={post.image_url} alt={displayTitle} /></figure>
        )}

        {/* Reading rail */}
        <div className="reading">
          {showToc ? (
            <aside className="toc" aria-label={lang === "nl" ? "In dit artikel" : "In this article"}>
              <div className="toc__l">{lang === "nl" ? "In dit artikel" : "In this article"}</div>
              <ol>
                {headings.map((h) => (
                  <li key={h.id}>
                    <a data-toc={h.id} href={`#${h.id}`} onClick={(e) => scrollToHeading(e, h.id)}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : (
            <div aria-hidden />
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="atags">{post.tags.map((t) => <span key={t} className="atag">{t}</span>)}</div>
        )}

        {/* Share */}
        <div className="share">
          <span className="share__l">{lang === "nl" ? "Delen" : "Share"}</span>
          <a href={shareLinkedIn} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
          <a href={shareTwitter} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"><Twitter size={17} /></a>
          <button type="button" onClick={handleCopyLink} aria-label={lang === "nl" ? "Kopieer link" : "Copy link"}><Link2 size={17} /></button>
        </div>

        {/* Conversion CTA */}
        <section className="cta">
          <div className="cta__k">{lang === "nl" ? "Sparren?" : "Let's talk"}</div>
          <h3>{lang === "nl" ? "Wil je sparren over jouw marketplace-strategie?" : "Want to spar about your marketplace strategy?"}</h3>
          <p>{lang === "nl"
            ? "Geen hype — een nuchtere blik op waar je groei zit en waar je marge weglekt."
            : "No hype — a sober look at where your growth is and where margin leaks away."}</p>
          <Link to="/about" className="cta__btn">{lang === "nl" ? "Neem contact op" : "Get in touch"} <ArrowRight size={16} /></Link>
        </section>

        {/* More */}
        <MoreReading category={post.category} currentSlug={post.slug} lang={lang} />
      </article>
    </div>
  );
};

/* "Meer lezen" — two related cards (design .ncard).
   Same category, excludes current; falls back to latest if none. */
const MoreReading = ({ category, currentSlug, lang }: { category: string; currentSlug: string; lang: string }) => {
  const [items, setItems] = useState<{ slug: string; title: string; cat: string; read: string }[]>([]);

  useEffect(() => {
    getBlogPosts(true).then((posts) => {
      const others = posts.filter((p) => p.slug !== currentSlug);
      const same = others.filter((p) => p.category === category);
      const pick = (same.length ? same : others).slice(0, 2);
      setItems(pick.map((p) => ({
        slug: p.slug,
        title: lang === "nl" && p.title_nl ? p.title_nl : p.title,
        cat: p.category,
        read: p.read_time,
      })));
    });
  }, [category, currentSlug, lang]);

  if (items.length === 0) return null;

  return (
    <section className="more">
      <div className="more__h">{lang === "nl" ? "Meer lezen" : "More reading"}</div>
      <div className="more__grid">
        {items.map((o) => (
          <Link key={o.slug} to={`/writing/${o.slug}`} className="ncard">
            <div className="ncard__m">
              <span className="tagx">{o.cat}</span>
              <span className="dot"></span>
              <span>{o.read}</span>
            </div>
            <div className="ncard__t">{o.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogPostPage;
