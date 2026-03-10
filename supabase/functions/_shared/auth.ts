/**
 * Shared auth guard for Supabase Edge Functions.
 *
 * Validates one of:
 *   1. Supabase JWT via Authorization header  (browser sessions)
 *   2. x-commander-token header matching COMMANDER_TOKEN env  (CLI / headless)
 *   3. apikey header matching SUPABASE_ANON_KEY env  (Supabase client SDK)
 *
 * Usage:
 *   const auth = await validateRequest(req);
 *   if (auth.error) return auth.error;  // pre-built 401 Response
 *   // auth.userId is available
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  userId: string | null;
  error: Response | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-commander-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function deny(message: string, status = 401): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export async function validateRequest(req: Request): Promise<AuthResult> {
  // ── 1. Commander token (headless / CLI) ──────────────────────
  const commanderToken = req.headers.get("x-commander-token");
  const expectedToken = Deno.env.get("COMMANDER_TOKEN");

  if (commanderToken && expectedToken && commanderToken === expectedToken) {
    return { userId: "commander", error: null };
  }

  // ── 2. Supabase JWT ──────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (jwt && jwt.length > 20) {
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
      if (!error && user) {
        return { userId: user.id, error: null };
      }
    } catch (e) {
      console.warn("[auth] JWT validation error:", e);
    }
  }

  // ── 3. Supabase anon key in apikey header (read-only endpoints) ──
  const apikey = req.headers.get("apikey");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (apikey && anonKey && apikey === anonKey) {
    return { userId: "anon", error: null };
  }

  return { userId: null, error: deny("Unauthorized — valid session, apikey, or commander token required") };
}

/**
 * Lightweight check — allows anon key callers (for public-facing endpoints
 * like connector-status). Rejects only completely unauthenticated requests.
 */
export async function validateRequestLight(req: Request): Promise<AuthResult> {
  // Accept any of the three auth methods
  return validateRequest(req);
}
