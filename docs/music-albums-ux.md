# Albumhoezen: tien UX-toepassingen

Datum: 3 november 2026. Status: lokaal uitgevoerd, nog niet gepubliceerd of door bezoekers getest.

De twee DEF-covers blijven exact zoals Hans ze heeft gekozen. De voorkant bestaat uitsluitend uit de vierkante cover. Teksten, releases en navigatie staan op een digitale achterkant binnen hetzelfde vierkant. Dit is een interactieontwerp voor de website, geen nieuw goedgekeurd drukbestand voor de fysieke achterkant.

## Onderbouwing en reikwijdte

BJ Foggs eigen model beschrijft gedrag als het samenkomen van motivatie, ability (gemak/haalbaarheid) en een prompt. De tien toepassingen hieronder zijn onze ontwerpvertaling naar deze albumsite, geen door Fogg gepubliceerde top tien. [Fogg Behavior Model](https://www.behaviormodel.org/home)

Recente specifieke studie: Jang en Park, gepubliceerd 11 februari 2026, onderzochten 100.940 CashWalk-reviews uit 2017–2025. Het beschikbare abstract koppelt intuïtieve bediening en technische stabiliteit aan gebruikerservaring en bespreekt motivatie. Dit is een analyse van reviews van een gezondheidsapp, geen experiment met albumhoezen. Het ondersteunt de ontwerpkeuze om gemak en een betekenisvolle ontdekking centraal te zetten; het bewijst geen conversie-effect voor deze site. Het abstract en de publicatiegegevens waren toegankelijk; de volledige tekst niet. [Jang & Park, 2026](https://www.tandfonline.com/doi/abs/10.1080/10447318.2026.2623220)

Als aanvullende context is de scoping review van Duarte-Anselmi et al. van 14 oktober 2025 geraadpleegd. Ook deze gaat over gezondheidsinterventies, niet muziekwebsites. Er wordt daarom geen wetenschappelijke effectgrootte voor dit ontwerp geclaimd en evenmin dat dit een volledige inventaris van alle nieuwste publicaties is. [Review, 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12522219/)

## De tien toepassingen

| # | Toepassing in deze site | Gedachte en concrete uitwerking |
|---|---|---|
| 1 | Het beeld nodigt uit | Motivatie: de goedgekeurde hoes staat volledig in beeld. Geen badges of extra tekstvlakken onder de cover. |
| 2 | De hele hoes is de knop | Ability: één grote klikzone, zonder precisiewerk of extra tussenstap. |
| 3 | Een begrijpelijke uitnodiging | Prompt: boven de albums staat “Pak een hoes. Draai ’m om.” Hover en toetsenbordfocus tonen “Draai om”; op touch is de hint direct zichtbaar. |
| 4 | Hover bevestigt interactie | Binnen 140–160 ms verschijnt de hint; een subtiele lichtlaag, schaduw en 1,5 graad kanteling laten de hoes aanraakbaar voelen. |
| 5 | Indrukken voelt direct | De cover schaalt bij indrukken naar 98,5%, met 80 ms overgang. Een actie krijgt meteen visueel antwoord. |
| 6 | Een herkenbare beweging | Klikken draait de hoes in 440 ms om, met rustig afremmen. De kaart houdt zijn vaste vierkante ruimte. |
| 7 | Ontdekken is de beloning | Op de achterkant: de albumwereld, de twee echte NEON-releases en COMING 2027. De inhoud is de beloning; privétracknamen worden niet naar de publieke browser gestuurd. |
| 8 | Eén duidelijke vervolgstap | De contrasterende albumknop leidt naar het hele album; de twee beschikbare releases hebben herkenbare links. Eén achterkant tegelijk voorkomt extra drukte. |
| 9 | Terugdraaien blijft eenvoudig | Een terugknop van 44 × 44 px en Escape brengen de cover terug. Toetsenbordfocus volgt de zichtbare kant en wordt hersteld. |
| 10 | Dezelfde ontdekking voor iedereen | Klik, tik, Enter en Spatie werken. Verborgen kanten zitten niet in de tabvolgorde. Met verminderde beweging wisselt de hoes direct, zonder draaien of kantelen. |

Timing en easing zijn ontwerpkeuzes binnen de richtlijnen voor korte, betekenisvolle interactiefeedback; 440 ms is gekozen voor de grote draaiing, niet als wetenschappelijk optimum. [Nielsen Norman Group, 9 februari 2020](https://www.nngroup.com/articles/animation-duration/)

De terugknop en actieve achterzijde-links zijn minimaal 44 px hoog. WCAG 2.2 AA noemt 24 × 24 px als minimum met uitzonderingen; hier gebruiken we ruimere doelen. De voorkeur voor verminderde beweging wordt gerespecteerd. Dit is geen volledige WCAG-audit van de hele site. [W3C: aanraakdoelen](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [W3C: beweging uit interacties](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Verificatie

Het controledossier staat op Shadow in `D:\ShadowPC\work\music-albums-concept-2026-11-03\`: `ux-check.cjs`, `ux-check.json` en de `ux-*.png` beelden. De uiteindelijke uitslag wordt na de controles in de vaultoverdracht vastgelegd. Technisch werkende interactie is nog geen gemeten bezoekersvoorkeur. Een vervolgstap bij echte bezoekers is toetsen of zij het omdraaien herkennen, de releases vinden en zonder uitleg terugkeren.

## Bronnen in SecondBrainVault

- `raw/2026-11-03-albumcovers-def/BESLUIT.md` en de twee DEF-PNG-originelen.
- `raw/2026-11-03-neon-iets-moois-herziening/NEON-Brandguide-bewerkbaar.md` en `IETS-MOOIS-Brandguide-bewerkbaar.md`: merkcontext; eerdere coverkeuzes zijn door het DEF-besluit vervangen.
- De al bestaande scheiding tussen publieke albums en privéverhalen/brandguides blijft gelden. De databasekoppeling voor de eigenaar is nog een apart openstaand implementatiepunt.

## Later artwork and motion update

The latest user request replaces the NEON front/back pair and adds full-art backs with editable track overlays to both albums. The slow-to-fast title reveal is specified in [Final artwork and editable track reveal](music-album-artwork-reveal.md). The earlier plain digital backs are historical. Front artwork stays intact; only backside raster lettering is removed in generated derivatives.
