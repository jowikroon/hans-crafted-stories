export function clearRootHtml(html: string): string {
  const marker = '<div id="root">';
  const start = html.indexOf(marker);
  if (start === -1) return html;

  const contentStart = start + marker.length;
  let cursor = contentStart;
  let depth = 1;
  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = contentStart;

  while (depth > 0) {
    const match = tagPattern.exec(html);
    if (!match) return html;
    cursor = match.index + match[0].length;
    if (match[0].startsWith("</")) {
      depth -= 1;
    } else {
      depth += 1;
    }
  }

  return `${html.slice(0, contentStart)}</div>${html.slice(cursor)}`;
}

export function replaceSsrFallbackHtml(html: string, fallbackHtml: string): string {
  return html.replace(
    /<!-- SSR fallback: rich crawlable content for search engines -->\s*<noscript>[\s\S]*?<\/noscript>/,
    `<!-- SSR fallback: rich crawlable content for search engines -->\n    <noscript>${fallbackHtml}</noscript>`
  );
}
