# Jowikroon song stories: één verhaallaag, vijf rollen × tien reviews

Datum: 2026-11-06. Scope: uitsluitend de negen bestaande openbare `/music/:slug`-routes.

## Bronnen en uitgangspunt

- Integratiebasis: `main` commit `b4bf080b382bfec1c9b7c8c9c1d958b44f2552d5` (PR #511 inbegrepen).
- PR #493 `07ea6865e40e11dc5e703ded63646b4ca90930d6`: compacte I / You / It, 519 lokale tests gerapporteerd, nog draft.
- PR #495 `162600022941eeb8496db1522e02b80b0465b410`: lang narratief, artwork, nav en productieclaims, 524 lokale tests gerapporteerd, nog open.
- PR #507 zit al op `main` en leverde vier bestaande `storyTriptych`-teksten, officiële beelden en nieuwste SEO-albumgates.
- Brongebonden productiegegevens komen uit de bestaande `apps/personal/src/data/songProduction.ts`. Die module is ongewijzigd gebleven.
- HansOS-context: GitHub `jowikroon/hansos-vault-backup` op `0c05b2bbda7fa210428534bf58c63acd06669e37`, commit 2026-11-06 19:37:56 UTC. START-HERE.md, AGENTS.md, HANSOS.md, claude.md, index.md, Command-Board.md, log.md en manifest gelezen. De commit is een logwijziging, **geen onafhankelijk bevestigd volledige vault-backup**; snapshotsynchronisatie naar Windows/Pi onbekend. Geen vertrouwelijke persoonlijke verhaalbronnen gepubliceerd.

## Vergelijking en integratiebeslissing

| Thema | #493 | #495 | Deze integratie |
|---|---|---|---|
| Emotie | Kort drieluik | Lang verhaalmotief | Eén opening met subline, emotie, I / You / It |
| Context | Minimaal | 2–4 alinea's, meerdere harde productieclaims | Twee originele, niet-biografische contextalinea's |
| Luisteren | Geen aparte cues | Drie technisch-specifieke cues | Drie expliciet interpretatieve luistervragen |
| UX | Inline, geen Story-nav | Story-nav, zware kaart | Eén Story-anchor, subtiele donker/ruimtelijke compositie |
| Mobiel | Drie regels in container | Vierkante afbeelding eerst, viewport query | Emotionele tekst eerst, container-responsive artwork |
| Album | Risico hardcoded NEON-links | Niet-bevestigde album-slugs | Alleen `publicAlbumForSong()` voor officieel linkbewijs |
| Media | Bestaande covers | 27 WebP-storybeelden, andere OG | 27 WebP in pagina; officiële covers en OG ongewijzigd |
| SEO | Bestaande basis | Ouder, vervangt schema | Nieuwste main-schema + unieke descriptions voor 5 songs |
| Audio | Nauwelijks technische claims | Nieuwe instrument-, Hz-, BPM- en Ableton-claims | Geen nieuwe techniekclaims; bestaande versiegegevens apart |
| Structuur | Story-data in music.ts | Lazy client + synchrone SSR-view | Eén story-datafile, één component + bestaande SSR-viewstrategie |

## 10 reviewpassen per rol (50 controlepunten)

Vijf parallelle specialistische reviews, ieder tien voortbouwende controles, op broncode en waar bereikbaar de publieke site. Dit zijn **geen vijftig onafhankelijke gebruikerstests**.

1. **UX/mobiel**: actuele routes; plaatsing verhaal; doublures; sectienavigatie; leesritme; smalle modal; headings; albumcontext; scrolloffset; acceptatie.
2. **UI/typografie**: main-herkomst; dubbele CSS-classnamen; Switzer/Mono; hiërarchie; mobiel beeldvolgorde; contrast; borderless compositie; artwork en wereldvarianten; focus/aanraakdoel; visuele gate.
3. **Narratief**: negen songidentiteiten; vier reeds gepubliceerde drieluiken; emotionele kern; lang verhaal; overlapping met release notes; I als poëtische stem; citaten; onbewezen instrumentatie; albumtoewijzing; finale redactie.
4. **Techniek/SEO**: branches; publieke-data-grens; een component; centrale typen; migratie; versiebronfeiten; asset/OG; lazy+SSR; regressietests; releasegrens.
5. **QA/provenance**: PR/reviews/CI; negen publieke routes; #507-integratie; albumprivacy; instrumentcredits; Ableton-status; sample rates; lyrics; assets/metadata; productie- en browsertests.

## Concreet gewijzigde architectuur

- `src/data/songNarrative.ts`: precies negen verhalen, vier bestaande drieluikteksten letterlijk overgenomen, vijf vanuit #493 geredigeerd. #495 levert visuele en structurele inspiratie; onbewezen technische details zijn niet overgenomen.
- `src/components/music/SongStory.tsx`: de enige verhaalcomponent met semantische H2/H3, drie perspectieven, twee paragrafen, artwork en interpretatieve luisteraanwijzingen.
- `SongStoryView.tsx` en `.server.tsx`: gedeelde client-lazy en synchrone SSR-structuur; anker altijd aanwezig.
- `src/styles/song-story.css`: donkere, hoog-contrast typografie, zachte overgang zonder zware paneelranden, container queries voor dialogen en kleine telefoons.
- `MusicSong.tsx`: bestaande player/video, platformlinks, verse nav, sourced production, lyrics en share blijven; oude inline `.neon-triptych` verdwijnt na datamigratie.
- `music.ts`: bestaande releasefeiten en lyrics behouden, repetitief proza voor de twee officiële singles en Hanging On ingekort. De vier oorspronkelijke drieluikzinnen zijn nu één keer aanwezig.
- `songPageSeo.ts`: huidige og:image/alt/canonical/JSON-LD blijven, vijf aanvullende onderscheidende titels en beschrijvingen toegevoegd.
- 27 bestaande WebP's overgenomen uit #495, zonder nieuwe claim dat al die beelden in een specifieke kunstenaarsarchive waren goedgekeurd.

## Feitelijke grenzen

- Alleen **Beat Drop** en **Neon House of Glass** krijgen via `publicAlbumForSong` een bevestigde NEON-albumkoppeling. Een song kan wel passen in de NEON-wereld zonder aangekondigde LP-positie.
- `Beat Drop (original)` heeft een latere SoundCloud-upload dan de single-release, maar dat bewijst geen eerdere mixdatum of specifieke masteringverschillen.
- De door #495 genoemde 192 kHz `Loop in Control` en 96 kHz `78 THz Texture` zijn niet gedekt door de actuele benoemde versies; deze claims zijn geweerd.
- Geen nieuwe instrumentnamen, individuele stems, synthesizers, exacte bpm, Ableton-sessiestatussen of LUFS-claims in de verhaallaag. Metingen blijven met versie, datum en bron in de bestaande productiemodule.
- Geen nieuwe privépreviews, verborgen albumposities, niet-gepubliceerde songroutes, coverflip- of spelerlogica.

## Uitgevoerde controles

| Controle | Resultaat |
|---|---|
| `npm ci --offline` | Geslaagd, 557 packages geïnstalleerd |
| `npm run test:personal` | **586/586** groen, 62 bestanden |
| `npm run typecheck --workspace=@hans/personal` | Geslaagd |
| `npm run lint:personal` | 0 fouten, 19 bestaande waarschuwingen |
| Vite productie-clientbuild | Geslaagd, 3480 modules |
| Vite SSR-build | Geslaagd, 356 modules |
| Statische prerender | Negen songpagina's geschreven |
| SSR-inhoud per song | Exact 1 `.songstory`, 3 perspectieven; albumlink alleen bij 2 officiële tracks |
| `seo-guard` | 70 pagina's, 27 controles geslaagd |
| `image-guard` | 71 pagina's, 121 beelden, 0 failures |
| `bundle-guard` | 411/425 kB eager JS gzip, 0 failures |
| `public-webroot-guard` bron + dist | Beide geslaagd |
| `git diff --check` | Geslaagd |

**Bewuste uitzondering:** de standaardopdracht `npm run build:personal` eindigt met `indexnow-ping.mjs`, een externe indexeringsmelding die niet past bij een niet-gepubliceerde ontwikkelbranch. Daarom zijn de inhoudelijke build/SSR/prerender/SEO/image/bundle-stappen afzonderlijk uitgevoerd. Het sitemap-generator-script is niet uitgevoerd wegens live Supabase-read/public-file-write in deze review. De volledige CI-build op de exacte remote commit moet nog groen blijken.

**Browsergate nog open:** de verbonden lokale browserextensie kon niet worden gebruikt; een geïsoleerde cloudbrowser kon de lokale `127.0.0.1`-server niet bereiken. Daardoor zijn de daadwerkelijke responsive screenshots bij 320/375/768/1440px, focusvolgorde, scrolloverlap, modal- en hydrationgedrag van deze branch **nog niet onafhankelijk bevestigd**. De TypeScript/JSDOM-tests zijn geen substituut voor browserbewijs.

## Releasebesluit

**Alleen review op een conceptbranch.** Geen squash merge, `main`-wijziging, productiepublicatie, extra privé-SoundCloud-links of automatische IndexNow-melding zonder afzonderlijke expliciete goedkeuring van Hans. Na eventuele preview: controleer mobiel/desktop, Tab/Shift+Tab/Enter/Escape, reduced motion, hydrationconsole en audio/albumregressies; pas daarna om een expliciete GO vragen.
