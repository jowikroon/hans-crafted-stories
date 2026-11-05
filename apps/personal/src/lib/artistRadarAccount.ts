/**
 * The signed-in Artist Radar is separate from the older anonymous newsletter
 * subscription. Every account write is checked again by Supabase RLS.
 *
 * Database types will be regenerated after the additive migration is deployed;
 * until then this narrow adapter prevents unrelated generated types changing.
 */
import { supabase } from "@/integrations/supabase/client";
import { RADAR_ARTISTS, type RadarArtist } from "@/lib/artistRadarCatalog";
export type { RadarArtist } from "@/lib/artistRadarCatalog";

export const RADAR_CATEGORIES = ["rumored", "announced", "available", "sold_out"] as const;
export type RadarCategory = (typeof RADAR_CATEGORIES)[number];
export type RadarCountry = "NL" | "BE";

export const CATEGORY_LABELS: Record<RadarCategory, string> = {
  rumored: "Geruchten",
  announced: "Aankondigingen",
  available: "Ticketverkoop",
  sold_out: "Uitverkocht",
};

export const RADAR_SUGGESTIONS = RADAR_ARTISTS;
export type RadarFollow = {
  user_id: string;
  artist_id: string;
  artist_name: string;
  genre: string;
  created_at: string;
};
export type RadarPreferences = {
  countries: RadarCountry[];
  categories: RadarCategory[];
};
export type RadarActivityKind = "followed" | "unfollowed" | "preferences_updated" | "ticket_link_opened";
export type RadarActivity = {
  id: string;
  kind: RadarActivityKind;
  artist_id: string | null;
  artist_name: string | null;
  event_key: string | null;
  provider: string | null;
  created_at: string;
};
export type RadarStatusHistory = {
  id: string;
  artist_id: string;
  old_status: RadarCategory | null;
  new_status: RadarCategory;
  event_key: string;
  observed_at: string;
  source: string;
};
export type RadarPublicEvent = {
  artist_id: string;
  artist_name: string;
  venue: string;
  city: string;
  country: RadarCountry;
  event_date: string;
  sort_key: number;
  status: RadarCategory;
  urgent: boolean;
  event_key?: string;
  source?: string | null;
  source_checked_at?: string | null;
  ticket?: { url: string; seller: string; verified_at: string } | null;
};
export type RadarPublicFeed = { events: RadarPublicEvent[]; checkedAt: string };

export const DEFAULT_RADAR_PREFERENCES: RadarPreferences = {
  countries: ["NL", "BE"],
  categories: ["rumored", "announced", "available", "sold_out"],
};

// Generated Supabase types do not contain these pre-release tables. Keep the
// temporary adapter narrow, then replace it with regenerated DB types after
// the staging migrations. Never accept a caller-supplied identity as authority.
type RadarQueryResult = { data?: unknown; error?: { message?: string; code?: string } | null };
type RadarQuery = PromiseLike<RadarQueryResult> & {
  select: (columns: string) => RadarQuery;
  eq: (column: string, value: unknown) => RadarQuery;
  in: (column: string, values: string[]) => RadarQuery;
  order: (column: string, options: { ascending: boolean }) => RadarQuery;
  limit: (count: number) => RadarQuery;
  maybeSingle: () => RadarQuery;
  insert: (values: Record<string, unknown>) => RadarQuery;
  update: (values: Record<string, unknown>) => RadarQuery;
  delete: () => RadarQuery;
};
const db = supabase as unknown as { from: (name: string) => RadarQuery };

function checkResult<T>(result: RadarQueryResult, fallback: string): T {
  if (result.error) throw new Error(fallback);
  return result.data as T;
}

export function safeRadarArtist(rawName: string, candidates: readonly RadarArtist[] = RADAR_SUGGESTIONS): RadarArtist | null {
  const name = rawName.trim().replace(/\s+/g, " ").slice(0, 100);
  if (name.length < 2) return null;
  const normalized = (value: string) => value.toLocaleLowerCase("nl-NL")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const known = candidates.find((a) => normalized(a.name) === normalized(name));
  if (known) return { id: known.id, name: known.name, genre: known.genre };
  const slug = name.toLocaleLowerCase("nl-NL").normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  if (!slug) return null;
  // A custom artist has no verified concert match until the public feed gains it.
  return { id: `custom:${slug}`, name, genre: "Eigen keuze" };
}

export function validRadarEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function radarStatusLabel(status: RadarCategory): string {
  return status === "rumored" ? "Gerucht · onbevestigd" :
    status === "available" ? "Ticketverkoop gemeld" :
      status === "sold_out" ? "Uitverkocht" : "Aangekondigd";
}

export async function listRadarFollows(userId: string): Promise<RadarFollow[]> {
  const result = await db.from("artist_radar_follows")
    .select("user_id,artist_id,artist_name,genre,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  return checkResult<RadarFollow[]>(result, "Je gevolgde artiesten konden niet worden geladen.") ?? [];
}

export async function addRadarFollow(userId: string, artist: RadarArtist): Promise<void> {
  const result = await db.from("artist_radar_follows").insert({
    user_id: userId,
    artist_id: artist.id,
    artist_name: artist.name,
    genre: artist.genre,
  });
  checkResult(result, "Artiest volgen is niet gelukt.");
  await recordRadarActivity({ userId, kind: "followed", artistId: artist.id, artistName: artist.name }).catch(() => undefined);
}

export async function removeRadarFollow(userId: string, follow: RadarFollow): Promise<void> {
  const result = await db.from("artist_radar_follows").delete()
    .eq("user_id", userId).eq("artist_id", follow.artist_id);
  checkResult(result, "De artiest kon niet worden verwijderd.");
  await recordRadarActivity({ userId, kind: "unfollowed", artistId: follow.artist_id, artistName: follow.artist_name }).catch(() => undefined);
}

export async function loadRadarPreferences(userId: string): Promise<RadarPreferences> {
  const result = await db.from("artist_radar_preferences")
    .select("countries,categories").eq("user_id", userId).maybeSingle();
  const row = checkResult<Partial<RadarPreferences> | null>(result, "Radarvoorkeuren konden niet worden geladen.");
  if (!row) return { ...DEFAULT_RADAR_PREFERENCES, countries: ["NL", "BE"], categories: [...RADAR_CATEGORIES] };
  const countries = (Array.isArray(row.countries) ? row.countries : []).filter((c): c is RadarCountry => c === "NL" || c === "BE");
  const categories = (Array.isArray(row.categories) ? row.categories : []).filter((c): c is RadarCategory => RADAR_CATEGORIES.includes(c));
  return { countries: countries.length ? countries : ["NL", "BE"], categories: categories.length ? categories : [...RADAR_CATEGORIES] };
}

export async function saveRadarPreferences(userId: string, prefs: RadarPreferences): Promise<void> {
  if (!prefs.countries.length || !prefs.categories.length) throw new Error("Kies minstens één land en één rubriek.");
  // Avoid a generic UPSERT that can require UPDATE(user_id) privilege.
  // The account table deliberately grants only UPDATE(countries,categories).
  const existing = await db.from("artist_radar_preferences")
    .select("user_id").eq("user_id", userId).maybeSingle();
  checkResult(existing, "Radarvoorkeuren konden niet worden gecontroleerd.");
  const update = () => db.from("artist_radar_preferences")
    .update({ countries: prefs.countries, categories: prefs.categories })
    .eq("user_id", userId);
  if (existing.data) {
    checkResult(await update(), "Radarvoorkeuren opslaan is niet gelukt.");
  } else {
    const inserted = await db.from("artist_radar_preferences").insert({
      user_id: userId, countries: prefs.countries, categories: prefs.categories,
    });
    // Concurrent first-time requests may race on the primary key.
    if (inserted.error?.code === "23505") {
      checkResult(await update(), "Radarvoorkeuren opslaan is niet gelukt.");
    } else {
      checkResult(inserted, "Radarvoorkeuren opslaan is niet gelukt.");
    }
  }
  await recordRadarActivity({ userId, kind: "preferences_updated" }).catch(() => undefined);
}

type NewRadarActivity = {
  userId: string;
  kind: RadarActivityKind;
  artistId?: string;
  artistName?: string;
  eventKey?: string;
  provider?: string;
};

export async function recordRadarActivity(entry: NewRadarActivity): Promise<void> {
  const result = await db.from("artist_radar_activity").insert({
    user_id: entry.userId,
    kind: entry.kind,
    artist_id: entry.artistId ?? null,
    artist_name: entry.artistName ?? null,
    event_key: entry.eventKey ?? null,
    provider: entry.provider ?? null,
  });
  checkResult(result, "De activiteit kon niet worden geregistreerd.");
}

/** A click record, not an order, reservation, purchase, or ticket entitlement. */
export async function recordRadarTicketLinkOpen(
  userId: string, artistId: string, artistName: string, eventKey: string, provider: string,
): Promise<void> {
  await recordRadarActivity({ userId, kind: "ticket_link_opened", artistId, artistName, eventKey, provider });
}

export async function listRadarActivity(userId: string): Promise<RadarActivity[]> {
  const result = await db.from("artist_radar_activity")
    .select("id,kind,artist_id,artist_name,event_key,provider,created_at")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(40);
  return checkResult<RadarActivity[]>(result, "Accountgeschiedenis kon niet worden geladen.") ?? [];
}

export async function listRadarStatusHistory(artistIds: string[]): Promise<RadarStatusHistory[]> {
  if (!artistIds.length) return [];
  const result = await db.from("artist_radar_status_history")
    .select("id,artist_id,old_status,new_status,event_key,observed_at,source")
    .in("artist_id", artistIds.slice(0, 100)).order("observed_at", { ascending: false }).limit(30);
  return checkResult<RadarStatusHistory[]>(result, "De statushistorie kon niet worden geladen.") ?? [];
}

function isRadarEventShape(value: unknown): value is RadarPublicEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return typeof e.artist_id === "string" && typeof e.artist_name === "string" &&
    typeof e.event_date === "string" && typeof e.sort_key === "number" && Number.isFinite(e.sort_key) &&
    (e.country === "NL" || e.country === "BE") && RADAR_CATEGORIES.includes(e.status as RadarCategory);
}

export async function loadPublicRadarEvents(signal?: AbortSignal): Promise<RadarPublicFeed> {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error("De openbare radarbron is niet geconfigureerd.");
  const response = await fetch(`${base}/functions/v1/artist-radar-public-events`, { signal });
  if (!response.ok) throw new Error("Concertsignalen zijn momenteel niet beschikbaar.");
  const result = await response.json();
  if (result?.ok !== true || !Array.isArray(result.events)) throw new Error("Het radarantwoord heeft een onbekend formaat.");
  const events = (result.events as unknown[]).filter(isRadarEventShape).slice(0, 150).map((e) => ({
    artist_id: String(e.artist_id).slice(0, 100),
    artist_name: String(e.artist_name).slice(0, 100),
    venue: String(e.venue ?? "").slice(0, 140),
    city: String(e.city ?? "").slice(0, 120),
    country: e.country,
    event_date: e.event_date,
    sort_key: e.sort_key,
    status: e.status,
    urgent: e.urgent === true,
    event_key: typeof e.event_key === "string" ? e.event_key.slice(0, 160) : undefined,
    source: typeof e.source === "string" ? e.source.slice(0, 200) : null,
    source_checked_at: typeof e.source_checked_at === "string" ? e.source_checked_at : null,
    ticket: e.ticket && typeof e.ticket.url === "string" && typeof e.ticket.seller === "string" &&
      typeof e.ticket.verified_at === "string" ? {
        url: e.ticket.url.slice(0, 2048),
        seller: e.ticket.seller.slice(0, 100),
        verified_at: e.ticket.verified_at,
      } : null,
  })) as RadarPublicEvent[];
  return { events, checkedAt: typeof result.checked_at === "string" ? result.checked_at : "" };
}
