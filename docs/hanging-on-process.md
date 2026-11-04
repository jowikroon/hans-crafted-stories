# Hanging On process story

Editorial update: 3 November 2026. Public page: `/music/hanging-on`.

## Purpose and scope

Extend the existing public Hanging On page with an English NEON process story and measured production graphs. The public recording, cover, upload date and immutable SoundCloud track ID remain the same. The story documents the source comparison and the next production decisions; it does not announce an approved remaster.

The Music catalogue is intentionally English. This change adds no language route or CMS database key. The existing Vercel prerender renders the public component into the route HTML. The Hanging On metadata description is mirrored in the client and prerender; its editorial date is 2026-11-03, while the other song dates remain unchanged.

## Evidence boundaries

The public SoundCloud recording is track 2419106913, uploaded on 2026-10-14, with a duration of 7:59. The file label alone is not a reliable format or source identity. Measured comparison identified the archived 48 kHz/24-bit master associated with the public stream and an earlier 48 kHz/16-bit source variant of the same performance.

| Signal | Integrated loudness | True peak |
| --- | ---: | ---: |
| Earlier source variant | -15.37 LUFS | -4.40 dBTP |
| Archived master matching the public stream | -7.73 LUFS | +0.17 dBTP |
| SoundCloud AAC stream, decoded | -7.79 LUFS | +1.00 dBTP |

The AAC stream true peak was independently measured at +1.003 dBTP with 16x FIR reconstruction. Decoder output above zero is a playback risk; it does not prove every playback chain clips. The earlier source has about 3.07 dB more peak-to-loudness space. A measured difference is not a listening verdict.

Graph data comes from the complete PCM analysis made on 2026-11-03. The presentation uses a compact, public-only derived dataset with units, labels, signal identities and descriptions. It must not include internal source paths, account details, Drive IDs, signed URLs, private audio exports or the internal research report.

For comparisons at equal loudness, both signals are mathematically normalized to the same integrated level. RMS traces show the whole mix, not the isolated vocal. Local crest describes peak-to-RMS room in short windows, not the overall LRA. Frequency-band energy describes measured energy, not a percentage of perceived loudness or instrument ownership.

The findings were measured, not heard. No isolated vocal, bass or kick stems for this exact performance were used. The story must not label a measured upper-mid event as proven vocal distortion or claim that a new master has been approved.

## Reference records

The full analysis remains in the private production workspace, with measurement JSON, per-100-ms timelines, source comparison and diagnostic listening pairs. Provenance identifiers for the two matched lossless files:

- Archived master SHA-256: `e4050e08e4c3eaba657958f6d04f1c29aa70c3166186cdc8960d35d6e19f30e8`
- Earlier source SHA-256: `1267e06b00310b21c93e482930f5d9d8af4748ccbbf5343f38fe7f3b380af52c`

This document is repository documentation, not a public webroot asset.

## Implementation and review checks

- Keep the single existing canonical route and the current SoundCloud player URL.
- Scope new NEON styles to Hanging On and use Switzer with JetBrains Mono.
- Render deterministic native SVG, with accessible title/description and visible numeric summaries or data fallback. No new chart runtime is necessary.
- Ensure mobile labels remain readable, legends work without color alone and no information depends only on hover.
- Respect reduced motion and keyboard focus. Avoid adding extra global scroll handlers or animations.
- Build the complete personal workspace and run its existing SEO, image, bundle and webroot guards. The standard build invokes these guards.
- Run existing public catalogue tests to preserve IDs, slugs, artwork, dates and exclusion of private tracks.
- Inspect the prerendered Hanging On HTML for its story, graph descriptions, correct canonical, English language, one H1 and the scoped editorial date.
- Inspect another song HTML to confirm its metadata date and layout are not unintentionally changed.
- Verify the deployed route and graph content after publication; a successful local build or Git push alone is not live proof.

## Targeted checks worth adding

The new visualization merits a narrow rendering check that it exposes its chart names and comparison values to assistive technology, and a data validation check that all plotted values are finite, ordered in time and bounded by the actual track length. Avoid screenshot snapshots that merely duplicate the implementation. Mobile desktop rendering should be visually inspected separately.

Implemented in `src/components/HangingOnProcess.test.tsx`: public recording identity, source-specific original-export anchors, paired finite one-second points within plotted bounds, independently reconstructed low/high frequency-energy differences, accessible SVG names/descriptions including every signed band value, and focusable horizontal-scroll regions. Run this together with `src/data/music.test.ts` to retain the catalogue guarantees. The 958 exported points were also independently checked against the original 100 ms CSV records during the 3 November review.

## Three-agent, five-round review log

Three specialist agents cover visual design, source-grounded story and technical review. The coordinating agent integrates the work and performs the complete build and browser checks. The five rounds are sequential so each review can improve the next revision.

| Round | Work and evidence | Status |
| --- | --- | --- |
| 1 | Existing-route discovery; public data model and production architecture; source/story boundaries and NEON design references. | Completed |
| 2 | Build the scoped page story and charts; design styles; Hanging On-only prerender description and editorial date; provenance documentation. | Completed |
| 3 | Verify all 958 exported timeline points and frequency-band mathematics; add focused data/accessibility tests; include every signed band value in the accessible SVG description. Focused catalogue/component tests: 9 passed. Coordinator reports full build guards and typecheck passed. | Completed |
| 4 | Refine mobile frequency-chart sizing and timeline-scroll hints; inspect actual generated song/index HTML and neighbouring-track scope. Identify and fix dated WebPage metadata lost on hydration; replace inherited placeholder share links on Hanging On. | Completed; fixes verified in round 5 |
| 5 | Final rebuild and technical regression review: 9 focused tests passed, typecheck passed, lint has 0 errors / 19 existing warnings. Build guards passed: 58 SEO pages, 67 images without failures, 411 kB eager JS gzip within 425 kB budget. Refreshed generated HTML passes the three-route comparison. | Technical review passed; coordinator owns final visual and live publication verification |

The regenerated round-five HTML has one English H1, the canonical Hanging On URL, three prerendered charts and the production story, the original 2026-10-14 upload date, and the scoped 2026-11-03 editorial date. Every signed band value is included in the accessible SVG description; the narrower frequency-chart viewBox and all three real share/permalink targets are present. The client graph now retains the dated English WebPage node during hydration. `/music` links to this existing route; `/music` and Beat Drop retain their 2026-11-01 editorial dates and do not render the process component or page scope. No internal source paths or private file hashes were found in those HTML documents. A live release has not been verified by this technical review.

## Subsequent update, 4 November 2026

The Hanging On design is now the shared template for all nine public song pages. Its original measured timeline and frequency data remain intact, with three additional scalar comparison figures. Shared styling, dated music metadata, unique dialog anchors and per-song production evidence are documented in [the shared template record](song-studio-template.md) and [fifty-round validation ledger](song-studio-validation-2026-11-04.md). The earlier sections above remain the historical record of the 3 November change.
