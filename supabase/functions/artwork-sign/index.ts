/**
 * artwork-sign: short-lived signed GET URLs for the private Beeldbank archive.
 *
 * The music-artwork binaries live in the private Cloudflare R2 bucket
 * "music-artwork" (moved from Supabase Storage on 2026-10-23 to stay inside the
 * free storage quota). Object keys are unchanged: originals/, thumbnails/, videos/.
 *
 * Access rule is identical to the old storage RLS: only callers for whom
 * public.is_admin() returns true get URLs. The browser never sees R2 keys.
 *
 * Request:  POST { paths: string[], expires?: number, download?: string }
 * Response: { urls: { path: string, signedUrl: string }[] }
 */
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const BUCKET = "music-artwork";
const KEY_RE = /^(originals|thumbnails|videos)\/[A-Za-z0-9._\-\/]+$/;
const MAX_PATHS = 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const r2 = new AwsClient({
  accessKeyId: Deno.env.get("ARTWORK_R2_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("ARTWORK_R2_SECRET_ACCESS_KEY")!,
  service: "s3",
  region: "auto",
});
const endpoint = (Deno.env.get("ARTWORK_R2_ENDPOINT") ?? "").replace(/\/+$/, "");

async function sign(path: string, expires: number, download?: string): Promise<string> {
  const key = path.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`${endpoint}/${BUCKET}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(expires));
  if (download) {
    const safe = download.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 150);
    url.searchParams.set("response-content-disposition", `attachment; filename="${safe}"`);
  }
  const signed = await r2.sign(new Request(url, { method: "GET" }), { aws: { signQuery: true } });
  return signed.url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization) return json({ error: "Niet ingelogd" }, 401);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: admin, error: adminError } = await sb.rpc("is_admin");
  if (adminError) return json({ error: "Toegang kon niet worden gecontroleerd" }, 500);
  if (admin !== true) return json({ error: "Alleen voor het admin-account" }, 403);

  let body: { paths?: unknown; expires?: unknown; download?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Ongeldige JSON" }, 400); }
  const paths = body.paths;
  if (!Array.isArray(paths) || !paths.length || paths.length > MAX_PATHS) return json({ error: "paths ongeldig" }, 400);
  if (!paths.every((p) => typeof p === "string" && KEY_RE.test(p) && !p.includes(".."))) return json({ error: "pad ongeldig" }, 400);
  const expires = Math.min(3600, Math.max(30, Number(body.expires) || 900));
  const download = typeof body.download === "string" && body.download ? body.download : undefined;
  if (download && paths.length !== 1) return json({ error: "download alleen voor een pad" }, 400);

  const urls = await Promise.all((paths as string[]).map(async (path) => ({ path, signedUrl: await sign(path, expires, download) })));
  return json({ urls });
});
