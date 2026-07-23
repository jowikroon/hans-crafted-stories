import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Home, ChevronRight, Link2, Linkedin, Twitter, ArrowRight, ArrowUpRight, ArrowUp, List, Share2, X } from "lucide-react";
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
/* Links: support every destination the CMS can produce — external https?://,
   site-relative (/writing/…, /work/…), in-page #anchors and mailto:. Legacy
   /blog/<slug> hrefs are normalised to /writing/<slug> (a /blog route never
   shipped on this site). External links open in a new tab; unsafe schemes
   (javascript: etc.) render as plain text. Bare URLs are autolinked. */
const SAFE_HREF_RE = /^(https?:\/\/|\/(?![\/\\])|#|mailto:)/i;
const normalizeHref = (href: string): string => {
  const h = href.trim();
  if (h === "/blog" || h === "/blog/") return "/writing";
  if (h.startsWith("/blog/")) return "/writing/" + h.slice("/blog/".length);
  return h;
};
const anchorHtml = (rawHref: string, label: string): string | null => {
  const href = normalizeHref(rawHref);
  if (!SAFE_HREF_RE.test(href)) return null;
  const attrs = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a href="${href.replace(/"/g, "&quot;")}"${attrs}>${label}</a>`;
};
const AUTOLINK_RE = /(^|[\s(])((?:https?:\/\/|www\.)[^\s<>"')]*[^\s<>"').,;:!?])/g;
const inlineMd = (s: string, mask?: MaskCtx) => {
  let out = esc(s);
  if (mask) out = applyMaskTokens(out, mask.cfg, mask.counters);
  out = out
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, label: string, href: string) => anchorHtml(href, label) ?? m);
  // Autolink bare URLs, but never inside an <a>…</a> that already exists —
  // split on anchor segments and only transform the text between them.
  return out
    .split(/(<a\b[^>]*>[\s\S]*?<\/a>)/g)
    .map((seg, i) =>
      i % 2 === 1
        ? seg
        : seg.replace(AUTOLINK_RE, (_m, pre: string, url: string) => {
            const href = /^www\./i.test(url) ? `https://${url}` : url;
            return `${pre}<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${url}</a>`;
          })
    )
    .join("");
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

/* ── "In het kort" summary card. Authored as:
     :::kort
     Eerste kernpunt.
     Tweede kernpunt.
     Derde kernpunt.
     :::
   Numbered items with accent styling; ported from the Anthropic-leak
   article prototype. Leading "1." / "-" prefixes in authored lines are
   stripped so both list styles work. */
function buildKort(body: string[], lang: "nl" | "en", mask?: MaskCtx): string {
  const items = body
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^(?:\d+[.)]\s*|-\s*)/, ""));
  if (!items.length) return "";
  const label = lang === "en" ? "IN SHORT" : "IN HET KORT";
  return `<div class="tldr"><div class="tldr__k">${label}</div><div class="tldr__list">`
    + items.map((it, i) => `<div class="tldr__item"><span class="tldr__n">${i + 1}.</span><span>${inlineMd(it, mask)}</span></div>`).join("")
    + `</div></div>`;
}

/* ── Horizontal timeline figure. Authored as:
     :::timeline title="Een week uit het leven" sub="Maart–april 2026"
     punt feb 2025 | Eerdere, vergelijkbare source-lek | grijs
     punt 26 mrt | CMS-fout lekt ±3.000 documenten | amber
     punt 31 mrt | Source map ontdekt in npm | rood
     punt +2 uur | Clean-room rewrite | blauw
     punt dagen erna | DMCA-takedowns | ink
     caption Twee lekken in één week.
     :::
   "rood" renders as the highlighted milestone (bigger dot + halo).
   Ported from the Anthropic-leak article prototype. */
const TL_COLORS: Record<string, string> = { grijs: "#9aa39a", amber: "#e2a93c", rood: "#d5453a", blauw: "#4a7fb5", ink: "#1b1f1c" };
function buildTimeline(header: string, body: string[], mask?: MaskCtx): string {
  const title = attr(header, "title");
  const sub = attr(header, "sub");
  let caption = "";
  const pts: { date: string; label: string; color: string; hot: boolean }[] = [];
  for (const raw of body) {
    const t = raw.trim(); if (!t) continue;
    if (t.startsWith("caption ")) { caption = t.slice(8).trim(); continue; }
    const line = t.replace(/^(?:punt|stap|-)\s+/, "");
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2) continue;
    const colorKey = (parts[2] || "grijs").toLowerCase();
    pts.push({ date: parts[0], label: parts[1], color: TL_COLORS[colorKey] || TL_COLORS.grijs, hot: colorKey === "rood" });
  }
  if (pts.length < 2) return "";
  const cols = pts.map((p) => `<div class="tl__item${p.hot ? " tl__item--hot" : ""}">`
    + `<div class="tl__date">${esc(p.date)}</div>`
    + `<div class="tl__dot" style="background:${p.color}"></div>`
    + `<div class="tl__lab">${inlineMd(p.label, mask)}</div></div>`).join("");
  return `<figure class="tl"${title ? "" : ' data-notitle=""'}>`
    + (title ? `<div class="tl__t">${esc(title)}</div>` : "")
    + (sub ? `<div class="tl__s">${esc(sub)}</div>` : "")
    + `<div class="tl__grid" style="grid-template-columns:repeat(${pts.length},1fr)"><div class="tl__line"></div>${cols}</div>`
    + (caption ? `<figcaption class="tl__cap">${inlineMd(caption, mask)}</figcaption>` : "")
    + `</figure>`;
}

function renderArticle(md: string, maskingCfg?: MaskingConfig | null, lang: "nl" | "en" = "nl"): RenderResult {
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

    // "In het kort" summary card:  :::kort ... :::
    if (t === ":::kort" || t.startsWith(":::kort ")) {
      flushList();
      const bodyLines: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) { if (lines[j].trim() === ":::") break; bodyLines.push(lines[j]); }
      i = j;
      const html = buildKort(bodyLines, lang, mask);
      if (html) out.push(html);
      continue;
    }

    // Horizontal timeline figure:  :::timeline ... :::
    if (t.startsWith(":::timeline")) {
      flushList();
      const header = t.slice(3).trim();
      const bodyLines: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) { if (lines[j].trim() === ":::") break; bodyLines.push(lines[j]); }
      i = j;
      const html = buildTimeline(header, bodyLines, mask);
      if (html) out.push(html);
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
  const [rawPost, setRawPost] = useState<BlogPostRow | null | undefined>(
    () => (preloaded ?? undefined) as BlogPostRow | undefined
  );
  const { lang } = useLang();
  const articleRef = useRef<HTMLElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const [figHtml, setFigHtml] = useState<string | null>(null);
  const [showBtt, setShowBtt] = useState(false);
  const [mtocOpen, setMtocOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // Preloaded (SSR/prerender) gives the instant first paint, but always refetch
    // live so content edits (new figures, published/unpublished changes) appear
    // without waiting for a site rebuild.
    let active = true;
    if (!preloaded || preloaded.slug !== slug) setRawPost(undefined);
    getBlogPost(slug).then((p) => {
      // Guard against a stale response from a previously-requested slug winning
      // the race on fast client-side navigation between articles. Only apply the
      // result if this effect is still current AND the fetched post matches the
      // slug we asked for. This prevents one article showing another's content.
      if (!active) return;
      if (p && p.slug !== slug) return;
      setRawPost(p);
    });
    return () => {
      active = false;
    };
  }, [slug, preloaded]);

  // Definitive guard against cross-article content leaks: never expose a post
  // whose slug does not match the current route, not even for a single frame
  // during client-side navigation. A mismatch is treated as loading (undefined),
  // so an article URL can only ever render its own content.
  const post =
    rawPost && slug && rawPost.slug !== slug ? undefined : rawPost;

  // Language-aware fields
  const displayTitle = post ? (lang === "nl" && post.title_nl ? post.title_nl : post.title) : "";
  const displayExcerpt = post ? (lang === "nl" && post.excerpt_nl ? post.excerpt_nl : post.excerpt) : "";
  const displayContent = post ? (lang === "nl" && post.content_nl ? post.content_nl : post.content) : "";

  const { html: bodyHtml, headings } = useMemo(
    () => renderArticle(displayContent || "", post?.masking, lang === "nl" ? "nl" : "en"),
    [displayContent, post?.masking, lang]
  );
  const showToc = headings.length >= 3;

  /* Hydration self-heal: the prerendered/SSR HTML is built for one language,
     but the client can mount in the other (useLang). React does not reconcile
     children inside dangerouslySetInnerHTML during hydration, which left the
     stale server-language DOM — without the client's anchors — on first paint.
     After mount (and on every recompute) force the DOM to match bodyHtml. */
  useEffect(() => {
    if (!bodyHtml) return;
    // Marker-based guard: some page loads intermittently end up with a stale
    // article DOM even though React's props hold the correct html (observed
    // live; root cause is a mount/transition race). Stamp every write with a
    // content marker and re-assert for the first seconds after mount — any
    // write that isn't ours loses. Content or language changes update the
    // marker via the dependency and re-run the guard.
    const mark = String(bodyHtml.length);
    const heal = () => {
      const el = articleRef.current?.querySelector<HTMLElement>(".prose");
      if (!el || !el.isConnected) return;
      if (el.dataset.h !== mark) { el.innerHTML = bodyHtml; el.dataset.h = mark; }
    };
    heal();
    const iv = window.setInterval(heal, 400);
    const stop = window.setTimeout(() => window.clearInterval(iv), 6000);
    return () => { window.clearInterval(iv); window.clearTimeout(stop); };
  }, [bodyHtml]);

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
      let curIdx = 0;
      secs.forEach((s, idx) => { if (s.getBoundingClientRect().top <= 140) curIdx = idx; });
      const curId = secs[curIdx].id;
      links.forEach((a) => {
        const idx = headings.findIndex((h) => h.id === a.dataset.toc);
        a.classList.toggle("active", a.dataset.toc === curId);
        a.classList.toggle("done", idx > -1 && idx < curIdx);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [post, showToc, headings, slug]);

  /* ── Back-to-top visibility ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setShowBtt(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close mobile TOC on ESC or route change ── */
  useEffect(() => { setMtocOpen(false); }, [slug]);
  useEffect(() => {
    if (!mtocOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMtocOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [mtocOpen]);

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

  const handleWebShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: displayTitle, url: currentUrl });
      } catch {
        /* user cancelled — ignore */
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMtocClick = (e: React.MouseEvent, id: string) => {
    scrollToHeading(e, id);
    setMtocOpen(false);
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
              <div className="byline__r">E-commerce and Marketplace Specialist</div>
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
                {headings.map((h, i) => (
                  <li key={h.id}>
                    <a data-toc={h.id} href={`#${h.id}`} onClick={(e) => scrollToHeading(e, h.id)}>
                      <span className="toc__n" aria-hidden="true"><i>{String(i + 1).padStart(2, "0")}</i><b>✓</b></span>
                      <span>{h.text}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : (
            <div aria-hidden />
          )}
          <div className="prose" key={`prose-${lang}-${bodyHtml.length}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </div>

        {/* Tags — link to the filtered /writing index */}
        {post.tags.length > 0 && (
          <div className="atags">
            {post.tags.map((t) => (
              <Link key={t} className="atag" to={`/writing?tag=${encodeURIComponent(t)}`}>{t}</Link>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="share">
          <span className="share__l">{lang === "nl" ? "Delen" : "Share"}</span>
          <a href={shareLinkedIn} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
          <a href={shareTwitter} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"><Twitter size={17} /></a>
          <button type="button" onClick={handleCopyLink} aria-label={lang === "nl" ? "Kopieer link" : "Copy link"}><Link2 size={17} /></button>
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button type="button" className="share__native" onClick={handleWebShare} aria-label={lang === "nl" ? "Delen via..." : "Share via..."}><Share2 size={20} /></button>
          )}
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

      {/* Mobile TOC FAB */}
      {showToc && (
        <button
          className="mtoc-fab"
          onClick={() => setMtocOpen(true)}
          aria-label={lang === "nl" ? "Inhoudsopgave" : "Table of contents"}
        >
          <List />
        </button>
      )}

      {/* Mobile TOC Bottom Sheet */}
      {showToc && mtocOpen && (
        <div className="mtoc-sheet open" onClick={(e) => { if (e.target === e.currentTarget) setMtocOpen(false); }}>
          <div className="mtoc-panel" role="dialog" aria-modal="true" aria-label={lang === "nl" ? "Inhoudsopgave" : "Table of contents"}>
            <div className="mtoc-handle" />
            <div className="mtoc-panel__hd">{lang === "nl" ? "In dit artikel" : "In this article"}</div>
            <ol>
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} onClick={(e) => handleMtocClick(e, h.id)}>{h.text}</a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Back to top */}
      <button
        className={`btt${showBtt ? " show" : ""}`}
        onClick={scrollToTop}
        aria-label={lang === "nl" ? "Naar boven" : "Back to top"}
      >
        <ArrowUp />
      </button>

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
