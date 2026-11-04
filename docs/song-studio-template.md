# Shared song studio template

Editorial update: 4 November 2026. Applies to the nine existing public song routes on hansvanleeuwen.com.

## Result and scope

All nine songs use the existing Hanging On page structure, palette, spacing, cover treatment, Switzer display/body typography and JetBrains Mono labels. The shared implementation handles standalone pages and the music dialog. Public catalogue identities, players, artwork, original upload dates and private-song exclusions are preserved.

Each page includes three process notes, three measured-version figures and an expandable numeric table with source/date/format information. Hanging On also retains its three existing measured timeline/frequency figures. There are 27 new scalar figures across the nine pages and 30 figures in total. Seventeen version rows describe sixteen unique measurement records; the two Beat Drop pages explicitly share one inspected import.

## Evidence and version boundaries

The selected studio readings were inspected in the authenticated Neural Analog Studio on 4 November 2026, after each selected version completed loading. These are the service's displayed readouts, not newly performed lossless measurements or independent listening judgments. No processing jobs were started for this update.

| Song page | Version records | Source and limit |
| --- | ---: | --- |
| Neon House of Glass | 1 | Named remastered MP3 import; not matched to the Spotify stream. |
| Beat Drop | 1 | Named MP3 import; not matched to the Spotify stream. |
| Beat Drop (original) | 1 | Explicitly the same inspected import as the release page; not a second measurement of the SoundCloud version. |
| Loop in Control | 3 | Original source, Modern master 8.1, stereo version 12; distinct saved versions, not an inferred serial process chain. |
| 78 THz Texture | 2 | Original source and enhancement 1; failed or reinterpretation versions excluded. |
| With a Grin | 2 | Original stem-mix import and enhancement 3.1; public-stream identity unconfirmed. |
| That Spark | 2 | Historical Pressure (Remastered x2) candidate: source and restoration 1. The public title alias is corroborated; the selected candidate's exact relationship to the current recording is unconfirmed and visibly labelled. |
| Beat Between Our Years | 2 | Restored-mix source and Modern master 2. Target setting is −8 LUFS; displayed result is −8.4 LUFS. No attribution to the public stream without identity evidence. |
| Hanging On | 3 | Existing 3 November PCM comparison: earlier source, matched archive master, decoded public stream. See the original process record. |

Studio true peaks above zero are retained, including +1.8 dBTP for Loop's Modern version and +3.3 dBTP for Beat Between's Modern version. A reconstructed peak above full scale calls for export/playback review; it is not proof of audible distortion for every listener or a declaration that the version is an approved delivery master.

Unknown MP3 bit depths and studio durations remain absent. Hanging On has no recorded LRA in the retained comparison, so its third scalar chart shows the explicitly calculated true-peak-minus-integrated-loudness distance. This is distinct from its short-window RMS crest graph. Summary meters use original measured levels; Hanging On's paired time/frequency comparison remains normalized to −18 LUFS.

Private project identifiers, source file identifiers, account details and source audio are retained in the task evidence record outside the public webroot. No new waveform, spectrum or time series was inferred from scalar metrics. The separate 31-export archive batch and November archive candidates were researched but not silently assigned to unrelated public versions.

## Implementation

- `songProduction.ts` holds version-specific public facts and process notes, separate from the immutable song catalogue.
- `SongProductionProcess.tsx` renders native HTML/CSS meter plots, numeric tables and process notes; no chart library was added.
- `HangingOnProcess.tsx` retains the original measured graphs and adds unique accessible IDs for coexisting page/dialog instances.
- `MusicSong.tsx` uses the shared template and scopes scrolling/observers to its own page or dialog.
- `songPageSeo.ts` supplies matching client/prerender metadata and music-specific structured data. The editorial date changes to 4 November; original recording upload dates do not.
- The process module loads on demand in the browser. An explicit synchronous server view preserves complete prerendered chart content. The small presentation stylesheet remains in the initial styles so static HTML is styled before scripting.

## Validation record

Five specialist agents completed the [fifty-round ledger](song-studio-validation-2026-11-04.md): source provenance, live archive reconciliation, template audit, implementation and live studio validation. Every round records a validation and result. The final live-data audit matches all ten independently collected readouts to the public dataset; the coordinator's three Loop readings and the existing three Hanging On PCM records are separately sourced.

The full app TypeScript comparison used the actual `tsconfig.app.json` and the same installed dependencies for the working tree and base revision `6937aa9`. The base has 302 diagnostics and the working tree has 255, with zero new diagnostics and none in the changed modules. The remaining repository-wide diagnostics are inherited; the empty-solution npm typecheck command is not counted as proof that the app is type-clean.

Release validation is appended after preview and production checks. The historical Hanging On-only document remains an account of its 3 November change, rather than being rewritten as if the expanded template had existed then.

### Local integration gate

- Four focused suites: 28 tests passed, covering catalogue identity, original graph mathematics, measured-version scope and all nine page/dialog implementations.
- Full personal production pipeline: passed, including webroot protection, 68-page SEO validation with 27 checks, 69-page image inspection with 77 unique assets and zero failures.
- Initial eager JavaScript exceeded the existing budget at 427 kB gzip. The process-module split reduces it to 414 kB against the unchanged 425 kB budget.
- All nine generated pages contain their complete process content, 27 new metric figures, 17 version rows and unique section/graph IDs. Only Hanging On contains the three original source-comparison SVGs. No loading placeholder is emitted in static page content; graph styles load with the application stylesheet.
- The build-generated sitemap is intentionally regenerated by the normal publishing pipeline; unrelated local sitemap churn is not part of this source change.

### Deployment preview gate

Vercel preview for source revision `45b4dfd` reached READY. The GitHub personal, SaaS and thought-canvas build jobs, CodeQL and the source-analysis job passed.

Browser checks verified the Loop in Control standalone page at a 1348-pixel content viewport: all three measured figures rendered, page width equalled scroll width, section navigation reached the process section, and opening the measurement disclosure exposed every numeric row. Keyboard Tab reached the focusable table region. No duplicate IDs were present. Observed console errors were from the browser extension rather than the application.

The music dialog rendered the same process content in its 1063-pixel scroll area. Section navigation scrolled that container to the matching unique anchor, all three figures remained inside the dialog, and Escape closed it, removed its query parameter and restored focus to the originating song control. Hanging On rendered both its three retained source-comparison graphs and three scalar figures with the original source values.

Responsive rules were inspected at the 900- and 680-pixel breakpoints, including single-column meter/step layouts and the focusable horizontal table region. A narrow device viewport was not available through the browser control surface, so no physical-device or narrow-viewport visual pass is claimed. A directional word in Hanging On's explanatory copy was removed after the preview review because the summary meters precede that note.
