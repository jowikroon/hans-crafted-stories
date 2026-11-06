# NEON songpagina's: beelden, metatekst en verhaal

Datum: 2026-11-06. Taak: controleer en verbeter de hoofdafbeeldingen, alt-/socialmetadata, albumkoppelingen en individuele verhalen op de bestaande publieke NEON-songpagina's. Dit is een uitvoerings- en bronlog, geen aankondiging van een complete albumtracklist.

## Bronnen en afbakening

- Gebruikersopdracht van 2026-11-06, na een afzonderlijk verzoek om vier private `NEON Official`-SoundCloud-voorproefjes. De toestemming om de vier **IETS MOOIS**-tokens te publiceren is niet automatisch toestemming voor vier nieuwe NEON-tokens.
- HansOS-vault-back-up en opstartcontract zijn eerder deze dag ingezien, met gerapporteerde hoofdcommit `46a3541` (2026-11-06 14:42 UTC), manifest- en incomingcontrole. Een nieuwe primaire-vaultsync of schrijfrecht is hier niet onafhankelijk bevestigd. Publicatie en wijzigingen gebeuren uitsluitend in de website-repository.
- Websitebranch startte schoon vanaf `jowikroon/hans-crafted-stories` commit `b8c374f` op `origin/main`; relevante contracten: `AGENTS.md`, `CLAUDE.md`, `docs/music-album-motion-contract.md`, `docs/music-album-artwork-reveal.md`.
- Songdata en publicatierollen: `src/data/music.ts`, `albums.ts`, `albumEditorial.ts`, `songPageSeo.ts`, `songProduction.ts` en `soundcloud-public.json`.
- Live sessie in cloud-Chrome op de openbare songpagina's van Beat Drop, Neon House of Glass en Hanging On. De officiële coverbeelden **waren zichtbaar**; de eerder vermoedelijke CSS-overlap is daardoor niet als bevestigd defect behandeld. Dit is geen volledige mobiele of schermlezertest.
- De huidige twee officiële Spotify-singles zijn Beat Drop (NEON-positie 02) en Neon House of Glass (positie 04). Hanging On en That Spark zijn afzonderlijke publiek beschikbare NEON-gerelateerde SoundCloud-opnamen, niet bevestigd als definitieve albumposities. De andere publieke songpagina's zijn niet automatisch onderdeel van NEON.

## Vijf gespecialiseerde reviews, elk twintig controlepunten

| Specialisme | Kerncontrole / besluit |
| --- | --- |
| Artwork en bronidentiteit | Alle negen publieke omslagverwijzingen vergeleken; officiële artwork bevestigd in browser en in twee 640px-bronbestanden; Hanging On gebruikt nog de albumhoes. |
| Verhaal en albumcanon | Twee officiële singles aan hun bestaande verhaallijn gekoppeld; niet-bevestigde private masters en definitieve LP-volgorde afgeschermd. |
| SEO en gestructureerde data | Songspecifieke meta- en alt-tekst, correcte `MusicRecording.sameAs`, gedeelde album-ID's en canonieke links. |
| UX en toegankelijkheid | Beeldfallback, mobiele navigatie, contrast, 44px-aanraakdoelen, focus en NEON-stijl zonder een grootschalig herontwerp. |
| Releases en versieprovenance | Released singles, openbare conceptopnamen en private masters strikt gescheiden; That Spark is niet gelijkgesteld aan de andere private Pressure. |

Dit zijn vijf afzonderlijke agentreviews met twintig afgevinkte beoordelingspunten per specialisme, **geen claim van honderd onafhankelijke bezoekers-, fysieke apparaat- of schermlezersessies**. De hoofdagent heeft bevindingen langs de live pagina's en tests gelegd voordat wijzigingen zijn gekozen.

## Besluiten en uitgevoerde lokale wijzigingen

1. Twee **identieke officiële covers in hogere kwaliteit** (640x640 JPEG, ongeveer 72 en 80 KB) zijn vanuit vooraf visueel geverifieerde openbare Spotify-bronbestanden lokaal opgeslagen, elk met een eigen bestandsnaam. De oude ongebruikte `src/assets/nhog-cover.jpeg` is niet gebruikt: die toont ander artwork dan de officiële release.
2. De vier gecontroleerde NEON-gerelateerde openbare opnamen krijgen feitelijke, specifieke beeldbeschrijvingen. De Hanging On-tekst zegt eerlijk dat de getoonde hoes de **NEON-albumhoes** is; er is geen niet-bestaand afzonderlijk artwork gefabriceerd.
3. Beat Drop, Neon House of Glass, Hanging On en That Spark hebben een eigen story-gedreven titel en description. De overige openbare SoundCloud-opnamen behouden hun gedocumenteerde status.
4. De bestaande officiële songpagina's krijgen een expliciete verbinding naar de NEON-albumwereld en drie korte perspectieven (I / You / It), aansluitend op de door Hans eerder aangeleverde vertelvorm. De twee openbare NEON-gerelateerde conceptopnamen krijgen ook een bescheiden drieperspectieven-uitleg, maar géén nieuwe albumpositie.
5. De twee echte singles verwijzen in `MusicRecording.inAlbum` naar dezelfde albumidentiteit die de albumbron gebruikt; `sameAs` gebruikt waar aanwezig een concrete Spotify-tracklink in plaats van de albumlink. Binnen de website blijft het album een ontwikkeling voor 2027, niet een voltooid Spotify-album.
6. De songpagina gebruikt binnen de NEON-wereld een subtiele donkere/violette achtergrond met de bestaande typografie, terwijl overige songpagina's ongemoeid blijven. Mobiele sectietabs passen binnen het scherm; alternatieve tekst, beeldfoutmelding, toetsbordfocus en 44px-bediening zijn toegevoegd.
7. De 'meer nummers'-sectie van de officiële singles kiest de **andere bekende single plus de albumroute**, niet willekeurige public SoundCloud-opnamen in arrayvolgorde.
8. **Niet gewijzigd:** de interactieve albumhoezen, 760ms-flip, versnelde negen regels, private SoundCloud-tokens, onbekende albumtitels, niet-bevestigde gear/stems, AI-gezichten of definitieve masterkeuzes.

## Uitgevoerde controles

- Gerichte Vitest-set: **3 testbestanden, 27 tests geslaagd**. Nieuwe regressies testen per officiële single beeldpad, specifieke alt/OG, eigen verhaal, albumroute, JSON-LD-koppeling en beeldfoutfallback.
- TypeScript: `npm run typecheck --workspace=@hans/personal` **geslaagd**.
- Volledige Vitest: `npm run test:personal` **57 testbestanden, 548 tests geslaagd**.
- ESLint: `npm run lint:personal` **nul fouten, 19 bestaande waarschuwingen**.
- Productiebuild: `npm run build:personal` **geslaagd**, 71 prerenderpagina's, SEO-guard 70 pagina's/27 controles, image-guard 71 pagina's/94 unieke beelden/0 fouten, bundle-guard **407 kB gzip** onder 425 kB budget.
- De twee optionele Artist Radar-varianten laden pas bij selectie, terwijl de standaard radar server-renderbaar blijft. Dit compenseert de nieuwe contentcode binnen het bestaande bundlebudget.
- De build genereerde een niet-gerelateerde sitemapdiff; deze automatisch gegenereerde wijziging is teruggedraaid, zonder overige wijzigingen te raken.
- Vier prerender HTML-bestanden zijn gelezen; elk bevat zijn bedoelde titel, meta description, OG-image en drie-perspectieven-verhaal.
- `git diff --check`: controleren voor de definitieve commit.
- Een visuele productie-screenshot toont alleen de **oude live versie**. De nieuwe lokale wijzigingen zijn niet automatisch in productie aanwezig.

## Grenzen en volgende stappen

- Bij **Hanging On** ontbreekt een afzonderlijk, door Hans goedgekeurd nummerbeeld; daarom is de bestaande albumhoes gehouden. Alternatieven vereisen een concrete assetselectie en, bij zijn gezicht of handen, een controle tegen zijn echte referentiebeelden.
- De vier private `NEON Official`-voorproefjes en hun tokens blijven in een **andere, niet-gepubliceerde** werkbranch. Deze story-/artworkbranch bevat die tokens niet. Er zijn geen openbare detailpagina's voor New Level of private Pressure toegevoegd.
- Hogere-resolutie officiële vierkante covers zijn bruikbaar als hero en OG. Er is nog geen apart door Hans goedgekeurd 1200x630-socialbeeld; platform-specifieke crops worden niet als geverifieerd voorgesteld.
- De lokale hoofd-SecondBrainVault, aangewezen lesseninbox en een bevestigde actuele manifestsync waren vanuit deze uitvoerroute niet schrijfbaar aangetoond. Geen concurrerende vault gemaakt; dit Git-versioned log bewaart de audit totdat geautoriseerde synchronisatie mogelijk is.
