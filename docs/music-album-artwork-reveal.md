# Final artwork and editable track reveal

Implemented locally on 3 November 2026 for the music shelf and both album pages.

## Current artwork decision

NEON uses only the newly supplied `album-front-b7d1b5d7 (2).png` and `album-back-f393fa86 (3).jpg` pair. The original front composition and lettering remain intact. This replaces the earlier NEON final-for-now cover. IETS MOOIS retains its approved front and gains the newly supplied green portrait backside.

Source originals, hashes, exact edit prompts and the current decision are stored in `D:\SecondBrainVault\raw\2026-11-03-current-final-neon-back-overlays\`. Both backside photographs have text-free derivatives made with the built-in image editing tool. They are visually inspected image edits, not pixel-identical copies of the source originals. No unreleased tracklist image is put in the public site.

## The interaction

A front cover is still a square image with no text panel beneath it. Clicking or tapping flips it into the full square back image. The complete image is contained within the square, without cropping; a restrained left-to-right scrim supports readable overlay text. The portrait and purple details remain visible on the right. Album-page artwork uses the same component as the shelf.

Artist, album, year and track rows are HTML overlays. Released song names come from the existing public song catalogue, joined to album track positions. Changing a title or release position in that data updates the overlay without editing a bitmap. This is a data-driven frontend, not a newly connected CMS workflow.

NEON has nine development positions: Beat Drop at 02 and Neon House of Glass at 04 are visible links. The other seven positions are anonymous blurred shapes. IETS MOOIS has five anonymous blurred positions. COMING 2027 remains readable. Private title strings are not shipped to the public sleeve and cannot be recovered by disabling CSS blur. These development positions do not claim a final released track count in search metadata.

## Slow start, accelerating arrival

The cover turns in 440 ms. Track arrival starts after the turn, with these offsets from activation:

| Row | Starts at | Gap from previous row |
|---|---:|---:|
| 01 | 650 ms | Initial pause |
| 02 | 1,100 ms | 450 ms |
| 03 | 1,450 ms | 350 ms |
| 04 | 1,690 ms | 240 ms |
| 05 | 1,870 ms | 180 ms |
| 06 | 2,010 ms | 140 ms |
| 07 | 2,120 ms | 110 ms |
| 08 | 2,210 ms | 90 ms |
| 09 | 2,290 ms | 80 ms |

Each row arrives over 360 ms, fading in with a short upward movement, a slight angle and a small settling motion. All nine settle by about 2.65 seconds. Each opening replays the sequence. There is no looping movement, sound or autoplay. Unreleased positions follow the same rhythm but remain blurred.

Keyboard activation and reduced-motion settings reveal rows immediately. Tab during the sequence also reveals the rows immediately, so no keyboard user has to wait for an invisible destination. The return button is first in the back's focus order, followed by released tracks and the album/tracklist action. Escape restores the front and focus. Opening a second sleeve closes the first. The album-page action takes the visitor to its full tracklist.

## Verification and boundary

The browser dossier is `D:\ShadowPC\work\music-albums-concept-2026-11-03\final-sleeve-check.cjs`, with machine-readable results and screenshots beside it. It checks timed row opacity, replay, full images, small-screen fitting, touch, keyboard, reduced motion and the absence of private names in the sleeve. Technical checks do not establish visitor preference or constitute a new artistic approval.

The pre-existing owner-only details integration remains unchanged. Its production database setup is still separate and pending. No live publication, release/distribution or cross-device vault synchronization is implied by this local update.
