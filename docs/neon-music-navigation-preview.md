# Private NEON workspace — release candidate, 24 October 2026

Signed-in owners get a Muziekproductie submenu with Beeldbank, NEON and Songwriter. NEON (`/music-cms?mode=neon`) combines a private development catalogue, the existing R2-backed artwork library initially filtered to NEON, and project source links. Desktop hover/click, keyboard focus, Escape, outside clicks and mobile disclosure are supported. The existing Obsidian profile entry is retained.

The catalogue searches category/status, sorts by date/title and groups only byte-identical copies using source hashes. All versions and copy paths remain available. Clipboard denial has a manual copy fallback. The HTML/media stay on the owner's PC; optional online links require HTTPS. These local files are not uploaded or automatically accessible from another device.

## Source roles

The local SecondBrainVault is the knowledge source. GitHub is its private backup, Drive Shadow is a selected reading copy, and the Drive album folder contains media/work files. Links do not synchronize content or prove freshness. This feature does not change release decisions, album sequence or asset approval.

## Privacy and storage

This repository is public. Migration `20261026011043_neon_development_library.sql` contains schema and access rules only. Its version matches the production migration applied through the management API on 26 October. The 84-entry private catalogue seed is a separate local deployment artifact. Never commit it, bundle it in the application or add it to the public webroot. Preview fixtures remain ignored and excluded from normal builds.

The new table has RLS, read access only for authenticated admins through `public.is_admin()`, no anonymous read and no browser write grants. Artwork is unchanged from current main: metadata in Supabase; binaries in private R2 through `artwork-sign`. This change does not restore the old Supabase Storage workflow.

## Deployment order

1. Review schema and private seed together. Verify the production project and `is_admin()` function. The 24 October read-only check found no development table or old migration version, and 1,718 artwork assets with RLS enabled.
2. Apply only the reviewed schema migration, then the private seed through the privileged deployment channel. Its `ON CONFLICT (id) DO NOTHING` preserves existing entries.
3. Confirm row count, admin read, non-admin/anonymous rejection and browser-write rejection. Isolated database tests do not replace production checks.
4. Deploy the reviewed UI commit. Verify the signed-in menu, all three destinations, copy fallback, filters, R2 thumbnails/playback/download and responsive layout.
5. To roll back the UI, restore the previous UI deployment and leave the additive private catalogue intact. Never drop or overwrite song/artwork tables.

Music CMS and the standalone local preview use the site's Switzer / JetBrains Mono pair. The earlier local preview-server start was blocked by automatic policy review; no server retry or bypass was attempted during this preparation. The candidate is not a production deployment. Final browser visual verification and signed-in production checks remain deployment gates.

