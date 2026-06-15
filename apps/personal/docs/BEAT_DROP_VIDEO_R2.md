# Beat Drop video — self-hosted via Cloudflare R2

The Beat Drop song page (`/music/beat-drop`) plays a self-hosted `<video>` from
`/media/final_neon_beat_drop.mp4`, streamed out of R2 by the Pages Function
`functions/media/[[path]].js` (with HTTP range support for seeking). If the file
isn't present or the binding isn't set, the page falls back to the
"Watch on YouTube" link automatically.

## One-time setup (Cloudflare dashboard)

1. **Upload the video to R2**
   - Cloudflare dashboard -> R2 -> bucket `hansvanleeuwen`.
   - Upload the video with the exact key `final_neon_beat_drop.mp4`.
   - Recommended: compress first to ~30-50 MB (720x1280 H.264, +faststart). The
     raw clip is ~192 MB at 9.7 Mbps, which is overkill for the resolution.

2. **Bind the bucket to the Pages project**
   - Dashboard -> Workers & Pages -> `hansvanleeuwen` (Pages) -> Settings ->
     Functions -> R2 bucket bindings -> Add binding.
   - Variable name: `MEDIA`  ->  Bucket: `hansvanleeuwen`.
   - Save, then redeploy (or it applies on the next deploy).

`/media/final_neon_beat_drop.mp4` then streams from R2 and the player appears.

## Notes
- The Function caches for a year (immutable) and supports range requests, so
  seeking works and bandwidth is low after first load.
- For more media later, upload another key and reference `/media/<key>`.
