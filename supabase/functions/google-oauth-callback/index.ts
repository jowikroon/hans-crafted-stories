/**
 * google-oauth-callback — Handles Google OAuth callback: exchanges code for tokens, stores in user_google_tokens.
 * Redirect URI in Google Console must match: https://<project>.supabase.co/functions/v1/google-oauth-callback
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ORIGIN = Deno.env.get("APP_ORIGIN") || "https://hansvanleeuwen.com";

async function verifyState(state: string, secret: string): Promise<{ userId: string; returnTo: string } | null> {
  const [payloadB64, sigB64] = state.split(".");
  if (!payloadB64 || !sigB64) return null;
  const payload = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (sigB64 !== expectedB64) return null;
  const data = JSON.parse(payload);
  if (data.exp && Date.now() > data.exp) return null;
  const returnTo = data.returnTo ? String(data.returnTo).replace(/\/$/, "") : DEFAULT_ORIGIN;
  const dest = returnTo.includes("/portal") ? returnTo : `${returnTo}/portal`;
  return { userId: data.userId, returnTo: dest };
}

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const stateSecret = Deno.env.get("GOOGLE_OAUTH_STATE_SECRET") || clientSecret || "";
  const fallbackDest = `${DEFAULT_ORIGIN}/portal`;

  if (error) {
    return Response.redirect(`${fallbackDest}?google_oauth_error=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${fallbackDest}?google_oauth_error=missing_params`, 302);
  }

  if (!clientId || !clientSecret) {
    return Response.redirect(`${fallbackDest}?google_oauth_error=not_configured`, 302);
  }

  const verified = await verifyState(state, stateSecret);
  if (!verified) {
    return Response.redirect(`${fallbackDest}?google_oauth_error=invalid_state`, 302);
  }
  const { userId, returnTo } = verified;

  const baseUrl = Deno.env.get("SUPABASE_URL") || "";
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/functions/v1/google-oauth-callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("Google token exchange failed:", tokenRes.status, errText);
    return Response.redirect(`${returnTo}?google_oauth_error=token_exchange_failed`, 302);
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
  const scopes = Array.isArray(tokens.scope) ? tokens.scope : (tokens.scope ? tokens.scope.split(" ") : []);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: upsertError } = await supabaseAdmin
    .from("user_google_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scopes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    console.error("user_google_tokens upsert failed:", upsertError);
    return Response.redirect(`${returnTo}?google_oauth_error=storage_failed`, 302);
  }

  const dest = `${returnTo}?google_connected=1`;
  return Response.redirect(dest, 302);
});
