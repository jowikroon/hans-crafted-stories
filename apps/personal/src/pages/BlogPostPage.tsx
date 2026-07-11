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


/* ── Inline figure system (stat cards + SVG line chart + "Bekijk context" modal).
   Authored in article Markdown as a fenced block:
     :::figure num=03 title="Marketplace projectmap"
     caption Klantresultaten met geencodeerde platformregels
     stat 70% | Amazon NL categorie-aandeel (Nielsen)
     axis OUTPUTKWALITEIT
     xaxis SESSIE 1 | SESSIE 20
     line Met project | 2,6,14,28,46,68,100
     line Losse chats | 4,5,5,6,6,7,8 | dashed
     note Extra context voor de pop-up.
     :::
   Inline shows stats (or a compact chart) + caption + button; the modal shows
   the full chart + stats + note. Output trust model unchanged (CMS content). */
type FigSeries = { name: string; values: number[]; dashed: boolean };
function lineChartSvg(series: FigSeries[], axisLabel: string, xLeft: string, xRight: string, h = 300): string {
  const W = 760, H = h, padL = 8, padR = 8, top = 46, bot = H - 44;
  const all = series.flatMap((s) => s.values);
  const max = Math.max(1, ...all);
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const px = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const py = (v: number) => bot - (v / max) * (bot - top);
  let g = "";
  // baseline gridlines
  for (let k = 1; k <= 3; k++) { const y = top + (k / 4) * (bot - top); g += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="currentColor" stroke-opacity=".08"/>`; }
  series.forEach((s) => {
    const pts = s.values.map((v, i) => [px(i), py(v)]);
    const d = pts.map((pt, i) => (i === 0 ? `M${pt[0].toFixed(1)} ${pt[1].toFixed(1)}` : `L${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`)).join(" ");
    if (!s.dashed) {
      const area = `${d} L${px(n - 1).toFixed(1)} ${bot} L${px(0).toFixed(1)} ${bot} Z`;
      g += `<path d="${area}" class="figc__area"/><path d="${d}" class="figc__line"/>`;
    } else {
      g += `<path d="${d}" class="figc__dash"/>`;
    }
    const last = pts[pts.length - 1];
    g += `<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" class="${s.dashed ? "figc__dotm" : "figc__dot"}"/>`;
    g += `<text x="${(last[0] - 8).toFixed(1)}" y="${(last[1] - 8).toFixed(1)}" text-anchor="end" class="figc__slab">${esc(s.name)}</text>`;
  });
  return `<svg class="figc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(axisLabel || "grafiek")}">`
    + `<text x="${padL}" y="26" class="figc__ax">${esc(axisLabel)}</text>${g}`
    + `<text x="${padL}" y="${H - 14}" class="figc__x">${esc(xLeft)}</text>`
    + `<text x="${W - padR}" y="${H - 14}" text-anchor="end" class="figc__x">${esc(xRight)}</text></svg>`;
}
function attr(header: string, key: string): string {
  const m = header.match(new RegExp(key + '=(?:"([^"]*)"|([^\\s]+))'));
  return (m ? (m[1] ?? m[2]) : "").trim();
}
function buildFigure(header: string, body: string[], autoNum: number, mask?: MaskCtx): string {
  const num = (attr(header, "num") || String(autoNum)).padStart(2, "0");
  const title = attr(header, "title");
  let caption = "", axis = "", xL = "", xR = "", note = "";
  const stats: { v: string; l: string }[] = [];
  const series: FigSeries[] = [];
  for (const raw of body) {
    const t = raw.trim(); if (!t) continue;
    if (t.startsWith("caption ")) caption = t.slice(8).trim();
    else if (t.startsWith("axis ")) axis = t.slice(5).trim();
    else if (t.startsWith("xaxis ")) { const [a, b] = t.slice(6).split("|"); xL = (a || "").trim(); xR = (b || "").trim(); }
    else if (t.startsWith("note ")) note = t.slice(5).trim();
    else if (t.startsWith("stat ")) { const [v, ...l] = t.slice(5).split("|"); stats.push({ v: v.trim(), l: l.join("|").trim() }); }
    else if (t.startsWith("line ")) { const parts = t.slice(5).split("|"); const name = (parts[0] || "").trim(); const values = (parts[1] || "").split(",").map((x) => parseFloat(x.trim())).filter((x) => !isNaN(x)); const dashed = /dashed/i.test(parts[2] || ""); if (values.length) series.push({ name, values, dashed }); }
  }
  const statsHtml = stats.length
    ? `<div class="fig__stats">${stats.map((s) => `<div class="fig__stat"><div class="fig__num">${esc(s.v)}</div><div class="fig__lab">${inlineMd(s.l, mask)}</div></div>`).join("")}</div>`
    : "";
  const chartHtml = series.length ? lineChartSvg(series, axis, xL, xR) : "";
  const inlineBody = statsHtml || (chartHtml ? `<div class="fig__chartwrap">${chartHtml}</div>` : "");
  const modalHtml = `<div class="figm"><div class="figm__k">FIGUUR ${num}</div>`
    + (title ? `<h3 class="figm__t">${esc(title)}</h3>` : "")
    + (chartHtml ? `<div class="figm__chart">${chartHtml}</div>` : "")
    + (statsHtml && chartHtml ? statsHtml : "")
    + (note ? `<p class="figm__note">${inlineMd(note, mask)}</p>` : "")
    + `</div>`;
  return `<figure class="fig" data-fig="${num}">${inlineBody}`
    + `<div class="fig__foot"><span class="fig__cap"><b>FIGUUR ${num}</b> ${inlineMd(caption, mask)}</span>`
    + `<button type="button" class="fig__btn" data-fig-open="${num}">Bekijk context</button></div>`
    + `<div class="fig__modalsrc" id="figm-${num}" hidden>${modalHtml}</div></figure>`;
}

function renderArticle(md: string, maskingCfg?: MaskingConfig | null): RenderResult {
  const mask: MaskCtx = { cfg: maskingCfg, counters: {} };
  const lines = md.split("\n");
  const headings: { id: string; text: string }[] = [];
  const out: string[] = [];
  let listBuf: string[] = [];
  let h2Count = 0;
  let figCount = 0;
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

    // Inline figure block:  :::figure ... :::
    if (t.startsWith(":::figure")) {
      flushList();
      const header = t.slice(3).trim();
      const bodyLines: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) { if (lines[j].trim() === ":::") break; bodyLines.push(lines[j]); }
      i = j; // skip past closing :::
      out.push(buildFigure(header, bodyLines, ++figCount, mask));
      continue;
    }

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
  const [figHtml, setFigHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    // Preloaded (SSR/prerender) gives the instant first paint, but always refetch
    // live so content edits (new figures, published/unpublished changes) appear
    // without waiting for a site rebuild.
    let active = true;
    if (!preloaded || preloaded.slug !== slug) setPost(undefined);
    getBlogPost(slug).then((p) => {
      // Guard against a stale response from a previously-requested slug winning
      // the race on fast client-side navigation between articles. Only apply the
      // result if this effect is still current AND the fetched post matches the
      // slug we asked for. This prevents one article showing another's content.
      if (!active) return;
      if (p && p.slug !== slug) return;
      setPost(p);
    });
    return () => {
      active = false;
    };
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

  /* ── Inline figure "Bekijk context" modal: open + ESC/scroll-lock ── */
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-fig-open]");
      if (!btn || !root.contains(btn)) return;
      const id = btn.getAttribute("data-fig-open");
      const src = root.querySelector(`#figm-${id}`);
      if (src) setFigHtml(src.innerHTML);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [bodyHtml]);

  useEffect(() => {
    if (!figHtml) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFigHtml(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [figHtml]);

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
            ? "Geen hype. Een nuchtere blik op waar je groei zit en waar je marge weglekt."
            : "No hype. A sober look at where your growth is and where margin leaks away."}</p>
          <Link to="/about" className="cta__btn">{lang === "nl" ? "Neem contact op" : "Get in touch"} <ArrowRight size={16} /></Link>
        </section>

        {/* More */}
        <MoreReading category={post.category} currentSlug={post.slug} lang={lang} />
      </article>

      {figHtml && (
        <div className="figov" onClick={(e) => { if (e.target === e.currentTarget) setFigHtml(null); }}>
          <div className="figov__box" role="dialog" aria-modal="true">
            <button type="button" className="figov__x" onClick={() => setFigHtml(null)} aria-label={lang === "nl" ? "Sluiten" : "Close"}>&times;</button>
            <div dangerouslySetInnerHTML={{ __html: figHtml }} />
          </div>
        </div>
      )}
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
