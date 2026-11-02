/**
 * Clarity V2 per-request authorization. Shared by Edge Function and Node tests.
 * Only an explicitly approved, checksum-named short MP3 can pass.
 */
export const TRACK_SLUG = "clarity-control-v2";
export const PRIVATE_BUCKET = "neon-first-listen";
export const MAX_PREVIEW_BYTES = 3_000_000;
export const MAX_PREVIEW_SECONDS = 30;
const SHA256 = /^[a-f0-9]{64}$/;

export function accessDecision(
  { userId, invite, asset, enabled, expectedSourceSha256, expectedPreviewSha256 },
  now = Date.now(),
) {
  if (!userId) return 401;
  if (!invite || invite.user_id !== userId ||
      invite.preview_slug !== TRACK_SLUG || invite.revoked_at != null) return 403;
  if (invite.expires_at != null) {
    const expiry = Date.parse(invite.expires_at);
    if (!Number.isFinite(expiry) || expiry <= now) return 403;
  }

  // Neither a public UI flag nor an authenticated Supabase session opens audio.
  if (!enabled || !SHA256.test(expectedSourceSha256 ?? "") ||
      !SHA256.test(expectedPreviewSha256 ?? "")) return 404;
  if (!asset || asset.slug !== TRACK_SLUG || asset.status !== "approved" ||
      !asset.approved_by || !asset.approved_at ||
      !Number.isFinite(Date.parse(asset.approved_at)) ||
      asset.source_sha256 !== expectedSourceSha256 ||
      asset.preview_sha256 !== expectedPreviewSha256) return 404;

  // No full WAV, arbitrary client path, URL, master or oversized export.
  const expectedKey = "previews/" + TRACK_SLUG + "/" + expectedPreviewSha256 + ".mp3";
  if (asset.object_key !== expectedKey ||
      !Number.isSafeInteger(asset.size_bytes) ||
      asset.size_bytes <= 0 || asset.size_bytes > MAX_PREVIEW_BYTES ||
      typeof asset.duration_seconds !== "number" ||
      !Number.isFinite(asset.duration_seconds) ||
      asset.duration_seconds <= 0 || asset.duration_seconds > MAX_PREVIEW_SECONDS) return 404;

  return 200;
}

export function matchesPreviewContent(fileSize, actualSha256, asset, expectedPreviewSha256) {
  return Boolean(Number.isSafeInteger(fileSize) &&
    fileSize > 0 && fileSize <= MAX_PREVIEW_BYTES &&
    fileSize === asset?.size_bytes &&
    SHA256.test(actualSha256 ?? "") &&
    actualSha256 === expectedPreviewSha256 &&
    actualSha256 === asset?.preview_sha256);
}
