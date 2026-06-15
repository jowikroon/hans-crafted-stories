// Serves blog/OG media from R2 (binding: BLOG_MEDIA, bucket hvl-blog-media) under /media/*.
// Until the R2 binding exists this returns 404 and touches no existing route. Once bound,
// objects uploaded to the bucket are served with a long immutable cache at the edge.
//
// Example: /media/hero/new-level.jpg -> R2 key "hero/new-level.jpg"

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  // Binding absent (not yet wired) -> behave as if the route doesn't exist.
  if (!env || !env.BLOG_MEDIA) {
    return new Response("Not found", { status: 404 });
  }

  const parts = Array.isArray(params && params.path) ? params.path : [];
  const key = parts.join("/");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.BLOG_MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!headers.get("content-type")) headers.set("Content-Type", "application/octet-stream");

  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
