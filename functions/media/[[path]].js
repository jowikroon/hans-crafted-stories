/**
 * Streams media files from the R2 bucket bound as `MEDIA`.
 *
 * Serves /media/<key> from R2 with HTTP range support (so the browser can
 * seek in the <video> element) and long-lived caching. The R2 binding must be
 * configured in the Cloudflare Pages dashboard (Settings → Functions → R2
 * bindings) with variable name MEDIA pointing at the bucket that holds the
 * media (e.g. the "hansvanleeuwen" bucket, key "beat-drop.mp4").
 */
export async function onRequestGet(context) {
  const { request, env, params } = context;

  if (!env.MEDIA) {
    return new Response("Media storage not configured", { status: 503 });
  }

  // params.path is an array of the path segments after /media/
  const key = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  if (!key) return new Response("Not found", { status: 404 });

  const range = request.headers.get("range");

  // Parse a single "bytes=start-end" range if present.
  let r2opts = {};
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : undefined;
      const end = m[2] ? parseInt(m[2], 10) : undefined;
      if (start !== undefined && end !== undefined) {
        r2opts = { range: { offset: start, length: end - start + 1 } };
      } else if (start !== undefined) {
        r2opts = { range: { offset: start } };
      } else if (end !== undefined) {
        r2opts = { range: { suffix: end } };
      }
    }
  }

  const object = await env.MEDIA.get(key, r2opts);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("accept-ranges", "bytes");
  if (!headers.has("content-type")) headers.set("content-type", "video/mp4");

  // If a range was requested and satisfied, return 206 with Content-Range.
  if (range && object.range) {
    const total = object.size;
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? (total - offset);
    const end = offset + length - 1;
    headers.set("content-range", `bytes ${offset}-${end}/${total}`);
    headers.set("content-length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { status: 200, headers });
}
