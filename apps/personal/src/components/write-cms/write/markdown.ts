import TurndownService from "turndown";

// ─── Markdown ↔ HTML for the Write CMS TipTap editor ─────────────────────────
// Storage format stays markdown (blog_posts.content / content_nl render via
// renderMarkdown on the public BlogPostPage). The editor works in HTML.

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
  hr: "---",
});

export function mdToHtml(md: string): string {
  if (!md) return "";
  let html = md
    // Code blocks first so their contents are not re-processed
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre><code class="language-${lang || "plaintext"}">${code.replace(/</g, "&lt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, label, href) => {
      const h = href.startsWith("/blog/") ? "/writing/" + href.slice("/blog/".length) : href;
      // Same safety contract as the live article renderer: only http(s),
      // site-relative, #anchor and mailto; anything else stays literal text.
      if (!/^(https?:\/\/|\/(?![/\\])|#|mailto:)/i.test(h)) return m;
      const ext = /^https?:\/\//i.test(h);
      return `<a href="${h.replace(/"/g, "&quot;")}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
    })
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<oli>$1</oli>")
    .replace(/^---$/gm, "<hr />");

  // Wrap consecutive <li> runs in <ul>, <oli> runs in <ol>
  html = html
    .replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m.replace(/\n/g, "")}</ul>\n`)
    .replace(/(?:<oli>[\s\S]*?<\/oli>\n?)+/g, (m) => `<ol>${m.replace(/<\/?oli>/g, (t) => t.replace("oli", "li")).replace(/\n/g, "")}</ol>\n`);

  // Paragraphs: split on blank lines; skip lines that are already block-level
  const blocks = html.split(/\n{2,}/).map((b) => {
    const t = b.trim();
    if (!t) return "";
    if (/^<(h[1-6]|ul|ol|li|blockquote|pre|hr|img|p)/.test(t)) return t;
    return `<p>${t.replace(/\n/g, "<br />")}</p>`;
  });
  return blocks.filter(Boolean).join("\n");
}

export function htmlToMd(html: string): string {
  if (!html) return "";
  return turndown.turndown(html);
}

export interface OutlineHeading {
  level: number;
  text: string;
  /** Sequence index among headings — used to locate the node in the editor doc */
  index: number;
}

export function extractOutline(md: string): OutlineHeading[] {
  const out: OutlineHeading[] = [];
  let i = 0;
  for (const line of (md ?? "").split("\n")) {
    const m = line.match(/^(#{2,3}) (.+)$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), index: i++ });
  }
  return out;
}
