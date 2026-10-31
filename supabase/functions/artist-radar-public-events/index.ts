// Public, read-only concert feed for the Artist Radar UI.
// No subscriber data, tokens, email addresses, or mutable endpoints are exposed.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};
const HEADERS = { ...CORS, "Content-Type": "application/json; charset=utf-8" };
const VALID_STATES = new Set(["available", "announced", "rumored", "sold_out"]);

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
      .select("artist_id,artist_name,venue,city,country,event_date,sort_key,status,urgent,updated_at,source")
      .eq("active", true)
      .gte("sort_key", todayInAmsterdam())
      .order("sort_key", { ascending: true })
      .limit(500);
    if (error) {
      console.error("Artist Radar public feed read failed:", error.message);
      return json({ ok: false, error: "temporarily_unavailable" }, 503);
    }

    // Multiple import sources can name the same venue differently. For a given
    // artist, city and date, show the most recently updated source signal.
    const deduped = new Map<string, NonNullable<typeof data>[number]>();
    // On an exact update-time tie, avoid claiming tickets remain available when sold out.
    const priority: Record<string, number> = { sold_out: 4, available: 3, announced: 2, rumored: 1 };
    for (const row of data ?? []) {
      // Legacy seeded demo records are not source-verified concerts and must never appear in public alerts.
      if (row.source === "seed") continue;
      if (!VALID_STATES.has(row.status) || !["NL", "BE"].includes(row.country)) continue;
      const key = [row.artist_id, row.country, String(row.city ?? "").toLowerCase().trim(), row.sort_key].join("|");
      const prev = deduped.get(key);
      if (!prev || String(row.updated_at ?? "") > String(prev.updated_at ?? "") ||
          (String(row.updated_at ?? "") === String(prev.updated_at ?? "") && priority[row.status] > priority[prev.status])) {
        deduped.set(key, row);
      }
    }
    const events = [...deduped.values()].slice(0, 150).map((row) => ({
      artist_id: row.artist_id,
      artist_name: row.artist_name,
      venue: row.venue,
      city: row.city,
      country: row.country,
      event_date: row.event_date,
      sort_key: row.sort_key,
      status: row.status,
      urgent: row.status === "available" && Boolean(row.urgent),
    }));
    return json({ ok: true, events, checked_at: new Date().toISOString() }, 200, {
      "Cache-Control": "public, max-age=60, s-maxage=300",
    });
  } catch (error) {
    console.error("Artist Radar public feed error:", error instanceof Error ? error.message : "unknown");
    return json({ ok: false, error: "temporarily_unavailable" }, 503);
  }
});
