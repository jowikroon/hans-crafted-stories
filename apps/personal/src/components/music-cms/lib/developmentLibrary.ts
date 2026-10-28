export interface DevelopmentPage {
  id: string;
  title: string;
  category: string;
  status: string;
  project: string;
  local_path: string;
  source_modified: string;
  hosted_url: string | null;
  source_sha256?: string | null;
  source_origin?: string | null;
}

export function libraryIndexPath(pages: DevelopmentPage[]): string | null {
  const parts = pages[0]?.local_path.split(/[\\/]Pages[\\/]/);
  return parts && parts.length > 1 ? `${parts[0]}\\index.html` : null;
}

export function filterDevelopmentPages(pages: DevelopmentPage[], category: string, search: string, status = "") {
  const terms = search.toLocaleLowerCase("nl").trim().split(/\s+/).filter(Boolean);
  return pages.filter(page => (!category || page.category === category) && (!status || page.status === status) && terms.every(term =>
    [page.title, page.project, page.category, page.status].join(" ").toLocaleLowerCase("nl").includes(term)));
}

export function groupDevelopmentPages(pages: DevelopmentPage[]) {
  const groups = new Map<string, DevelopmentPage[]>();
  for (const page of pages) {
    const key = page.source_sha256 || page.id;
    groups.set(key, [...(groups.get(key) ?? []), page]);
  }
  return [...groups.values()].map(copies => ({ page: copies.find(p => p.source_origin === "AI-project") ?? copies[0], copies }));
}

export function pageOrigin(page: DevelopmentPage): string {
  if (page.source_origin) return page.source_origin;
  const path = page.local_path.replaceAll("\\", "/").toLowerCase();
  if (path.includes("/vault-copies/")) return "Vault-kopie";
  if (path.includes("/album-copies/")) return "Albumarchief";
  if (path.includes("/collection-copies/")) return "Collectiearchief";
  if (path.includes("/long-paths/")) return "Bronarchief";
  return "Projectarchief";
}

export function pageDate(raw: string): string {
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(date) : "Datum onbekend";
}

export function safeHostedUrl(raw: string | null): string | null {
  if (!raw) return null;
  try { const url = new URL(raw); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

export function drivePageLinks(raw: string | null) {
  const safe = safeHostedUrl(raw);
  if (!safe) return null;
  const url = new URL(safe);
  const match = /^\/file\/d\/([A-Za-z0-9_-]+)\/view$/.exec(url.pathname);
  if (url.hostname !== "drive.google.com" || !match) return null;
  return { view: `https://drive.google.com/file/d/${match[1]}/view`, download: `https://drive.google.com/uc?export=download&id=${match[1]}` };
}
