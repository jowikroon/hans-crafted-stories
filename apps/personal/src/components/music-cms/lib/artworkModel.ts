export interface ArtworkAsset {
  id: string;
  title: string;
  family_key: string;
  album: string;
  song: string | null;
  categories: string[];
  channels: string[];
  collections: string[];
  origins: { collection: string; file: string; version: string }[];
  format: string;
  role: string;
  width: number | null;
  height: number | null;
  bytes: number;
  storage_path: string;
  thumbnail_path: string | null;
  is_current: boolean;
  source_modified: string;
}

export interface ArtworkFilters { search: string; category: string; channel: string; album: string; song: string; collection: string; edition: string }
export const EMPTY_FILTERS: ArtworkFilters = { search: "", category: "", channel: "", album: "", song: "", collection: "", edition: "" };

export function changeArtworkCategory(assets: ArtworkAsset[], filters: ArtworkFilters, category: string): ArtworkFilters {
  const next = { ...filters, category };
  // Keep useful combinations, but don't carry a song/collection constraint into
  // a category where it hides every asset. The UI announces this reset.
  if (filterArtwork(assets, next).length || !filterArtwork(assets, { ...EMPTY_FILTERS, category }).length) return next;
  return { ...EMPTY_FILTERS, category };
}

export function filterArtwork(assets: ArtworkAsset[], filters: ArtworkFilters): ArtworkAsset[] {
  const terms = filters.search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return assets.filter(a => {
    const haystack = [a.title, a.song, a.album, a.format, a.role, ...a.categories, ...a.channels, ...a.collections, ...a.origins.map(o => o.file)].join(" ").toLocaleLowerCase();
    return terms.every(t => haystack.includes(t)) &&
      (!filters.category || a.categories.includes(filters.category)) &&
      (!filters.channel || a.channels.includes(filters.channel)) &&
      (!filters.album || a.album === filters.album) &&
      (!filters.song || a.song === filters.song) &&
      (!filters.collection || a.collections.includes(filters.collection)) &&
      (!filters.edition || (filters.edition === "current" ? a.is_current : !a.is_current));
  }).sort((a, b) => Number(b.is_current) - Number(a.is_current) || a.title.localeCompare(b.title) || a.format.localeCompare(b.format));
}

export function artworkVersions(assets: ArtworkAsset[], selected: ArtworkAsset): ArtworkAsset[] {
  return assets.filter(a => a.family_key === selected.family_key)
    .sort((a, b) => Number(b.is_current) - Number(a.is_current) || b.source_modified.localeCompare(a.source_modified));
}

export function groupArtwork(assets: ArtworkAsset[]): ArtworkAsset[] {
  const representatives = new Map<string, ArtworkAsset>();
  const score = (a: ArtworkAsset) => (a.is_current ? 100 : 0) + (a.role === "Artwork" ? 20 : 0) + (a.format === "PNG" ? 3 : a.format === "JPG" ? 2 : 0);
  for (const asset of assets) {
    const previous = representatives.get(asset.family_key);
    if (!previous || score(asset) > score(previous)) representatives.set(asset.family_key, asset);
  }
  return [...representatives.values()].sort((a, b) => Number(b.is_current) - Number(a.is_current) || Number(!!b.song) - Number(!!a.song) || a.title.localeCompare(b.title));
}

export const collectionLabel = (value: string) => value.replace(/^jowikroon-/, "").replaceAll("-", " ");
export const dimensions = (a: ArtworkAsset) => a.width && a.height ? `${a.width} × ${a.height}` : "Vector";
