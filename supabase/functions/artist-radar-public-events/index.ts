// Public, read-only concert feed for the Artist Radar UI.
// No subscriber data, tokens, email addresses, or mutable endpoints are exposed.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  // Browser Supabase function clients send apikey/authorization/x-client-info,
  // even for anonymous read-only GET requests. Their OPTIONS preflight must pass.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const HEADERS = { ...CORS, "Content-Type": "application/json; charset=utf-8" };
const VALID_STATES = new Set(["available", "announced", "rumored", "sold_out"]);
// Deliberately short: a link is a route to the seller, not a stock promise.
const TICKET_LINK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const VERIFIED_SELLER_HOSTS: Record<string, string> = {
  "ticketmaster.nl": "Ticketmaster",
  "ticketmaster.be": "Ticketmaster",
  "ticketmaster.com": "Ticketmaster",
  "eventim.nl": "Eventim",
  "eventim.be": "Eventim",
  "livenation.nl": "Live Nation",
  "livenation.be": "Live Nation",
  "ziggodome.nl": "Ziggo Dome",
  "afaslive.nl": "AFAS Live",
  "tivolivredenburg.nl": "TivoliVredenburg",
  "paradiso.nl": "Paradiso",
  "melkweg.nl": "Melkweg",
  "013.nl": "013",
  "abconcerts.be": "Ancienne Belgique",
};
// Raw import source identifiers may be internal. Only expose public aliases.
const PUBLIC_SOURCE_LABELS: Record<string, string> = {
  "ticketmaster": "Ticketmaster",
  "eventim": "Eventim",
  "livenation": "Live Nation",
  "mojo": "MOJO",
  "venue": "Concertzaal",
  "promoter": "Promotor",
  "official_venue": "Concertzaal",
  "official_artist": "Artiest",
};

type ConcertRow = {
  id: string;
  artist_id: string;
  artist_name: string;
  venue: string | null;
  city: string | null;
  country: string;
  event_date: string;
  sort_key: number;
  status: string;
  urgent: boolean | null;
  updated_at: string | null;
  source: string | null;
  source_event_id: string | null;
  source_checked_at: string | null;
  official_ticket_url: string | null;
  ticket_seller: string | null;
  ticket_verified_source: string | null;
  ticket_verified_at: string | null;
};

function allowedSeller(url: URL): string | null {
  if (url.protocol !== "https:" || url.username || url.password ||
      (url.port && url.port !== "443")) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  for (const [domain, seller] of Object.entries(VERIFIED_SELLER_HOSTS)) {
    if (host === domain || host.endsWith(`.${domain}`)) return seller;
  }
  return null;
}

function verifiedTicketLink(row: ConcertRow, now: number) {
  if (row.status !== "available" || !row.official_ticket_url ||
      !row.ticket_seller || !row.ticket_verified_source ||
      !row.ticket_verified_at || !row.source_checked_at) return null;
  const verified = Date.parse(row.ticket_verified_at);
  const checked = Date.parse(row.source_checked_at);
  if (!Number.isFinite(verified) || !Number.isFinite(checked) ||
      verified > now || checked > now ||
      now - verified > TICKET_LINK_MAX_AGE_MS ||
      now - checked > TICKET_LINK_MAX_AGE_MS) return null;
  try {
    const destination = new URL(row.official_ticket_url);
    const evidence = new URL(row.ticket_verified_source);
    const seller = allowedSeller(destination);
    // A ticket CTA requires independently recorded evidence from a known
    // official seller or venue, not merely an arbitrary importer's URL.
    if (!seller || !allowedSeller(evidence)) return null;
    return {
      url: destination.toString(),
      seller,
      verified_at: new Date(verified).toISOString(),
    };
  } catch {
    return null;
  }
}

function dedupeIdentity(row: ConcertRow): string {
  const external = String(row.source_event_id ?? "").trim();
  if (external) return ["official", row.source ?? "unknown", row.artist_id, external]
    .map((part) => String(part).normalize("NFKC").toLowerCase().trim()).join("|");
  // Without an authoritative event ID, never merge: two performances may be
  // at the same venue, by the same artist, on the same date. Show both safely.
  return `row|${row.id}`;
}

function todayInAmsterdam(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return Number(part("year") + part("month") + part("day"));
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ ok: false, error: "temporarily_unavailable" }, 503);

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from("artist_radar_concerts")
      .select("id,artist_id,artist_name,venue,city,country,event_date,sort_key,status,urgent,updated_at,source,source_event_id,source_checked_at,official_ticket_url,ticket_seller,ticket_verified_source,ticket_verified_at")
      .eq("active", true)
      .gte("sort_key", todayInAmsterdam())
      .order("sort_key", { ascending: true })
      .limit(500);
    if (error) {
      console.error("Artist Radar public feed read failed:", error.message);
      return json({ ok: false, error: "temporarily_unavailable" }, 503);
    }

    // Prefer stable source event IDs; without one retain distinct DB rows.
    const deduped = new Map<string, ConcertRow>();
    // On an exact update-time tie, avoid claiming tickets remain available when sold out.
    const priority: Record<string, number> = { sold_out: 4, available: 3, announced: 2, rumored: 1 };
    for (const row of data ?? []) {
      // Legacy seeded demo records are not source-verified concerts and must never appear in public alerts.
      if (row.source === "seed") continue;
      if (!VALID_STATES.has(row.status) || !["NL", "BE"].includes(row.country)) continue;
      const key = dedupeIdentity(row);
      const prev = deduped.get(key);
      if (!prev || String(row.updated_at ?? "") > String(prev.updated_at ?? "") ||
          (String(row.updated_at ?? "") === String(prev.updated_at ?? "") && priority[row.status] > priority[prev.status])) {
        deduped.set(key, row);
      }
    }
    const now = Date.now();
    const events = [...deduped.values()].slice(0, 150).map((row) => ({
      // Stable immutable database identity, even if a venue's spelling changes.
      event_key: row.id,
      artist_id: row.artist_id,
      artist_name: row.artist_name,
      venue: row.venue,
      city: row.city,
      country: row.country,
      event_date: row.event_date,
      sort_key: row.sort_key,
      status: row.status,
      urgent: row.status === "available" && Boolean(row.urgent),
      source: PUBLIC_SOURCE_LABELS[String(row.source ?? "").toLowerCase().trim()] ?? null,
      // A database write timestamp is not evidence of a checked live source.
      source_checked_at: row.source_checked_at ?? null,
      ticket: verifiedTicketLink(row, now),
    }));
    return json({ ok: true, events, checked_at: new Date().toISOString() }, 200, {
      "Cache-Control": "public, max-age=60, s-maxage=300",
    });
  } catch (error) {
    console.error("Artist Radar public feed error:", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, error: "temporarily_unavailable" }, 503);
  }
});
