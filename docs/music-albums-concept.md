# Two album pages: review candidate

The music page now opens with NEON: The Signal Between and IETS MOOIS. Each album has its own route and visual identity. The existing public recording catalogue remains below the albums.

## Public pages

- `/music`
- `/music/albums/neon-the-signal-between`
- `/music/albums/iets-moois`

The current NEON front/back pair is the user-supplied album-front-b7d1b5d7 (2).png and album-back-f393fa86 (3).jpg, selected as the only current final version in the latest 3 November instruction. This supersedes the earlier NEON DEF front as well as editorial r2 fronts. IETS MOOIS retains its previously approved front and uses the newly supplied green portrait back. Originals stay in SecondBrainVault; front web derivatives preserve their complete compositions. NEON shows two hands and a violet signal on black; IETS MOOIS shows the artist portrait against dark green. The original PNG files and approval record are preserved in SecondBrainVault. Site text uses Switzer and JetBrains Mono. The surrounding NEON layout uses ink and a restrained violet accent; the IETS MOOIS website now uses the same dark ink base, with warm text and restrained green/clay accents following the latest user request.

Only Beat Drop and Neon House of Glass are playable in the NEON album sequence. Other development slots show generic blurred marks and COMING 2027. IETS MOOIS exposes its name, cover, year and teaser slots. No unreleased titles, media links or full guides are shipped in album data. Existing independently public SoundCloud recordings remain available in the original catalogue.

## Owner view

The owner panel uses the existing `is_portal_owner` check and a proposed separate table, `music_album_private_details`. The hook also hides data synchronously on account changes, logout and album switches, cancels obsolete requests and fails closed on missing or malformed data.

The SQL in `supabase/migrations-draft/music_album_private_details.sql` is a REVIEW DRAFT, not a production change. It enables/forces RLS, removes anonymous access and browser writes, and grants authenticated SELECT only when `is_portal_owner()` is true. Private content must be imported through an authorized privileged channel; it must never enter this public repository or public webroot. A separate private local seed has been prepared by the operator.

Until the schema and private content have been applied and live owner/non-owner access has been tested, the owner panel intentionally shows that private details are not connected. Hook tests and mocked browser tests do not prove production database authorization.

## Site integration

Public routes, client and prerender metadata, Dutch album language, image previews and sitemap entries are aligned. `/music/albums` redirects to `/music`. Album schema lists only the two public releases; it does not claim a final track count or a precise release date. The existing blog draft can link directly to both album routes once this candidate is deployed. Do not add a live link back to the draft essay until that essay exists publicly.

## Release checks

Review the exact visual candidate and proposed database change together. Before publishing, validate the policy using anonymous, ordinary-member and owner identities in the target environment. Import the private seed outside the public source tree, then verify authenticated rendering and sign-out. No guides or private media should be added to public storage. Preserve the existing music catalogue and song URLs.

## Square sleeve interaction (3 November 2026)

The album shelf now shows square cover-only cards. Click/tap flips a cover into a public digital back sleeve, with released tracks and an album CTA. Keyboard navigation, Escape, one-open-at-a-time behavior and reduced motion are supported. The updated full-art backs have editable track overlays. See [the ten UX decisions and research](music-albums-ux.md) and [the final artwork and reveal specification](music-album-artwork-reveal.md).

## Dark album template and public brand stories

Both complete album pages now use the shared dark AlbumPageTemplate. Each has a /brand page with the emotional meaning of its identity and process, plus an editorial/process section on the album page. See [template and source documentation](music-album-template.md). Full private brandguides remain owner-only.
