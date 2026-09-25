# Private Music CMS artwork library

Open `/music-cms?mode=artwork` as the existing site administrator. The Beeldbank rail entry opens the same view.

The gallery filters by image category, album, song, intended channel, source collection/version and current/archive selection. The default view groups versions by design; “Alle bestanden” exposes every export. A keyboard-accessible dialog displays the preview, original dimensions, format, download, related versions and every source occurrence. Channel labels describe the intended use of existing assets; they do not certify platform compliance. “Huidige collectie” records the current-folder/latest photographic collection provenance, not release approval.

## Storage and access

- `public.music_artwork_assets`: one row per original SHA-256, with a `family_key` connecting related designs, exports and studies. `origins` retains collection, relative file and edition. No private lyrics, biographies, credentials or absolute workstation paths are stored here.
- Private `music-artwork` bucket: immutable `originals/<sha>.<ext>` and separate `thumbnails/<sha>.webp`. Originals retain their original bytes and dimensions.
- RLS uses the existing `public.is_admin()` check. Authenticated non-admins cannot read artwork metadata or objects; anonymous users have no metadata grants. Imports run server-side using the existing backend credential. The browser only uses its existing user session and short-lived signed URLs.
- Metadata is paginated past PostgREST's row cap. Only the visible page's previews are signed. Previews refresh before expiry; original download URLs last 60 seconds. No public storage URLs are used.

## Initial import, 25 September 2026

571 distinct images, 1,580 original source occurrences, 25 source collections, 571 previews. Sources: the JOWIKROON output packs, the NEON `_ARTWORK` archive and the artist's explicit-cover concept folder. Binary duplicates share a stored file without dropping their origins. Includes earlier concepts, current covers, social images, profiles, banners, clean plates, vectors, presentation boards and story artwork.

Internal document/analysis renders, software dependencies, temporary working directories and verification screenshots were excluded. Local audit, import scripts, SHA manifest and exclusion log are retained outside this repository in `C:/AI/output/jowikroon-music-backend-import-2026-09-25`. No artwork binaries or local credentials are committed to the repository.

Validation: all original and preview objects exist, all original sizes match the manifest, and live database role checks allow the admin to read 571 assets while a non-admin sees zero metadata and zero storage objects. Frontend tests cover combined filters, version grouping, pagination beyond 500 entries and the admin gate. The migration filename matches the already-applied remote migration version.
