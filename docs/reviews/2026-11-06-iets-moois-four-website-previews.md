# IETS MOOIS: vier websitepreviews, twaalf geplande nummers

Datum: 2026-11-06. Taak: maak uitsluitend de eerste vier nummers uit de private SoundCloud-playlist `NEON | NL Signals` hoorbaar op de albumpagina van `IETS MOOIS` en communiceer het nieuwe albumtotaal van twaalf. Dit document is een implementatie- en controlespoor, geen openbare releaseaankondiging.

## Bronnen en uitgangspunten

- Opdracht van Hans op 2026-11-06: eerste vier uit de opgegeven playlist, albumtotaal twaalf, vijf agents voor tien kritische rondes.
- Live SoundCloud-playlist en afzonderlijke `Delen > Insluiten`-dialoog, gecontroleerd met toegang tot de playlist. De eerste vier bronopnamen zijn `N = 1` (track-ID 2430066333), `Mijn opa weet allles` (2356544483), `Allerkleinste Dingen` (2341348067) en `Hypnotisch` (2431200012). Alle vier waren privé; de laatste had een expliciete niet-definitiefvermelding. De websitenaam van de tweede opname is typografisch genormaliseerd tot `Mijn opa weet alles`.
- HansOS-vault-back-up, bootsources en relevante Jowikroon-muziekinstructies ingezien op 2026-11-06. Bron: `jowikroon/hansos-vault-backup`, hoofdcommit bij eerste raadpleging `46a3541` (2026-11-06 14:42 UTC); root-manifest en relevante incoming-items gecontroleerd. De back-up is geen bevestiging dat de lokale SecondBrainVault gesynchroniseerd is en is niet beschreven.
- Websitebron: `jowikroon/hans-crafted-stories` (`main` bij start `24c53dc`); projectcontract `docs/music-album-motion-contract.md`, `AGENTS.md`, `CLAUDE.md`. Een andere open IETS MOOIS-verhaal-PR is niet aangepast.

## Besluiten en wijzigingen

1. Er zijn **vier individuele private trackwidgets**, niet een embed van de volledige playlist met meer opnamen.
2. Widgets en externe providerscripts laden pas op afspeelactie. De oorspronkelijke SoundCloud-private token is onderdeel van de embed en is daardoor **niet geheim voor bezoekers**. Bezoekers kunnen de opnamen via de gedeelde link ook buiten de website openen. Dit is geen DRM of exclusieve websiteautorisatie.
3. De pagina noemt de vier opnamen **websitepreviews**, nooit officiële singles of definitieve masters. `Hypnotisch` draagt het label `Werkversie · niet definitief`.
4. Het album bevat **twaalf geplande posities**. Posities 05-12 blijven zonder publieke titel of speler, behalve voor expliciet ingelogde eigenaarsgegevens. Metadata voor officiële releases blijft leeg.
5. De bestaande IETS MOOIS-hoes, 760ms-flip, geanimeerde vijf anonieme hoesregels en albumverhaal blijven intact. De publieke albumpagina toont apart vier luisterbare regels en acht rustige, anonieme plekken.
6. De privacyverklaring noemt de externe SoundCloud/Spotify-spelers en het laden na een klik.

## Vijf gespecialiseerde controles, elk tien beoordelingsrondes

| Lens | Gevalideerd of bijgesteld |
| --- | --- |
| Playlist- en broncontrole | Juiste volgorde, vier individuele IDs en embedparameters, privacy, nonfinal-status van vierde opname. |
| Sitearchitectuur | Correcte actieve repository, hergebruik van bestaande `MusicPlayer`, scheiding tussen websitepreview en uitgebrachte tracks, vermijden van open PR. |
| Storytelling en UX | Vier helder afspeelbare regels en acht stille vervolgposities; minimale warme albumstijl zonder volledig herontwerp. |
| Toegankelijkheid en QA | Afspeelknoppen en labels, status/stop/sluiten, één speler tegelijk, mobiele grids, bestaande sleeve- en regressieguard. |
| Publicatie en risico | Geen volledige playlist, geen vroegtijdige releases, SoundCloud-deelbaarheid transparant, exacte CI en productiecontrole vereist. |

Dit zijn beoordelingsrondes, geen claim van vijftig onafhankelijke bezoekers- of schermlezerstests.

## Uitgevoerde checks voor release

- `npm run typecheck --workspace=@hans/personal`: geslaagd.
- Gerichte Vitest-set voor previews, albumdata en hoes: twaalf tests geslaagd.
- Volledige `npm run test:personal`: **57 testbestanden, 542 tests geslaagd**.
- `npm run lint:personal`: nul fouten; alleen bestaande waarschuwingen.
- `npm run build:personal`: geslaagd, 71 pagina's, 94 afbeeldingen, nul buildfouten.
- `git diff --check`: geslaagd.
- Het door de build herschreven, niet-gerelateerde sitemapbestand is teruggezet; geen andere bestaande gebruikerswijzigingen weggegooid.

## Grenzen en vervolg

- De vier embeds zijn in een ingelogde SoundCloud-sessie bekeken. Audio in een volledig **niet-ingelogde** sessie, mobiele browser en fysieke screenreader is nog niet onafhankelijk bevestigd; productiewidgetcontrole blijft nodig.
- GitHub CI, PR-merge en Vercel-READY moeten nog met hun exacte commit en tijd worden geregistreerd. De build alleen is geen bewijs van live publicatie.
- De primaire lokale SecondBrainVault en de aangewezen HansOS-inbox zijn vanuit deze sessie niet schrijfbaar bevestigd. Geen alternatieve vault gemaakt; deze versiebeheerlog bewaart de uitvoeringsverantwoording, de contextinbox moet bij beschikbaarheid worden bijgewerkt.
- Bij latere definitieve masters of albumvolgordewijzigingen eerst nieuwe expliciete autorisatie verkrijgen voor publiek maken; privé-URL's kunnen na publicatie alleen door een SoundCloud-secret-reset onbruikbaar gemaakt worden.
