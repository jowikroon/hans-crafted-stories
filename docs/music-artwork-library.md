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

## Classification audit, 26 September 2026

The initial importer let descriptive backup-folder names contaminate each asset's labels. Classification now uses original pack-relative asset paths and explicit filenames. `scripts/artwork_classification.py` is a pure, repeatable metadata correction; its regression tests are in `scripts/test_artwork_classification.py`. It does not change original bytes, origins, current/archive provenance or storage access.

- **Profile** includes avatars, artist portrait masters and profile headers. **Banner** additionally identifies the wide header images. Posts copied into a folder called `profile and banner` do not inherit either label. Flow identity/body reference photographs belong to **Studio**.
- **Album** identifies actual front/back sleeves, including NEON Beats filenames. A shared album sleeve copied into song folders does not become a cover for the first song encountered.
- **Song** uses filename aliases or an unambiguous song-specific source folder; unknown candidate concepts remain in Studio rather than acquiring an invented title.
- **Social** includes campaign exports and story/comic pages. **Brand element** identifies the actual pulse, signal, wordmark and type elements, not every cover in an emotion-pulse collection. **Studio** contains research, references, contact sheets, presentation boards and unassigned studies.
- Channel labels normally come from explicit filenames. On this audit, the existing shared profile export is also assigned to Instagram, as requested. The existing vertical Story/Status, portrait-story, monthly-series-story and wake-up-mobile images are also assigned to TikTok for reuse. These labels describe intended reuse, not new generations or verified platform acceptance. A narrative chapter is not automatically an Instagram Story or TikTok asset.
- Story pages are grouped within their own collection, preventing unrelated `00.jpg` pages from collapsing into the same design. Song pulse vectors have separate design families from finished sleeves.

Category tabs display total file counts. Switching category retains compatible filters; if earlier filters would hide every image in a populated category, they are cleared with an explanatory notice. Active filter chips make constraints visible. The empty-state recovery button clears additional filters while retaining the category. The Alles tab resets all filters.

The metadata backup, correction and per-category/channel audit remain local in `C:/AI/output/jowikroon-classification-audit-2026-09-26`. No private artwork or metadata inventory is committed to Git.
