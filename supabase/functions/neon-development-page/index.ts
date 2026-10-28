import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const MAX_BYTES = 12 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Log opnieuw in." }, 401);
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await caller.auth.getUser();
  if (userError || !user) return json({ error: "Log opnieuw in." }, 401);
  const { data: admin, error: roleError } = await caller.rpc("is_admin");
  if (roleError || admin !== true) return json({ error: "Alleen beschikbaar voor het admin-account." }, 403);
  const body = await req.json().catch(() => null);
  if (!body || typeof body.pageId !== "string" || !/^[a-f0-9]{64}$/.test(body.pageId)) return json({ error: "Ongeldige pagina." }, 400);
  // RLS and catalogue lookup prevent arbitrary Drive-file access through this endpoint.
  const { data: page, error: pageError } = await caller.from("music_development_pages").select("hosted_url").eq("id", body.pageId).single();
  if (pageError || !page) return json({ error: "Pagina niet gevonden." }, 404);
  const match = /^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\/view(?:\?.*)?$/.exec(page.hosted_url ?? "");
  if (!match) return json({ error: "Deze pagina is nog niet aan Drive gekoppeld." }, 409);
  try {
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: row } = await service.from("user_google_tokens").select("access_token,refresh_token,expires_at").eq("user_id", user.id).maybeSingle();
    if (!row) return json({ error: "Koppel je Google-account via het Command Center om privépagina’s te bekijken. De Drive-knoppen blijven beschikbaar." }, 409);
    let token = row.access_token;
    if (new Date(row.expires_at).getTime() < Date.now() + 60_000) {
      const refresh = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "", client_secret: Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "", refresh_token: row.refresh_token, grant_type: "refresh_token" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!refresh.ok) return json({ error: "Je Google-koppeling moet opnieuw worden verbonden via het Command Center. Je kunt het bestand wel rechtstreeks in Drive openen." }, 409);
      const renewed = await refresh.json(); token = renewed.access_token;
      if (!token) throw new Error("refresh");
      await service.from("user_google_tokens").update({ access_token: token, expires_at: new Date(Date.now() + (renewed.expires_in || 3600) * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("user_id", user.id);
    }
    const url = `https://www.googleapis.com/drive/v3/files/${match[1]}`;
    const auth = { Authorization: `Bearer ${token}` };
    const metadata = await fetch(`${url}?fields=mimeType,size,trashed&supportsAllDrives=true`, { headers: auth, signal: AbortSignal.timeout(15000) });
    if (!metadata.ok) return json({ error: "Dit Drive-bestand is niet bereikbaar met je gekoppelde Google-account." }, 409);
    const file = await metadata.json();
    if (file.trashed || !["text/html", "application/xhtml+xml"].includes(file.mimeType)) return json({ error: "Het gekoppelde bestand is geen beschikbare HTML-pagina." }, 422);
    if (Number(file.size) > MAX_BYTES) return json({ error: "Deze pagina is te groot voor de online lezer. Download het origineel vanuit Drive." }, 413);
    const result = await fetch(`${url}?alt=media&supportsAllDrives=true`, { headers: auth, signal: AbortSignal.timeout(20000) });
    if (!result.ok || !result.body) throw new Error("download");
    const reader = result.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return json({ error: "Deze pagina is te groot voor de online lezer." }, 413); }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return json({ html: new TextDecoder().decode(bytes) });
  } catch {
    // Never return provider errors, tokens or private Google response bodies.
    return json({ error: "De Drive-pagina kon niet worden geladen. Probeer opnieuw of open het origineel in Drive." }, 502);
  }
});
