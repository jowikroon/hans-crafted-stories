// Artist Radar — subscribe (double opt-in) / confirm / unsubscribe / search_log.
// Public endpoint (verify_jwt=false). Supabase edge functions are forced to
// text/plain (no HTML) on *.supabase.co, so confirm/unsub 303-redirect to a
// static status page on hansvanleeuwen.com that renders as proper text/html.
//
// search_log (2026-09-30): the radar page searches a fixed client-side artist
// list. Every settled search (hit or miss) is POSTed here so misses end up in
// public.artist_radar_searches -> v_artist_radar_search_misses (HVL dashboard).
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("ARTIST_RADAR_FROM_EMAIL") ?? "Artist Radar <radar@hansvanleeuwen.com>";
const SITE = "https://hansvanleeuwen.com";
const FN_BASE = `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/artist-radar-signup`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
// Supabase blocks text/html from edge functions -> redirect to a static page.
function redir(state: string) {
  return Response.redirect(`${SITE}/artist-radar/status.html?state=${state}`, 303);
}

// All artist names are user-supplied; never interpolate them as raw email HTML.
function escapeHtml(value: string): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function cleanArtists(raw: unknown): { id: string; name: string; genre: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 25).map((a) => {
    const o = (a && typeof a === "object") ? a as Record<string, unknown> : {};
    return { id: String(o.id ?? "").slice(0, 80), name: String(o.name ?? "").slice(0, 100), genre: String(o.genre ?? "").slice(0, 80) };
  }).filter((a) => a.name);
}
function cleanCountries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => String(c).toUpperCase()).filter((c) => c === "NL" || c === "BE");
}

const VARIANTS = new Set(["clean", "master", "compass"]);
function normQuery(s: string) {
  return s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
}

// Logs one settled search. Never fails loudly: the page fires and forgets.
async function logSearch(req: Request, body: Record<string, unknown>) {
  if (body.website) return json({ ok: true }); // honeypot
  const query = String(body.query ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const qn = normQuery(query).slice(0, 80);
  if (qn.length < 2) return json({ ok: false, error: "query_too_short" }, 400);
  const ids = Array.isArray(body.matched_ids)
    ? body.matched_ids.slice(0, 10).map((x) => String(x).slice(0, 80)).filter(Boolean)
    : [];
  const count = Math.max(0, Math.min(50, Number.isFinite(Number(body.result_count)) ? Math.trunc(Number(body.result_count)) : ids.length));
  const matched = body.matched === true || count > 0;
  const variant = VARIANTS.has(String(body.variant)) ? String(body.variant) : null;
  const session = String(body.session_id ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || null;

  // Dedupe: same session + same term within 30 minutes counts once.
  if (session) {
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: dup } = await supabase.from("artist_radar_searches")
      .select("id").eq("session_id", session).eq("query_norm", qn).gte("created_at", since).limit(1);
    if (dup && dup.length) return json({ ok: true, deduped: true });
  }

  const { error } = await supabase.from("artist_radar_searches").insert({
    query, query_norm: qn, matched, result_count: count, matched_ids: ids, variant, session_id: session,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    referer: (req.headers.get("referer") ?? "").slice(0, 300),
  });
  if (error) {
    console.error("search_log insert failed:", error.message);
    return json({ ok: false, error: "save_failed" }, 500);
  }
  return json({ ok: true, matched });
}

async function sendConfirmEmail(email: string, confirmToken: string, artists: { name: string }[], countries: string[], baseUrl: string) {
  if (!RESEND_API_KEY) return { sent: false, reason: "RESEND_API_KEY ontbreekt" };
  const confirmUrl = `${baseUrl}?action=confirm&token=${confirmToken}`;
  const chips = artists.map((a) => `<span style="display:inline-block;padding:6px 12px;margin:3px;border-radius:999px;background:rgba(160,113,79,.08);border:1px solid rgba(160,113,79,.25);font-size:13px;color:#7C5638;font-weight:600">${escapeHtml(a.name)}</span>`).join("");
  const scope = countries.map((c) => (c === "NL" ? "Nederland" : "België")).join(" & ") || "NL & BE";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "Bevestig je Artist Radar — nog één tik",
      html: `<div style="font-family:'Instrument Sans',system-ui,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;padding:32px;border-radius:14px;color:#57534E;border:1px solid rgba(0,0,0,.06)">`+
        `<div style="font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#A0714F">● Artist Radar</div>`+
        `<h1 style="color:#1C1917;font-size:22px;margin:14px 0 6px">Mooi. Je radar draait bijna.</h1>`+
        `<p style="line-height:1.6">Nog één tik: bevestig je aanmelding, dan houden we deze artiesten voor je in de gaten in <strong>${scope}</strong> — gerucht, aankondiging of ticketverkoop.</p>`+
        `<div style="margin:14px 0">${chips}</div>`+
        `<p style="text-align:center;margin:28px 0"><a href="${confirmUrl}" style="background:#A0714F;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Bevestig mijn radar</a></p>`+
        `<p style="font-size:12px;color:#A8A29E">Niet aangevraagd? Negeer deze mail dan gewoon — zonder bevestiging sturen we je niks.</p></div>`,
    }),
  });
  if (!res.ok) return { sent: false, reason: `Resend ${res.status}: ${await res.text()}` };
  return { sent: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const baseUrl = FN_BASE || `${url.origin}${url.pathname}`;
  const action = url.searchParams.get("action") ?? "subscribe";

  if (req.method === "GET" && action === "confirm") {
    const token = url.searchParams.get("token") ?? "";
    if (!token) return redir("invalid");
    const { data, error } = await supabase.from("artist_radar_signups")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token).neq("status", "unsubscribed").select("email").maybeSingle();
    if (error || !data) return redir("invalid");
    return redir("confirmed");
  }

  if (req.method === "GET" && action === "unsubscribe") {
    const token = url.searchParams.get("token") ?? "";
    if (!token) return redir("invalid");
    const { data, error } = await supabase.from("artist_radar_signups")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token).select("email").maybeSingle();
    if (error || !data) return redir("invalid");
    return redir("unsubscribed");
  }

  if (req.method === "POST" && action === "search_log") {
    let body: Record<string, unknown>;
    // sendBeacon posts text/plain; parse the raw text either way.
    try { body = JSON.parse(await req.text()); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
    return await logSearch(req, body);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
    if (body.website) return json({ ok: true, message: "Check je inbox om je aanmelding te bevestigen." }); // honeypot
    const email = String(body.email ?? "").trim().toLowerCase();
    const artists = cleanArtists(body.artists);
    const countries = cleanCountries(body.countries);
    if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);
    if (artists.length === 0) return json({ ok: false, error: "no_artists" }, 400);

    const { data: existing } = await supabase.from("artist_radar_signups")
      .select("id,status,confirm_token").ilike("email", email).maybeSingle();

    let confirmToken: string;
    const common = {
      artists, countries,
      user_agent: (req.headers.get("user-agent") ?? "").slice(0, 500),
      referer: (req.headers.get("referer") ?? "").slice(0, 500),
      source: String(body.source ?? "muziek/artist-radar").slice(0, 120),
    };
    if (existing) {
      if (existing.status === "confirmed") {
        const { error: updateError } = await supabase.from("artist_radar_signups")
          .update(common).eq("id", existing.id);
        if (updateError) {
          console.error("Artist Radar confirmed preference update failed:", updateError.message);
          return json({ ok: false, error: "save_failed" }, 500);
        }
        return json({ ok: true, confirmed: true, message: "Je radar is bijgewerkt — je was al bevestigd." });
      }
      const nt = crypto.randomUUID();
      const { error } = await supabase.from("artist_radar_signups")
        .update({ ...common, status: "pending", confirm_token: nt }).eq("id", existing.id);
      if (error) return json({ ok: false, error: "save_failed" }, 500);
      confirmToken = nt;
    } else {
      const { data: ins, error } = await supabase.from("artist_radar_signups")
        .insert({ email, ...common }).select("confirm_token").single();
      if (error) return json({ ok: false, error: "save_failed", detail: error.message.slice(0,200) }, 500);
      confirmToken = ins.confirm_token;
    }

    const mail = await sendConfirmEmail(email, confirmToken, artists, countries, baseUrl);
    if (!mail.sent) {
      console.error("Confirm-mail niet verzonden:", mail.reason);
      return json({ ok: true, mail_pending: true, message: "Aanmelding ontvangen! Bevestiging volgt zodra de mailservice actief is." });
    }
    return json({ ok: true, message: "Check je inbox om je aanmelding te bevestigen." });
  }

  return json({ ok: false, error: "method_not_allowed" }, 405);
});
