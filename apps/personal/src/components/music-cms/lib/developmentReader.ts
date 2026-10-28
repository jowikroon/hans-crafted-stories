import type { ArtworkAsset } from "./artworkModel";

export function normalizedResource(raw: string) {
  let path = raw;
  try { path = decodeURIComponent(path); } catch { /* Preserve malformed archive paths. */ }
  return path.replaceAll("\\", "/").replace(/^file:\/+/, "").replace(/[?#].*$/, "").toLowerCase();
}

export function matchArtwork(raw: string, pagePath: string, assets: ArtworkAsset[]) {
  const source = normalizedResource(raw);
  const absolute = /^(?:[a-z]:|https?:)/.test(source) ? source : normalizedResource(pagePath).replace(/[^/]*$/, "") + source.replace(/^\.\//, "");
  const matches = assets.filter(a => a.origins.some(o => {
    const key = normalizedResource(`${o.collection}/${o.file}`);
    return absolute.endsWith(`/${key}`);
  }));
  // Ambiguous references must not silently display a different version.
  return matches.length === 1 ? matches[0] : null;
}

export function prepareDevelopmentDocument(html: string, resources: Map<string, string>) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,iframe,object,embed,base,meta[http-equiv],form,link").forEach(el => el.remove());
  let missing = 0;
  doc.querySelectorAll("*").forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name) || ["srcdoc", "action", "formaction", "ping", "srcset", "autoplay"].includes(attr.name)) el.removeAttribute(attr.name);
    }
    for (const attr of ["src", "poster"]) {
      const value = el.getAttribute(attr); if (!value) continue;
      if (/^data:(image\/(png|jpeg|webp|gif)|audio\/|video\/)/i.test(value)) continue;
      const replacement = resources.get(value);
      if (replacement) el.setAttribute(attr, replacement);
      else { el.removeAttribute(attr); missing++; el.setAttribute("title", "Dit archiefbestand is nog niet online gekoppeld."); }
    }
    const href = el.getAttribute("href");
    if (href && !href.startsWith("#")) { el.removeAttribute("href"); el.removeAttribute("target"); }
  });
  const origins = [...new Set([...resources.values()].map(url => new URL(url).origin))].join(" ");
  const csp = doc.createElement("meta");
  csp.httpEquiv = "Content-Security-Policy";
  csp.content = `default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data: ${origins}; media-src data: ${origins}; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'`;
  doc.head.prepend(csp);
  return { html: "<!doctype html>" + doc.documentElement.outerHTML, missing };
}
