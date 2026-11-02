/**
 * Clarity Control V2: private invite-only short first listen.
 * Cannot serve any audio until source WAV, MP3 hash, invitation, explicit
 * release flag and storage-policy audit have been independently approved.
 *
 * Server-only Edge secrets (never VITE_ or GitHub):
 * NEON_CLARITY_V2_ENABLED=true
 * NEON_CLARITY_V2_APPROVED_SOURCE_SHA256=<verified WAV SHA-256>
 * NEON_CLARITY_V2_APPROVED_PREVIEW_SHA256=<approved short MP3 SHA-256>
 */
import { createClient } from "npm:@supabase/supabase-js@2.108.0";
import {
  TRACK_SLUG, PRIVATE_BUCKET, MAX_PREVIEW_BYTES,
  accessDecision, matchesPreviewContent,
} from "./policy.mjs";

const defaultOrigins = ["https://hansvanleeuwen.com", "https://www.hansvanleeuwen.com"];
const customOrigins = (Deno.env.get("NEON_PREVIEW_ALLOWED_ORIGINS") ?? "")
  .split(",").map((x) => x.trim()).filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...customOrigins]);

function headersFor(req: Request, type = "application/json"): Headers {
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "private, no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  const origin = req.headers.get("Origin");
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
  }
  return headers;
}

const errorResponse = (req: Request, code: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status: code, headers: headersFor(req) });

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) return errorResponse(req, 403, "Access denied");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
  if (req.method !== "POST") return errorResponse(req, 405, "Method not allowed");

  const authorization = req.headers.get("Authorization");
  if (!authorization || !/^Bearer [^\s]+$/.test(authorization)) {
    return errorResponse(req, 401, "Sign in required");
  }
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return errorResponse(req, 503, "Preview unavailable");

  try {
    // Validate the bearer token against Supabase Auth, not browser-supplied user IDs.
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return errorResponse(req, 401, "Sign in required");

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" ||
        (body as { track?: unknown }).track !== TRACK_SLUG) {
      return errorResponse(req, 400, "Invalid preview request");
    }

    // Only the Edge Function may use the service role, AFTER valid authentication.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return errorResponse(req, 503, "Preview unavailable");
    const service = createClient(url, serviceKey, { auth: { persistSession: false } });

    const [invitation, candidate] = await Promise.all([
      service.from("neon_studio_preview_invites")
        .select("preview_slug,user_id,expires_at,revoked_at")
        .eq("preview_slug", TRACK_SLUG).eq("user_id", user.id).maybeSingle(),
      service.from("neon_studio_previews")
        .select("slug,status,source_sha256,preview_sha256,object_key,size_bytes,duration_seconds,approved_by,approved_at")
        .eq("slug", TRACK_SLUG).maybeSingle(),
    ]);
    if (invitation.error || candidate.error) return errorResponse(req, 503, "Preview unavailable");
    const sourceHash = Deno.env.get("NEON_CLARITY_V2_APPROVED_SOURCE_SHA256") ?? "";
    const previewHash = Deno.env.get("NEON_CLARITY_V2_APPROVED_PREVIEW_SHA256") ?? "";
    const status = accessDecision({
      userId: user.id,
      invite: invitation.data,
      asset: candidate.data,
      enabled: Deno.env.get("NEON_CLARITY_V2_ENABLED") === "true",
      expectedSourceSha256: sourceHash,
      expectedPreviewSha256: previewHash,
    });
    if (status === 403) return errorResponse(req, 403, "This first listen is by invitation");
    if (status !== 200) return errorResponse(req, 404, "First listen not available");

    // Never trust a client path or return a signed URL/full master.
    const asset = candidate.data!;
    const { data: mp3, error: storageError } = await service.storage.from(PRIVATE_BUCKET)
      .download(asset.object_key);
    if (storageError || !mp3 || mp3.size <= 0 || mp3.size > MAX_PREVIEW_BYTES) {
      return errorResponse(req, 404, "First listen not available");
    }

    // Verify the actual bytes independently of the database metadata.
    const buffer = await mp3.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const actualHash = [...new Uint8Array(hashBuffer)]
      .map((x) => x.toString(16).padStart(2, "0")).join("");
    if (!matchesPreviewContent(buffer.byteLength, actualHash, asset, previewHash)) {
      return errorResponse(req, 404, "First listen not available");
    }
    const headers = headersFor(req, "audio/mpeg");
    headers.set("Content-Length", String(buffer.byteLength));
    headers.set("Content-Disposition", "inline");
    headers.set("Accept-Ranges", "none");
    return new Response(buffer, { status: 200, headers });
  } catch {
    return errorResponse(req, 503, "Preview unavailable");
  }
});
