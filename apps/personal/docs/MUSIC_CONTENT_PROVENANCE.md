# Jowikroon music-page fact and provenance rules

Applies to `apps/personal/src/pages/Music.tsx`, `MusicSong.tsx` and `src/data/music.ts`.
This is an editorial quality gate, separate from the technical SEO automation.

## What is publishable

- **Official release dates:** use an artist/distributor release record or the official streaming listing. Do not infer a release date from a first upload or a filename.
- **SoundCloud uploads:** match the public track's immutable ID, page URL, and upload timestamp to the curated `soundcloud-public.json` record. An upload date is not automatically a composition, recording, mastering, or distribution date.
- **Lyrics:** publish exact words only from an artist-approved lyric document or an official authorized lyric source for that specific version.
- **Instruments, equipment and production history:** publish specific claims only if an artist-approved session record, project file, or other direct evidence supports them. A listener's sonic impression is not proof that a particular instrument or device was used.
- **Alternates, remasters and masters:** identify the version explicitly; do not silently merge titles, files, recordings, or release statuses.

## Changes that require manual review

1. Record the track/version and supporting evidence in the pull request, including the source location and the field being changed. Private files should be referenced privately, not copied into the public repository.
2. Check the displayed facts and the `Song.date` field agree. The label must distinguish an official release from a SoundCloud upload.
3. Do not turn AI-generated SEO suggestions, song titles, descriptions, sonic guesses or draft lyrics into historical facts. Empty `gear` or `lyrics` lists are valid when evidence is unavailable.
4. Do not modify ISRC, UPC, distributor, copyright, or songwriting credits as a side effect of a content/SEO repair. Those need a separate release-record review.
5. Run the music data tests, relevant web build and preview. Have a human verify the affected public page before merge.

### Existing scope (1 November 2026)

The public catalogue consists of two official Spotify singles and seven verified public SoundCloud track IDs. Beat Drop's official release date is **2026-05-28**; its later SoundCloud original-mix upload is **2026-09-28**. SoundCloud equipment lists and lyrics remain unpublished pending specific source verification.

The SoundCloud drift workflow opens a **review issue only**; it does not approve facts or publish changes.
