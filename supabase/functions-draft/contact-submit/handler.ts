// contact-submit — enige schrijfroute voor het contactformulier (draft; NIET in supabase/functions/).
// Browser -> deze functie (Turnstile + validatie) -> RPC public.contact_submit (EXECUTE alleen service_role).
// Pure handler met geïnjecteerde fetch/env zodat hij zonder netwerk testbaar is (handler_test.ts).
// Logt nooit naam, e-mail, bericht of token: alleen een uitkomstcategorie.

export type Env = {
  SUPABASE_URL?: string;
  /** Server-side sleutel (sb_secret_… of legacy service_role). Nooit in de browser. */
  CONTACT_DB_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Kommagescheiden toegestane Origins; standaard alleen het productiedomein. */
  CONTACT_ALLOWED_ORIGINS?: string;
};

export type Deps = {
  env: Env;
  fetch: typeof fetch;
  log?: (outcome: string) => void;
};

const DEFAULT_ORIGINS = ["https://hansvanleeuwen.com"];
const TURNSTILE_HOSTNAMES = new Set(["hansvanleeuwen.com"]);
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_BODY = 10_000;
const REASONS = new Set(["freelance", "job", "collaboration", "general"]);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Fields = { name: string; email: string; reason: string; message: string };

export function validate(input: unknown): Fields | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");
  const name = s("name").trim();
  const email = s("email").trim().toLowerCase();
  const reason = s("reason");
  const message = s("message").trim();
  if (name.length < 1 || name.length > 100) return null;
  if (email.length < 3 || email.length > 255 || !EMAIL_RE.test(email)) return null;
  if (!REASONS.has(reason)) return null;
  if (message.length < 1 || message.length > 2000) return null;
  return { name, email, reason, message };
}

function allowedOrigins(env: Env): string[] {
  const list = (env.CONTACT_ALLOWED_ORIGINS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

function json(status: number, body: Record<string, unknown>, origin: string | null): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers["access-control-max-age"] = "600";
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

async function verifyTurnstile(deps: Deps, token: string, secret: string): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token });
  const res = await deps.fetch(SITEVERIFY, { method: "POST", body: form });
  if (!res.ok) return false;
  const out = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
  return out.success === true
    && typeof out.hostname === "string" && TURNSTILE_HOSTNAMES.has(out.hostname)
    && (out.action === undefined || out.action === "contact");
}

async function callRpc(deps: Deps, f: Fields): Promise<"ok" | "limited" | "invalid" | "error"> {
  const { SUPABASE_URL, CONTACT_DB_KEY } = deps.env;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    apikey: CONTACT_DB_KEY!,
    prefer: "return=minimal",
  };
  // Legacy JWT-sleutels ook als Bearer; nieuwe sb_secret_-sleutels uitsluitend in `apikey`.
  if (CONTACT_DB_KEY!.startsWith("eyJ")) headers.authorization = `Bearer ${CONTACT_DB_KEY}`;
  const res = await deps.fetch(`${SUPABASE_URL}/rest/v1/rpc/contact_submit`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_name: f.name, p_email: f.email, p_reason: f.reason, p_message: f.message }),
  });
  if (res.ok) return "ok";
  let code = "";
  try {
    code = String(((await res.json()) as { code?: unknown }).code ?? "");
  } catch { /* geen JSON */ }
  if (code === "P4291" || code === "P4292") return "limited";
  if (code === "23514") return "invalid";
  return "error";
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const log = deps.log ?? (() => {});
  const origin = req.headers.get("origin");
  const okOrigin = origin && allowedOrigins(deps.env).includes(origin) ? origin : null;

  if (req.method === "OPTIONS") return okOrigin ? json(204, {}, okOrigin) : json(403, { error: "origin" }, null);
  if (req.method !== "POST") return json(405, { error: "method" }, okOrigin);
  if (!okOrigin) { log("origin_rejected"); return json(403, { error: "origin" }, null); }

  const { SUPABASE_URL, CONTACT_DB_KEY, TURNSTILE_SECRET_KEY } = deps.env;
  // Fail-closed: zonder captchageheim of dbsleutel wordt niets opgeslagen.
  if (!SUPABASE_URL || !CONTACT_DB_KEY || !TURNSTILE_SECRET_KEY) { log("misconfigured"); return json(503, { error: "unavailable" }, okOrigin); }

  const raw = await req.text();
  if (raw.length > MAX_BODY) { log("too_large"); return json(413, { error: "too_large" }, okOrigin); }
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { log("bad_json"); return json(400, { error: "invalid" }, okOrigin); }
  if (!body || typeof body !== "object") return json(400, { error: "invalid" }, okOrigin);

  // Honeypot: bots krijgen een neutraal "ok" en er wordt niets opgeslagen of geverifieerd.
  if (typeof body.website === "string" && body.website.trim() !== "") { log("honeypot"); return json(200, { ok: true }, okOrigin); }

  const fields = validate(body);
  if (!fields) { log("invalid"); return json(400, { error: "invalid" }, okOrigin); }

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!token || token.length > 2048) { log("captcha_missing"); return json(403, { error: "captcha" }, okOrigin); }
  let human = false;
  try { human = await verifyTurnstile(deps, token, TURNSTILE_SECRET_KEY); } catch { human = false; }
  if (!human) { log("captcha_failed"); return json(403, { error: "captcha" }, okOrigin); }

  let outcome: Awaited<ReturnType<typeof callRpc>>;
  try { outcome = await callRpc(deps, fields); } catch { outcome = "error"; }
  log(`rpc_${outcome}`);
  if (outcome === "ok") return json(200, { ok: true }, okOrigin);
  if (outcome === "limited") return json(429, { error: "limited" }, okOrigin);
  if (outcome === "invalid") return json(400, { error: "invalid" }, okOrigin);
  return json(502, { error: "unavailable" }, okOrigin);
}
