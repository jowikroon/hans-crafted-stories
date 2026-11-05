# IETS MOOIS: review van het complete beeldverhaal

Datum: 5 november 2026. Status: **werkversie; eindbuild, samenvoeging en livecontrole nog open**.

De uitbreiding presenteert alle 15 verschillende aangeleverde beelden via vier hoofdstukken, neonknoppen en één overlay. Ieder beeld krijgt maximaal twee korte Nederlandse zinnen. Drie afbeeldingen met liedtitels blijven herkenbaar als volgordestudies.

Dit register volgt de gevraagde verdeling: **30 ontwerp- en bouwcontroles, 10 stresstests en 20 herstelcontroles**. Het zijn 60 afgebakende controles, uitgevoerd met verschillende methoden; geen 60 onafhankelijke gebruikersonderzoeken. **Gereed** betekent dat de genoemde methode is uitgevoerd, **deels** dat een expliciet onderdeel resteert, en **open** dat uitvoeringsbewijs nog ontbreekt.

## Bewijs en grenzen

- Laatste vastgelegde componentuitvoering: **25 tests geslaagd in 6,90 s** in Vitest/jsdom met MemoryRouter. Dit omvat grensbediening, retryfocus, bestaande afbeeldingslinks en twee overgenomen regressies voor late achtergrondcontrols, inert-opruiming en behoud van een al bestaande inert-status. Latere wijzigingen moeten opnieuw worden gecontroleerd.
- Native desktopcontrole op `7f94460`: Chromium, 1363×936 CSS-pixels, alle 15 beelden geladen. Deze controle vond 20 px onnodige verticale overflow en focusverlies bij een native uitgeschakelde eindknop. Hercontrole van de volledige pagina op `ebdc4e5` bij dezelfde afmetingen bevestigt nul interne overflow, behouden focus op beide grensknoppen en Escape naar de exacte opener met herstelde paginascroll.
- Responsive controle op `ebdc4e5`: het werkelijke component en de stylesheet in een tijdelijke, geïsoleerde browserfixture met vaste CSS-afmetingen. Dit controleert de componentlayout; het emuleert geen telefoon en bewijst geen volledig mobiele paginanavigatie.
- Gemeten afmetingen: 320×568, 360×640, 390×844, 768×1024, 1280×800 en 844×390. Overal bleef de documentbreedte binnen de viewport en waren sluiten en bladeren bereikbaar. De laatste landschapsmeting toonde nog een te hoog beeld; herstel en hercontrole volgen.
- Echte browserklik op opnieuw proberen bij 320×568 herstelde een fixture-afbeeldingsfout en hield focus op het benoemde beeldgebied. Dit was geen onderbroken productienetwerkverbinding.
- Historische productiebuild geslaagd: SEO-guard 70 pagina's; image-guard 71 pagina's, 83 unieke afbeeldingen en nul fouten; eager JavaScript 419 kB gzip bij een budget van 425 kB. De uiteindelijke samengevoegde bron is nog niet aan een nieuwe build gekoppeld.
- De expliciete volledige app-TypeScriptcontrole na de inert-aanvulling heeft dezelfde **255 bestaande diagnostieken** als de basisversie, met bytegelijke logs en nul nieuwe regels. Gerichte lint en diffcheck slagen. De volledige app-typecheck zelf blijft daarmee ongeslaagd; de bronkoppeling en uiteindelijke publicatiecontrole worden afzonderlijk vastgelegd.

De native browserwaarnemingen, responsive geometrie en foutherstel zijn afzonderlijk geregistreerd. Er is geen test met fysieke apparaten, Mobile Safari, een screenreader, echte browserzoom, OS-contrastvoorkeuren, netwerkvertraging of proefpersonen uitgevoerd. CSS-regels en gesimuleerde touch-events bewijzen die omstandigheden niet.

## A. Ontwerp en bouw: 30 controles

| Nr. | Controle | Methode en status | Uitkomst |
| ---: | --- | --- | --- |
| 01 | Opdracht en beeldrichting | Bronreview · gereed | De actuele aangeleverde IETS MOOIS-beelden bepalen de presentatie. |
| 02 | Plaats op de verhaalroute | Bronreview · gereed | Beeldverhaal na de korte hero; verhaaltekst blijft via een gewone link bereikbaar. |
| 03 | Bestaande navigatie | Bronreview · gereed | Het bestaande beeldenanker blijft `#album-world`, met één doel. |
| 04 | Herkenbare keuzes | Ontwerp/bronreview · gereed | Vier benoemde hoofdstukknoppen tonen miniatuur, titel en aantal beelden. |
| 05 | Dialoogbasis | Code-inspectie · gereed | Bestaande Radix-primitieven dragen de modale interactie. |
| 06 | Compositie en leestempo | CSS/bronreview · gereed | Volledige vierkante beelden, `object-fit:contain`, geen automatische beeldwissel. |
| 07 | Toetsenbordmodel | Ontwerp/bronreview · gereed | Zichtbaar sluiten, Escape, begrensd bladeren en focusherstel zijn uitgewerkt. |
| 08 | Geschiedenismodel | Ontwerp/bronreview · gereed | Openen voegt één stap toe; beeldwissels vervangen die stap en behouden query/hash. |
| 09 | Neon en leesbaarheid | Kleurberekening/CSS · gereed | Helder UI-violet onderscheidt tekst/focus van decoratieve gloed; contrastberekeningen zijn beoordeeld. |
| 10 | Mobiele opbouw | CSS-review · gereed | Sluiten en bladeren staan buiten het interne scrollvlak; dynamische hoogte en veilige randen zijn voorzien. |
| 11 | Aangeleverde bestanden | Bestandscontrole · gereed | Alle 20 PNG-bestanden zijn aanwezig en decodeerbaar. |
| 12 | Exacte duplicaten | Bestands- en pixelhashes · gereed | Vijf exacte herhalingen verwijderd; alle 15 verschillende beelden behouden. |
| 13 | Beeldinhoud | Visuele inspectie · gereed | Vijf portretten, vijf spiegelstudies, twee speelse beelden en drie volgordestudies beoordeeld. |
| 14 | Hoofdstukken en opener | Redactie · gereed | Verdeling 5/5/2/3; het portret met de jonge spiegeling vormt de uitnodiging. |
| 15 | Korte bijschriften | Redactie/validatie · gereed | Elk beeld heeft twee korte Nederlandse zinnen; hoofdstukintro's zijn beperkt tot één zin. |
| 16 | Voorlopige liedvolgorde | Datareview · gereed | Alle drie volgordebeelden benoemen een voorstel of studie. |
| 17 | Webexports | Encoding · gereed | Vijftien volledige WebP's van 1254×1254 en vijftien miniaturen van 320×320 gemaakt. |
| 18 | Exportkwaliteit | Visuele inspectie · gereed | Miniaturen en volledige hero-/volgorde-exports gecontroleerd op compositie en ingebakken letters. |
| 19 | Datakoppelingen | Programmatische validatie · gereed | Vijftien unieke IDs, dertig geldige paden, passende covers en correcte hoofdstukaantallen. |
| 20 | Integriteit en omvang | Hashes/decodering · gereed | Originelen ongewijzigd; exports opnieuw gedecodeerd. De dertig nieuwe assets tellen 2.738.262 bytes. |
| 21 | Route-integratie | Implementatie/bronreview · gereed | Alleen IETS MOOIS krijgt de module; bestaande verhaal- en luisteronderdelen blijven aanwezig. |
| 22 | Neonknoppen | Implementatie/CSS · gereed | Dunne violette accenten, duidelijke labels en een afzonderlijke zichtbare focusrand. |
| 23 | Overlaybediening | Implementatie/bronreview · gereed | Benoemde dialoog, sluiten, vorige/volgende, hoofdstukkeuze, miniaturen en teller aanwezig. |
| 24 | Labels bij beelden | Data/implementatie · gereed | Alttekst, titel, hoofdstuk en caption horen bij hetzelfde beeld; studies krijgen een voorstelmelding. |
| 25 | Directe afbeeldingslinks | Implementatie/bronreview · gereed | Geldige `beeld`-IDs openen de overlay; ongeldige waarden openen geen lege dialoog. |
| 26 | Bedieningsvormen | Implementatie/bronreview · gereed | Buttons, pijlen, Home/End, hoofdstukkeuze, miniaturen en horizontale touch-gebaren ondersteund. |
| 27 | Laden en fouten | Implementatie/bronreview · gereed | Preview, laadstatus, foutmelding en opnieuw proberen; sluiten en bladeren blijven beschikbaar. |
| 28 | Typografie en voorkeuren | CSS-review · gereed | Bestaande sitefonts behouden; eigen portaalkleuren, reduced-motion- en forced-colors-regels toegevoegd. |
| 29 | Gerichte regressietests | Vitest/jsdom · gereed | Laatste vastgelegde uitvoering: 25 geslaagde componenttests in 6,90 s; simulatiegrenzen staan in de testcode. |
| 30 | Productiebuildcheckpoint | Build/artefactcontrole · gereed | Historische build en guards geslaagd; dit is geen goedkeuring van de uiteindelijke publicatie. |

## B. Stresstests: 10 controles

| Nr. | Controle | Methode en status | Uitkomst of resterend werk |
| ---: | --- | --- | --- |
| 31 | Alle beelden en grenzen | jsdom/native desktop · gereed | Vijftien beelden doorlopen. Native 14→15 en Home→1 behouden de grens; Enter op beide grensknoppen verandert het beeld niet. |
| 32 | Focus insluiten en herstellen | jsdom/native desktop · gereed | Shift+Tab/Tab gecontroleerd. Hercontrole houdt Volgend/Vorig beeld gefocust met `aria-disabled=true`; Escape herstelt de exacte opener en paginascroll. |
| 33 | Herhaald openen en snel bladeren | jsdom · gereed | Twaalf open/selecteer/End/Home/sluit-cycli zonder extra history-opbouw of oude selectie. |
| 34 | Smalle portretweergave | Geïsoleerde browserfixture · deels | 320/360/390 px: geen horizontale overflow, bediening 44 px hoog. Lang hoofdstuklabel wordt verkort; hercontrole volgt. |
| 35 | Lage landscape en grote tekst | Browserfixture/CSS · deels | 844×390 hield bediening bereikbaar, maar het beeld was te hoog. Hercontrole en echte tekstvergroting ontbreken. |
| 36 | Bewegings- en contrastvoorkeuren | CSS/contrastreview · gereed | CSS- en contrastreview afgerond; werkelijk door OS-voorkeuren gestuurd rendergedrag is niet getest. |
| 37 | Beeldfout, retry en cache | jsdom/browserfixture · gereed | Opnieuw proberen herstelt het beeld en behoudt focus; sluiten en verder bladeren blijven beschikbaar. |
| 38 | Back/Forward en directe links | MemoryRouter/native desktop · gereed | Eén geschiedenisstap; Back sluit, Forward heropent. Vier bestaande afbeeldings-IDs hebben regressietests. |
| 39 | Touch-gebaren onderscheiden | Gesimuleerde events · gereed | Horizontale swipe werkt; verticale, korte, gecancelde, multitouch- en ingezoomde gebaren wisselen niet. |
| 40 | Achtergrond en consent | Native desktop/jsdom · deels | Achtergrondisolatie uit main overgenomen; twee tests dekken late controls, close/unmount en eerdere inert-status. Finale native inert-hercontrole volgt. |

## C. Herstel en eindcontrole: 20 controles

| Nr. | Controle | Methode en status | Uitkomst of resterend werk |
| ---: | --- | --- | --- |
| 41 | Benoemde hoofdstukgroep | Wijziging/bronreview · gereed | De dialoogopeners vormen nu een benoemde groep. |
| 42 | Volledige collectie herkenbaar | Wijziging/bronreview · gereed | “Alle 15 beelden” maakt doorbladeren buiten het gekozen hoofdstuk expliciet. |
| 43 | Scroll na beeldkeuze | jsdom/browserfixture · gereed | Selectie herstelt interne scroll naar nul; ook waargenomen bij 320 px. |
| 44 | Focus vanuit de miniaturen | jsdom/browserfixture · gereed | Selectie brengt focus naar het benoemde beeldgebied; vaste bladerknoppen behouden hun focus. |
| 45 | Actieve miniatuur herselecteren | jsdom · gereed | Opnieuw kiezen van hetzelfde beeld herstelt focus en interne scroll. |
| 46 | Stabiele laadcallback | Code-inspectie · gereed | De ready-callback blijft stabiel zolang de geselecteerde afbeeldings-ID gelijk blijft. |
| 47 | Sluiten en scrollherstel | jsdom/native desktop · gereed | Escape geeft focus terug aan de opener; leespositie en eerdere scrollRestoration worden hersteld. |
| 48 | Direct-linkexit en oude IDs | MemoryRouter · gereed | Sluiten behoudt overige query/hash; vier eerdere IDs blijven ondersteund zonder extra geschiedenisstap. |
| 49 | Status van volgordestudies | Data/DOM-validatie · gereed | Alle drie volgordebeelden tonen hun voorlopige karakter in data en overlay. |
| 50 | Captioncontract herlezen | Redactie/DOM-tests · gereed | Alle captions voldoen aan maximaal twee zinnen; titel, beeld en tekst blijven gekoppeld. |
| 51 | Publiekscopy beoordelen | Bronreview · gereed | Tekst gaat over de zichtbare beelden en ontwerpprincipes; er worden geen nieuwe releaseclaims toegevoegd. |
| 52 | Exportintegriteit herhalen | Hashes/decodering · gereed | Originelen, uitvoermaten en alle dertig exports opnieuw gecontroleerd. |
| 53 | Gebouwde assets vergelijken | Artefact-hashes · gereed | Alle dertig bron- en dist-bestanden zijn bytegelijk op het gecontroleerde buildcheckpoint. |
| 54 | Gesloten overlay licht houden | jsdom/bronreview · gereed | Gesloten pagina bevat alleen hero en vier ingangsminiaturen; de volledige overlay is niet gemount. |
| 55 | Voorladen begrenzen | Code-inspectie · gereed | Alleen het volgende beeld na ready; Save-Data en een verborgen document stoppen voorladen. Geen gemeten netwerkprofiel. |
| 56 | Foutherstel in echte layout | Browserfixture · gereed | Bij 320×568 herstelde native retry het beeld; figuurfocus, scroll nul en bereikbare sluit-/navknoppen waargenomen. |
| 57 | Compositie na layoutfixes | Native desktop/browserfixture · deels | Volledige pagina 1363×936 en fixture 1280×800 hebben nul interne overflow; korte landscape en het verkorte hoofdstuklabel wachten op hercontrole. |
| 58 | Definitieve build en guards | Eindcontrole · open | Historische build groen; nieuwe build van de samengevoegde bron, zonder openbare reviewfixture, moet nog slagen. |
| 59 | Finale lint, diff en typecheck | Uitvoering/vergelijking · gereed | Gerichte lint/diff exit 0 en 25 tests geslaagd; expliciete appcontrole na inert-aanvulling bytegelijk baseline: 255 bestaande diagnostieken, nul nieuwe. |
| 60 | Definitieve preview en publicatie | Eindcontrole · open | Hoofdbranch reconciliëren, verse CI/CodeQL controleren, merge/deploy bevestigen en alle vijftien beelden op de productieroute nalopen. |

## Inspecteerbare bron en vervolg

De implementatie staat in [AlbumVisualStory.tsx](../../apps/personal/src/components/music/AlbumVisualStory.tsx), de inhoud in [albumVisualStory.ts](../../apps/personal/src/data/albumVisualStory.ts), de presentatie in [album-visual-story.css](../../apps/personal/src/styles/album-visual-story.css) en de regressies in [AlbumVisualStory.test.tsx](../../apps/personal/src/components/music/AlbumVisualStory.test.tsx). [MusicAlbumBrand.tsx](../../apps/personal/src/pages/MusicAlbumBrand.tsx) bepaalt de route-integratie.

De eerdere vier-beeldenreview blijft als geschiedenis behouden. Bestaande afbeeldings-URLs en de vier directe beeldlinks moeten na de uitbreiding blijven werken. De aanvullende achtergrondisolatie uit de inmiddels samengevoegde versie is overgenomen en met twee regressietests gecontroleerd; de native eindhercontrole blijft afzonderlijk open.

Voor afronding worden de open en gedeeltelijke regels bijgewerkt op basis van de feitelijke einduitvoering. De tijdelijke browserfixture en haar bundels horen niet in de publicatie. Een geslaagde previewdeploy vervangt geen geslaagde CodeQL-resultaatcheck of controle van de uiteindelijke productiepagina.
