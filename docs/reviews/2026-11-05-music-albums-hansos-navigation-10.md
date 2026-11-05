# HansOS review: muziek- en albumnavigatie (5 november 2026)

Status: broninspectie en implementatie op afzonderlijke PR-branch. Dit document registreert **tien gerichte reviewpassen met twintig vakperspectieven**, niet twintig zelfstandig aangeroepen agentprocessen of werkelijk gebruikersonderzoek.

## Afbakening en bronnen
- Huidige hoofdbranch van `jowikroon/hans-crafted-stories` op start: `29b31fbf19bf1f12ae93314fd6b3594cc3cca41c`.
- `apps/personal/src/pages/Music.tsx`, `AlbumShowcase.tsx`, `AlbumSleeve.tsx`, `MusicAlbum.tsx`, `MusicAlbumBrand.tsx`, `AlbumPageTemplate.tsx`, `albums.ts`, `albumEditorial.ts`.
- `docs/music-albums-concept.md`, `docs/music-albums-ux.md`, `docs/reviews/2026-11-05-iets-moois-narrative-50.md`.
- Tweede Brain boot: `START-HERE.md`, `AGENTS.md`, `HANSOS.md`, `claude.md`, `index.md`, `Command-Board.md`, en manifestcontrole. Relevante broninhoud kan na synchronisatie newer zijn dan root.

## Tien reviewpassen, twintig perspectieven
| Pass | Perspectief A / B | Gecontroleerd en besluit |
| --- | --- | --- |
| 01 | Semantische HTML / SEO | Op /music stond een H2 voor de H1. De bovenste albumkop is nu de H1, de voormalige kicker een alinea en de grote slogan een H2. |
| 02 | Nieuwe bezoeker / terugkerende luisteraar | Binnenkomst hoeft niet meer verplicht via de flip; de twee albumroutes staan ook als directe, benoemde links boven de covers. |
| 03 | Muziekliefhebber / conversie-UX | De route naar alle publieke nummers is één directe ankeractie, terwijl bestaande coverinteractie intact blijft. |
| 04 | Fan NEON / fan IETS MOOIS | De links onderscheiden twee openbare singles bij NEON van IETS MOOIS dat nog in ontwikkeling is. Geen unreleased titels genoemd. |
| 05 | Toetsenbord / screenreader | Native links, benoemde nav, focus-visible-rand, H1-hiërarchie en minimaal 48px klikhoogte. Werkelijke screenreaderproef nog te doen. |
| 06 | Mobiele telefoon / kleine tablet | Drie links lopen om en vormen op 540px of minder een verticale, volledige breedte-lijst. Fysieke apparaten nog niet getest. |
| 07 | Albumlezer / muziekzoeker | Beide albumtemplates hebben nu 'De muziek' in de hoofdstuknavigatie, met anker op de albumpagina en correcte route+hash vanuit de merkpagina. |
| 08 | Motion / toegankelijkheid | De goedgekeurde flip- en reduced-motion-afhandeling blijft ongewijzigd. Alleen subtiele hovertransities op links zijn toegevoegd. |
| 09 | Brandbewaker / privacy | Geen aangepaste covers, geen nieuwe typografie, geen onuitgebrachte muziek, geen database- of opslagmutaties. |
| 10 | Regressie / onderhoudbaarheid | Bestaande albumnavigatietest uitgebreid, nieuwe discovery-test toegevoegd. Uitvoering via CI en preview dient afzonderlijk bewezen te worden. |

## Gewijzigd
- `AlbumShowcase.tsx`: H1, toegankelijke directe album- en muzieknavigatie.
- `Music.tsx`: corrigeert hiërarchie zonder visueel ontwerp te wijzigen.
- `AlbumPageTemplate.tsx`: direct hoofdstuk 'De muziek'.
- `music-albums.css`: styling voor responsieve, voldoende grote links.
- `AlbumPageTemplate.test.tsx` en `AlbumShowcase.test.tsx`: nieuwe regressies.

## Controlegrenzen en releasepoort
De tekstvervangingen en bronafhankelijkheden zijn op gelijkheid gecontroleerd. Geen lokale terminal/build/browser gebruikt in deze chat. CI, preview en productiedeployment niet als geslaagd markeren zonder exacte run/deployment en uitslag. Niet zelfstandig claimen dat twintig agents parallel liepen. Artist Radar-PR #492 en songstory-PR #493 staan los van deze wijziging; niet automatisch combineren. Geen autorisatie- of contentpublicatie buiten de websitesource.
