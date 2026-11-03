# Donker albumtemplate en merkverhalen

Datum: 3 november 2026. Lokaal geïmplementeerd; niet gepubliceerd.

## Gedeeld template

`AlbumPageTemplate` is de gedeelde donkere pagina-opzet voor elk album en de bijbehorende merkpagina: broodkruimel, albumwisselaar, hoofdstuknavigatie, inhoudsruimte en footer. De albuminhoud en de merkverhalen gebruiken hetzelfde template.

- Basis beide albums: ink `#080A0B`, inclusief de buitenste main-container.
- NEON: krijtwitte tekst met het bestaande paarse accent.
- IETS MOOIS: warme lichte tekst, ingetogen groen in de achtergrond en een zacht warm accent. Het eerdere lichte papier is vervangen voor deze websitepresentatie.
- De goedgekeurde front/back-art blijft ongewijzigd. Switzer en JetBrains Mono blijven de websitefonts.

## Pagina's

- `/music/albums/neon-the-signal-between`
- `/music/albums/neon-the-signal-between/brand`
- `/music/albums/iets-moois`
- `/music/albums/iets-moois/brand`

De nieuwe pagina's heten voor bezoekers “Het verhaal”. Elke verhaalpagina bevat een persoonlijk vertrekpunt, de oorsprong, drie emotionele betekenissen van de beeldwereld, het maakproces in drie stappen en een terugkeer naar de muziek. Albumhoofdpagina's bevatten een kortere emotionele introductie, een verhaalverwijzing en hetzelfde procesblok.

NEON: gehoord willen worden, de druk van het beeld en de weg naar luisteren en verbinding. IETS MOOIS: woorden zoeken in de eigen taal voor gemis, spijt, liefde en doorgaan. De belofte aan opa is afkomstig uit de gelezen actuele verhaalbronnen. Procescopy beschrijft de richting en het werk in wording; zij claimt geen afgeronde opnames of masters.

## Uitbreiden met een volgend album

1. Voeg de publieke albumidentiteit, actuele hoesbestanden en vrijgegeven trackposities toe aan `src/data/albums.ts`.
2. Voeg de openbare emotionele vertaling toe aan `src/data/albumEditorial.ts`: intro, kern, kop, openingsalinea, verhaal, beeldbetekenis, drie processtappen en slot. De slug moet overeenkomen met het album.
3. De gedeelde routes en prerender genereren album en merkpagina uit deze data. Registreer beide URL's ook in de sitemapgenerator en de fallback-sitemap.
4. Houd ongepubliceerde titels en volledige brandguides buiten publieke bronbestanden. Gebruik hiervoor uitsluitend de bestaande eigenaarroute met serverautorisatie.
5. Controleer beide routes, hoesinteractie, metadata, navigatie, kleine schermen en de publieke/privéscheiding.

Belangrijkste componenten: `AlbumPageTemplate`, `AlbumSleeve`, `AlbumEditorialSections` en `AlbumProcess`. `MusicAlbum` en `MusicAlbumBrand` leveren hun eigen inhoud aan het gedeelde template. Er is geen nieuwe CMS-koppeling gemaakt.

## Bronnen en grenzen

Gelezen: VAULT-START; het actuele final-artwork-besluit in `raw/2026-11-03-current-final-neon-back-overlays/BESLUIT.md`; de volledige bewerkbare NEON- en IETS-MOOIS-brandguides uit `raw/2026-11-03-neon-iets-moois-herziening`. Hun oudere coverkeuzes en lichte websitevoorstel zijn door latere gebruikerskeuzes vervangen. Huidige GitHub-main gecontroleerd: `4ec405e5096cfa573406ae5feb9afa90e235a94c`, 3 november 2026 17:24:19 UTC; dit bewijst geen synchronisatie van deze nieuwe lokale wijzigingen.

De nieuwste opdracht autoriseert de emotionele vertaling op de lokale merkpagina's. De volledige ruwe brandguides, privénotities en ongepubliceerde titels blijven afgeschermd. De bestaande productie-databasekoppeling voor de eigenaar is nog niet ingericht; deze taak verandert dat niet. Geen nieuwe autobiografische gebeurtenissen, opnamefeiten of releaseclaims toegevoegd.

## Controle

12 browsercombinaties: vier routes op1440/390/320pixels. Donkere innerlijke en buitenste achtergrond, geladen beelden, éénh1, drieprocesstappen, juistecanonical, geenoverflow, geen privétracknamen, werkendehoezen en onderlingelinks. Visuelecontrole desktop en mobiel uitgevoerd.18 bestaande album/toegang/muziektests geslaagd, typecheck en gerichte lint geslaagd. Client/server/prerendergeslaagd; SEO62pagina's, beeldcontrole63pagina's71beelden zonderfouten; bundel418kBgzip onder425kB.

Bewijs: `D:\ShadowPC\work\music-albums-concept-2026-11-03\dark-albums-check.json` en `dark-*.png`. Technische controles zijn geen bezoekersstudie of artistieke goedkeuring. Lokale opslag in SecondBrainVault is geverifieerd; publicatie en ontvangst opandere apparaten zijn niet uitgevoerd/geclaimd.
