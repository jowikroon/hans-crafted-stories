# Song stories: "Inside the recording"

Public pages: `/music/<slug>` and the `?song=<slug>` dialog on `/music` and the album pages. Every public song in `apps/personal/src/data/music.ts` has one story. The section replaces the one-off Hanging On process page (November 2026) with a generic, data-driven system.

All paths below are relative to `apps/personal/`.

## Data model

`src/data/songStories.ts` exports `songStories: Record<slug, SongStory>`, `getSongStory(slug)` and the shared `craftNotes` ("How I work"). A story is plain data, in Jowikroon's own voice, English, first person.

| Field | Purpose |
| --- | --- |
| `slug`, `updated` | Must match a `Song.slug`. `updated` (ISO day) feeds `WebPage.dateModified` on the page and the prerender, and the sitemap `lastmod`. Bump it when the story text or a figure changes. |
| `eyebrow`, `title`, `intro` | Section header. The eyebrow is also the section-nav label. |
| `core` | "What I was looking for": `ProseBlock[]` from music.ts (lead, p, pull, callout). |
| `chapters[]` | Numbered chapters (01, 02, ...), each with `body` and an optional `figure`. |
| `choices` | 2-column grid of short cards. |
| `connection` | "Where it sits": text, optional `albumSlug` (must resolve through `getAlbum`), optional `position` (only when the album lists the song in `publicTracks`), and `related[]` links to other song pages. No release date is ever claimed. |
| `quotes[]` | Pull quotes with attribution (lyric line, studio note, story frame). May be empty. |
| `craft` | Ids of the shared `craftNotes` ("How I work") shown under this story; an empty list hides the block. |
| `gallery[]` | `/images/songs/<slug>/<name>.webp` with width and height, plus a `<name>-640.webp` variant next to it (the grid uses a `srcset`, the lightbox the full file). Files live in `public/images/songs/`. |
| `ogImage`, `social` | Social card: a 1200x630 JPEG at `public/images/songs/<slug>/<slug>-card.jpg`, generated once by `apps/personal/scripts/build-og-cards.py` and committed (no build step), with its real width and height and alt text, and the card copy used for og/twitter description. The card title is `<Song> · Jowikroon`. |
| `closing`, `method`, `caption`, `seo.description` | Closing line, the collapsed "About these measurements" block, the share line (max 90 characters), meta description (120 to 155 characters). The page title comes from `songPageTitle` ("Song · Story line · Jowikroon", shortened to stay under 60 characters). |

Figures (`StoryFigure`, discriminated by `kind`):

- `timeline`: multi-series line chart over time (`unit`, `domain`, `ticks`, `durationSec`, `series[]` with `stroke` violet / ice / neon / ember and `dashed`, optional `markers` as dashed labelled lines). Points are `[seconds, value]`, sorted. Values outside the domain are drawn on the nearest edge. Timeline and event charts render a wide and a narrow twin; CSS shows one of them, so phones never scroll sideways.
- `bars`: horizontal marks (`rows[]` with `label`, `value`, optional `note`). When the domain spans zero the bars diverge around the zero line; `marks: "dot"` draws a point on a faint rail (used for loudness per master). Zero rows draw no bar. On phones the SVG is replaced by a stacked HTML layout, so bar charts never scroll sideways.
- `events`: beat strip, one tick per `[seconds, strength 0..1]`, optional `markers`.
- `facts`: label / value / note grid, no chart runtime.

Every chart carries `title`, `caption` and `desc`, and may carry a one-line `hint` shown above it. Bars charts may add `poles` (what left and right of zero mean) and flagged rows (true peak above zero, drawn as a ring). `desc` is a full-sentence description that includes the measured numbers; it becomes the SVG `<desc>` and the text shown while the chart loads. An optional `method` sentence per figure is appended to the method block.

Points can be inline arrays or a loader (`() => Promise<points>`). Loaders keep the large analysis files out of the eager JavaScript bundle; the page prerenders the text and the `desc` numbers, and the chart arrives through `React.lazy` + `Suspense`.

## Provenance per figure

Measurements live in `src/data/stories/`. `shared.ts` fills the empty ISO weeks between the first and the last week of a version chart. The adapters (`hangingOn.ts`, `loopInControl.ts`, `beatDrop.ts`, `neonHouseOfGlass.ts`, `thatSpark.ts`, `beatBetweenOurYears.ts`, `seventyEightThz.ts`) turn these files into figures; `shared.ts` holds the reusable masters and weeks builders.

| File | What it holds | Used by |
| --- | --- | --- |
| `hanging-on.analysis.json` (loaded on demand) | One-second series of the existing master and the earlier source: mean RMS level in dBFS and median crest in dB at matched loudness (both at -18 LUFS), 479 points each; the eight frequency-band differences. Analysis dated 3 November 2026. | Hanging On: shape, peaks |
| `hanging-on.summary.json` | The band differences, the aggregation sentence, the comparison level and the point count, mirrored from the analysis file so the page text never waits for the chart chunk. | Hanging On: balance, method |
| `loop-in-control.analysis.json` (loaded on demand) | Full-mix and 30 to 180 Hz envelopes of the 192 kHz master of 27 October 2026 (240 points, maximum per half second), 164 detected percussive peaks with strength, measured level transitions. | Loop in Control: breath, pulse |
| `loop-in-control.summary.json` | Counts, strongest beat, first six transitions, low-band start and peak, pulse estimate. | Loop in Control text and descriptions |
| `beat-drop.analysis.json` | Integrated loudness, true peak and loudness range of seven candidate masters of the 2:44 recording (measured 3 November 2026); files per week from the version catalogue (April to June 2026). | Beat Drop and Beat Drop (original) |
| `neon-house-of-glass.analysis.json` | Same measures for seven masters of the 4:46 recording; files per week (April to June 2026). | Neon House of Glass |
| `that-spark.analysis.json` | Energy per eighth of the public recording (set analysis of 11 September 2026) and the twelve narrow notches of the release master with the comb statistics and target loudness. | That Spark |
| `beat-between-our-years.analysis.json` | Energy per eighth for the public cut and the plain remaster, their integrated loudness, files per week (April to July 2026). | Beat Between Our Years |
| `78-thz-texture.analysis.json` | Technical decode of the restored 96 kHz mix of 11 October 2026: integrated loudness, loudness range, true peak, crest factor, length, format. | 78 THz Texture |

With a Grin has no measured figure; its chapter is text only. The analysis files contain only public, derived values: no source paths, account details, storage ids or private exports. Keep it that way; everything in `src/data` is shipped to the browser.

A measured difference is not a listening verdict. Stories describe the complete mix, never an isolated voice or instrument, and never claim an approved remaster or a release date.

## Rendering

- `src/components/music/story/SongStory.tsx`: the section (`section#song-story`), prose eager so the prerender carries it. Heading levels step down one level inside the song dialog.
- `src/components/music/story/StoryFigure.tsx`: figure card with heading, scroll region (`tabIndex=0`, `role="region"`, "Scroll horizontally on small screens."), swipe hint, legend (solid versus dashed, never colour alone), caption, and the Suspense boundary around `charts/ChartRenderer.tsx`.
- `src/components/music/story/charts/`: `TimelineChart`, `BarsChart`, `EventsChart`, `FactsGrid`, `scale.ts`. Deterministic markup, ids from `figure.id`, colours from `--ss-violet`, `--ss-ice`, `--ss-neon`, `--ss-ember`, mono font for chart text, `vector-effect: non-scaling-stroke`.
- `src/components/music/story/StoryGallery.tsx`: responsive grid with a Radix Dialog lightbox.
- `src/styles/song-story.css`: every song page is dark (`.music-v2.song-story-page`), Switzer and JetBrains Mono loaded at runtime by the route, never through `@import`.
- `src/pages/MusicSong.tsx`: picks the story with `getSongStory`, sets the meta description, the `WebPage` node (`dateModified`, `primaryImageOfPage`, `about`) and `MusicRecording.inAlbum` when the story names an album. `scripts/prerender.mjs` mirrors the same head and JSON-LD (plus `duration` and a `BreadcrumbList`) through `src/entry-server.tsx`. It links `App-*.css` in the prerendered head so the first paint has the page styles (no layout shift when the App chunk arrives) and runs React in production mode; the webroot guard fails the build if any prerendered HTML carries development diagnostics (`data-stck`, `data-msg`) or build-machine paths.

Music routes (`/music`, `/music/*`) are always dark, and `src/components/RouteTheme.tsx` is the single owner of that: the theme guard in `index.html` paints them dark on first load, and `RouteTheme`, rendered once inside the Router, sets the dark class, `color-scheme` and `theme-color` per pathname and restores the visitor's theme when they leave. `isForcedDarkPath()` from that same module is what the navbar reads to show its dark variant and hide the theme toggle there. `public/llms.txt` lists the music pages under "Music (Jowikroon)"; add a line there for a new song.

## How to add or change a story

1. Add the song to `music.ts` first (public, verified). The data test fails until every song has a story.
2. Put measurements in a new `src/data/stories/<slug>.analysis.json` with derived values only, and write an adapter that builds figures. Large series: expose them through a loader and keep the numbers the text needs in a small summary file.
3. Add the story to `songStories.ts`. Images go to `public/images/songs/<slug>/` as webp with their real width and height, each with a `<name>-640.webp` variant next to it for the gallery `srcset`. Use commas, colons and periods; never an em dash. Use the minus sign (U+2212) for negative values in prose.
4. Set `updated` to today. Keep `seo.description` between 120 and 155 characters.
5. Run the checks below and look at the page in both the full route and the `?song=` dialog, at desktop and phone width.

## Checks to run

From `apps/personal/`:

- `npm run test -- --run`: includes `src/data/songStories.test.ts` (catalogue links, album positions, image files and their 640 px variants, no em dash, no tool names, description lengths, chapter-title numbers against the figure data, axis and point validation), `src/components/music/story/SongStory.test.tsx` (Hanging On data anchors, Loop in Control summary parity, accessible chart names and descriptions, chart primitives, page integration in both modes) and `src/components/music/story/userFacingCopy.test.tsx` (no tool or generator names anywhere a visitor can read, in the data and in the rendered pages).
- `npx eslint src/components/music src/pages/MusicSong.tsx src/data`
- `npx tsc --noEmit -p tsconfig.app.json 2>&1 | grep -E "music|Music|songStor|story/"` must print nothing.
- `npm run build`: runs the webroot, SEO (titles, descriptions, em-dash scan), image, bundle (eager JavaScript budget) en sitemap guards.
