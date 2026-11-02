# Clarity Control V2 — private first listen (#468)

**Status: implementation draft only, OFF. No audio is uploaded, deployed, enabled or linked.**

## What is known and still missing

- Hans chose the SoundCloud upload whose path ends in `-7` as **Clarity Control V2**. This confirms the *song/upload choice*, **not** the identity of any archived WAV.
- Drive candidates around **3:13** and **3:02** remain unverified. Never silently use the 3:13 trial master, another variant, or **Fire In My Bones**.
- Only **explicitly invited Supabase Auth website accounts** may listen. Sign-in by itself confers no preview rights. There is no inferred SoundCloud follower membership.
- Hans has provided **no further audio material, verified source SHA-256, approved excerpt, list of invited accounts, or final activation approval**. Do not activate yet.

## Source and audio verification (must happen before any upload)

1. Obtain authorized access to the SoundCloud `-7` upload's stable track ID and one or both candidate WAVs, with reliable provenance. Do not publish the secret SoundCloud URL or Drive IDs.
2. Compare **listening + waveform/fingerprint** (and, if appropriate, duration) against that actual upload. A WAV SHA-256 is a file identity, **not** proof that it acoustically matches the lossy SoundCloud stream. Document the evidence and resolve which, if either, is V2; ask Hans to confirm.
3. Record the exact verified WAV's SHA-256 *privately* as the approved source checksum. Do not put the WAV or a URL to it in GitHub, a public bucket, the site bundle or a deployment artifact.
4. Export **only an independently approved 20–30-second MP3** from that WAV. Hans must approve the segment boundaries and listening quality. Verify actual duration with an audio probe (e.g. ffprobe), MIME, bytes (<=3,000,000) and SHA-256. Preserve the checksum as immutable identity.
5. Ask for the **specific invited website accounts** (Supabase Auth user UUIDs) and Hans's **separate explicit go-live approval**. No regular public release is implied.

## Design and security invariants

- Existing `useAuth`/Supabase Auth signs in website users. Only the Edge Function `neon-studio-preview` can authorize audio.
- Public browser sends `POST { "track": "clarity-control-v2" }` with its **current Supabase bearer token** to the function; never a storage path, private link, Drive ID, master filename or service key.
- The function verifies Auth with Supabase, then checks the per-user/per-track invitation **on every request**, including revocation and expiration.
- The Edge server checks independent kill switch `NEON_CLARITY_V2_ENABLED`, approved metadata, verified source SHA-256, approved MP3 SHA-256, immutable MP3 path, declared <=30s and <=3MB, and rehashes the downloaded bytes.
- A **new dedicated private bucket** `neon-first-listen` stores only the short MP3. The migration limits uploads to 3MB and `audio/mpeg`. No public or authenticated read grants are introduced. Existing **all** `storage.objects` SELECT policies MUST be audited for broader permissions before creating or using the bucket: `buckets.public=false` alone does not guarantee access denial if an RLS policy grants access. Verify direct Storage REST access as anon and arbitrary authenticated accounts is denied.
- Preview metadata and invitations live in RLS-enabled tables with no `anon`/`authenticated` policies or grants; server service-role access only after token verification. No seed rows.
- Function returns **MP3 bytes only**, not a reusable signed/public URL. Headers use `private, no-store`. Frontend holds the bytes in a short-lived Blob URL, revoked on logout/account switch/unmount.
- The player `controlsList=nodownload` is only interface behavior. An authorized recipient can still copy/record delivered audio; **there is no DRM**. That is why only a personally approved short excerpt is ever delivered, not the full master.
- The original NEON card, release catalog, SEO, metadata and public song entries are unaffected while the UI gate is OFF.

## Deployment sequence (not performed in this PR)

1. Review branch CI, access architecture, audio provenance, storage read policies and ownership/consent.
2. Once WAV identity and the fragment are approved, review/apply the SQL migration. **Do not auto-apply this draft migration before storage-policy audit.**
3. Verify bucket privacy using direct requests: `anon` and ordinary authenticated tokens must not be able to list/download any object, even when its exact object key is known.
4. Upload **only** the approved MP3 to `neon-first-listen/previews/clarity-control-v2/<preview-sha256>.mp3` using an administrator. Confirm filename/content checksum. Never upload the WAV/master.
5. Insert one approved source/asset row with opaque SoundCloud track ID, two verified SHA-256 values, actual size/duration and reviewer/timestamps, **then** invite only Hans's chosen Supabase user UUIDs. Use an audited admin workflow, not public SQL/client code. Keep these private; don't paste hashes, IDs, private URLs or tokens into a PR.
6. Deploy the Edge Function; configure only server-side secrets `NEON_CLARITY_V2_APPROVED_SOURCE_SHA256` and `NEON_CLARITY_V2_APPROVED_PREVIEW_SHA256`; leave `NEON_CLARITY_V2_ENABLED` **unset/false** during staging verification. Use `NEON_PREVIEW_ALLOWED_ORIGINS` only for specifically tested Vercel preview origins. Never prefix these server secrets with `VITE_`.
7. Run live integration tests with isolated test accounts: missing/invalid JWT = **401**; ordinary signed-in account, revoked invite and expired invite = **403**; disabled/missing/mismatched assets = **404**; wrong track body = **400**; invited user when approved and enabled = **200**, `audio/mpeg`, no-store, bytes exactly the approved <=30s MP3. Check CORS, leaked URLs, server logs, browser accessibility, mobile/keyboard, account switch, and direct bucket denial. This final 200 test is impossible before verified audio is provided.
8. Only after Hans's **distinct release approval** and successful staging/security review, set `NEON_CLARITY_V2_ENABLED=true` in server secrets, deploy the frontend with `VITE_NEON_CLARITY_V2_PREVIEW_READY=true`, smoke-test production, monitor. **Never** enable as a public music release or automatically merge this draft PR.

## Emergency rollback

Unset/set `NEON_CLARITY_V2_ENABLED=false` in the Edge deployment environment; stop any new fetch. Revoke invite rows as needed and switch the frontend `VITE_NEON_CLARITY_V2_PREVIEW_READY` back to false. Previously downloaded bytes cannot be retracted from a listener's device, so keep the excerpt short.

## Tests included in this draft

- Node policy unit tests: anonymous, invited, unrelated account, revoked/expired invitation, missing activation, mismatched fingerprints, path substitution, master/overlong/oversized audio and downloaded SHA-256.
- React/Vitest card tests: release flag OFF (unchanged placeholder), anonymous sign-in gate, denied signed-in account (no player), no secret/static audio src.
- GitHub Actions CI runs policy tests, lint, TypeScript check, Vitest and personal-site build **on draft PRs**.

Issue: https://github.com/jowikroon/hans-crafted-stories/issues/468
