# JOWIKROON album sleeves: permanent motion & UX contract

Status: **active rule from 2026-11-05**, superseding the 440 ms historical implementation described in `docs/music-album-artwork-reveal.md`.
Scope: `/music`, `/music/albums/neon-the-signal-between`, `/music/albums/iets-moois`.
Implementation: `apps/personal/src/components/music/AlbumSleeve.tsx`, `AlbumShowcase.tsx`, `apps/personal/src/styles/music-albums.css`.
Governance: `AGENTS.md` and `CLAUDE.md` protect these behaviors across future coding sessions.

## Visitor experience
1. A full, unmodified square front cover is the first interactive object, with a visible/accessible hint to turn it.
2. Activating that cover rotates the entire sleeve about its vertical axis by **180 degrees**, taking **760 ms** with restrained easing, revealing the complete approved back. Never crop the image to fit.
3. After the turn settles, individual HTML track rows fade in and lift softly, initially slowly and then more quickly. No autoplay, sound or infinite loop.
4. The animation restarts for every newly opened sleeve. At most one sleeve is open at a time on `/music`.
5. Direct links to NEON, IETS MOOIS and the public recording list stay **below** the covers as a clear nonanimated alternative. Do not make the user perform the flip to reach an album.
6. NEON: two verified released tracks at positions 02 and 04, remaining positions anonymous. IETS MOOIS: **12 songs are planned**, four separately authorized website previews appear on the album page, but the square back cover deliberately keeps **five anonymous animated teaser positions**. Do not confuse previews with official singles, expose slots 5-12, or substitute the animated teaser with a static quote. This updates the 2026-11-05 five-total-slot assumption by Hans's explicit decision on 2026-11-06.
7. The reader can press Escape to close and restore focus, use Tab or keyboard activation without waiting for animation, and use reduced-motion to see everything immediately.

## Timing, relative to activation
| Row | Starts | Gap from prior |
|---|---:|---:|
| 01 | 920 ms | 160 ms after 760 ms cover turn |
| 02 | 1370 ms | 450 ms |
| 03 | 1720 ms | 350 ms |
| 04 | 1960 ms | 240 ms |
| 05 | 2140 ms | 180 ms |
| 06 | 2280 ms | 140 ms |
| 07 | 2390 ms | 110 ms |
| 08 | 2480 ms | 90 ms |
| 09 | 2560 ms | 80 ms |

Each row has a 360 ms entrance animation. Both albums share the same stagger schedule. Further positions continue after the ninth at 60 ms intervals. For reduced motion, all rows are immediately readable.

## Required CI guard
The `Build personal` job in the existing CI invokes `npm run test:personal`, `npm run lint:personal`, `npm run typecheck --workspace=@hans/personal` and `npm run build:personal`. These must pass on the exact PR SHA.

The tests in `apps/personal/src/components/music/AlbumSleeve.test.tsx` enforce:
- NEON nine rows with fixed timing sequence and decreasing intervals.
- Five anonymous IETS MOOIS sleeve rows despite its 12 planned album positions, never hidden by a static quote.
- Four separately pinned SoundCloud website previews, with no full private-playlist embed or official release claims.
- Each opening restarts and Escape closes.
- Keyboard activation and Tab bypass waiting.
- The real CSS 760 ms 3D turn, the 360 ms row entrance and reduced-motion fallback.

The separate `AlbumShowcase.test.tsx` preserves direct album navigation and the primary heading. Never weaken these tests or suppress CI to push an aesthetic change.

## Twenty-point review register (five specialist roles, not five independently started agents)
This register describes code-level review lenses; it is **not** a claim of twenty agent executions or twenty end-to-end browser sessions.

| Pass | Role | Required evidence/check |
|---|---|---|
| 01 | Motion | Front rotates around Y, full 180 degrees |
| 02 | Motion | Smooth 760 ms ease, not an instant 440 ms snap |
| 03 | Motion | First row starts after the turn completes |
| 04 | Motion | Row delays accelerate and replay on reopening |
| 05 | UX | Cover is the primary visual before text links |
| 06 | UX | Direct links still work without flipping |
| 07 | UX | Only one shelf cover is open at a time |
| 08 | UX | Back-face CTA points to the correct album |
| 09 | Accessibility | Front/back have meaningful accessible labels |
| 10 | Accessibility | Return focus and Escape behavior remain |
| 11 | Accessibility | Keyboard and Tab never wait on hidden rows |
| 12 | Accessibility | Reduced-motion shows every row immediately |
| 13 | Privacy | No unreleased track names exposed to public DOM |
| 14 | Privacy | IETS MOOIS sleeve uses five anonymous teaser positions; album page has four authorized listening previews and eight undisclosed positions |
| 15 | Privacy | NEON only links the two confirmed public tracks |
| 16 | Privacy | No change to private owner detail policies |
| 17 | Engineering | Branch-scoped source changes and exact commit |
| 18 | Engineering | Vitest motion contract passes |
| 19 | Engineering | CI lint, typecheck and production build pass |
| 20 | Engineering | Production Vercel exact SHA READY, optional live browser inspection noted separately |

## Verification boundaries
Static code review, unit tests, GitHub CI and Vercel production deployment validate different things; none alone proves what every visitor sees. Browser interaction including physical touch, real reduced-motion settings and screenshots must be reported only when actually performed. User-provided screenshots are evidence of a specific session, not proof of what a GitHub deploy did.

## Website-preview decision, 2026-11-06
Hans selected the first four recordings from his private SoundCloud playlist `NEON | NL Signals` for public listening on the IETS MOOIS album page, keeping the eventual album at 12 planned songs. Website previews are neither distributed releases nor definitive masters. The fourth selection, *Hypnotisch*, is marked as a nonfinal working version in its SoundCloud description and must visibly carry that caveat. Playback is loaded on request for four individual tracks only. Private SoundCloud embed URLs are shareable when used publicly; this is a visibility decision, not website-only access control. The remaining eight album slots stay anonymous. The approved album artwork and the 760ms sleeve motion remain unchanged.

## How to handle a future regression
Reproduce against the current deployed SHA; verify correct album route, style loaded, reduced-motion OS setting and whether the album's `data-open` state changes. Check that `.ma-sleeve` transforms and the track rows use `--ma-reveal-delay`. Update implementation **and a failing regression test**, run CI and release, then verify deployment. Preserve approved artwork and historical source files. Log cause, fix, checks and limitations in HansOS.
