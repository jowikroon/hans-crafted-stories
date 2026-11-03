import test from "node:test";
import assert from "node:assert/strict";
import {
  TRACK_SLUG, PRIVATE_BUCKET, MAX_PREVIEW_BYTES, MAX_PREVIEW_SECONDS,
  accessDecision, matchesPreviewContent,
} from "../../../supabase/functions/neon-studio-preview/policy.mjs";

const uid = "79f1d6f0-4ccf-4d41-84c5-d2a64716c0f4";
const sourceHash = "a".repeat(64);
const previewHash = "b".repeat(64);
const now = Date.parse("2026-11-02T10:00:00Z");
const invite = { user_id: uid, preview_slug: TRACK_SLUG,
  revoked_at: null, expires_at: "2026-12-01T00:00:00Z" };
const asset = { slug: TRACK_SLUG, status: "approved", source_sha256: sourceHash,
  preview_sha256: previewHash, object_key: "previews/clarity-control-v2/" + previewHash + ".mp3",
  size_bytes: 980_000, duration_seconds: 25, approved_by: uid,
  approved_at: "2026-11-02T09:00:00Z" };
const valid = { userId: uid, invite, asset, enabled: true,
  expectedSourceSha256: sourceHash, expectedPreviewSha256: previewHash };
const decide = (changes = {}) => accessDecision({ ...valid, ...changes }, now);

test("private bucket identifier is dedicated, not a public release bucket", () => {
  assert.equal(PRIVATE_BUCKET, "neon-first-listen");
});
test("login alone is insufficient: explicit invitation for this account and track", () => {
  assert.equal(decide(), 200);
  assert.equal(decide({ userId: null }), 401);
  assert.equal(decide({ invite: null }), 403);
  assert.equal(decide({ userId: "another-user" }), 403);
  assert.equal(decide({ invite: { ...invite, preview_slug: "other-track" } }), 403);
});
test("revocation and expiry deny access on every new request", () => {
  assert.equal(decide({ invite: { ...invite, revoked_at: "2026-11-02T08:00:00Z" } }), 403);
  assert.equal(decide({ invite: { ...invite, expires_at: "2026-11-02T09:59:59Z" } }), 403);
  assert.equal(decide({ invite: { ...invite, expires_at: "not-a-date" } }), 403);
  assert.equal(decide({ invite: { ...invite, expires_at: null } }), 200);
});
test("kill switch and absent independent approvals shut everything down", () => {
  assert.equal(decide({ enabled: false }), 404);
  assert.equal(decide({ asset: null }), 404);
  assert.equal(decide({ expectedSourceSha256: "" }), 404);
  assert.equal(decide({ expectedPreviewSha256: "" }), 404);
  assert.equal(decide({ asset: { ...asset, status: "disabled" } }), 404);
  assert.equal(decide({ asset: { ...asset, approved_by: null } }), 404);
  assert.equal(decide({ asset: { ...asset, approved_at: null } }), 404);
});
test("mismatched WAV identity and preview fingerprints are rejected", () => {
  assert.equal(decide({ expectedSourceSha256: "c".repeat(64) }), 404);
  assert.equal(decide({ expectedPreviewSha256: "c".repeat(64) }), 404);
  assert.equal(decide({ asset: { ...asset, source_sha256: "d".repeat(64) } }), 404);
  assert.equal(decide({ asset: { ...asset, preview_sha256: "d".repeat(64) } }), 404);
});
test("full masters, path substitution and excessive audio never pass", () => {
  assert.equal(decide({ asset: { ...asset, object_key: "masters/clarity-v2.wav" } }), 404);
  assert.equal(decide({ asset: { ...asset, object_key: "../secret.mp3" } }), 404);
  assert.equal(decide({ asset: { ...asset, size_bytes: MAX_PREVIEW_BYTES + 1 } }), 404);
  assert.equal(decide({ asset: { ...asset, duration_seconds: MAX_PREVIEW_SECONDS + 1 } }), 404);
  assert.equal(decide({ asset: { ...asset, duration_seconds: "25" } }), 404);
});
test("stored bytes must equal both metadata and server-held checksum", () => {
  assert.equal(matchesPreviewContent(asset.size_bytes, previewHash, asset, previewHash), true);
  assert.equal(matchesPreviewContent(asset.size_bytes + 1, previewHash, asset, previewHash), false);
  assert.equal(matchesPreviewContent(asset.size_bytes, "c".repeat(64), asset, previewHash), false);
  assert.equal(matchesPreviewContent(MAX_PREVIEW_BYTES + 1, previewHash, asset, previewHash), false);
});
