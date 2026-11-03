# Muziek op de pagina: afspelen en songpopups

Datum: 3 november 2026. Status: lokaal gebouwd en gecontroleerd; niet gepubliceerd.

## Wat er nu werkt

Alle negen publieke nummers op /music hebben een directe afspeelknop. De twee uitgelichte releases, de muzieklijst en de vrijgegeven albumtracks gebruiken dezelfde bediening. Er is maximaal één actieve muziekspeler per pagina. Een ander nummer kiezen, filteren, naar een andere pagina gaan of een songpopup openen ruimt de vorige speler op. Een popup begint zonder automatische muziek. Daar staat een eigen afspeelknop voor het geopende nummer.

De grote, altijd zichtbare knop “Songpagina” opent de bestaande volledige songinhoud als donkere popup. Ook de titels en vrijgegeven nummers op de albumachterkanten openen die popup. Notities, proces, credits, beschikbare lyrics en bronlinks komen uit dezelfde MusicSong-component als de zelfstandige pagina. De popup schrijft geen nieuwe canonical of paginatitel over de onderliggende pagina. Een link onderaan opent de zelfstandige songpagina.

De popup gebruikt dezelfde Radix Dialog-basis als de portal: focus binnen de popup, Escape/sluitknop, afgeschermde achtergrond en terugkeer naar de oorspronkelijke knop. De query ?song=slug ondersteunt direct openen en browser-terug/vooruit. De positie van de oorspronkelijke knop blijft bij sluiten behouden, ook als een afbeelding achter de popup nog geladen is. Een gesloten inline speler geeft focus terug aan zijn afspeelknop.

## UX-keuzes

- Afspeel- en songpaginaknoppen zijn minimaal 48 pixels hoog en blijven zichtbaar op touchscreens.
- Op mobiel staat de songpaginaknop onder de titel. Genre, provider en datum lopen over meerdere regels; er verdwijnt geen essentiële actie bij een smaller scherm.
- Donkere popup met Switzer, zacht paars accent, vaste sluitknop en één eigen scrollvlak. Op kleine telefoons vult de popup het scherm; veilige schermranden worden meegenomen.
- Subtiele hover/drukfeedback. Reduced motion schakelt de popupanimatie en bewegende knopfeedback uit.
- “Speelt nu” en pauzestatus komen uit echte Spotify-/SoundCloud-events. Een klik alleen is geen bewijs van afspelen. De decoratieve waveform beweegt uitsluitend bij een gemelde afspeelstatus.
- Spelers en hun scripts worden pas na de afspeelactie geladen; nul muziekiframes bij het openen van /music.
- Bij een geblokkeerde speler: begrijpelijke foutstatus, opnieuw proberen en de originele providerlink. Geen schijnbaar spelende toestand.
- Genrechips zijn filterknoppen met aria-pressed, geen onvolledig uitgewerkte tabs.
- De eerdere lege deelknoppen op songpagina's hebben nu echte trackgebonden LinkedIn-, X- en permanente links.

## Review 1: echte providers, volledigheid en toegang

Alle negen nummers startten in Chrome via de siteknop en konden worden gepauzeerd en hervat. Bij alle zeven SoundCloud-nummers is ook een oplopende afspeelpositie gemeten. Bij Spotify zijn afspeelstatus en pauze/hervatten via de officiële widgetevents bevestigd. Spotify toonde in de uitgelogde test de eigen Preview-aanduiding. Dit is een controle van bediening en afspeelvoortgang, geen akoestische kwaliteitsbeoordeling.

Negen songpopups gecontroleerd op juiste titel, volledige bestaande inhoud, ongewijzigde paginametadata en terugkerende focus. Vier schermbreedtes: 320, 390, 768 en 1440 pixels. Honderd Tab-stappen bleven binnen de geopende popup. Ook de albumroute en de minimumgrootte van de lijstknoppen gecontroleerd.

Gevonden en hersteld: een decoratieve coverlaag onderschepte klikken; een afgekoppelde SoundCloud-iframe kon tijdens opruimen een postMessage-fout geven; bestaande CSS maakte mobiele metadata te breed en songknoppen te grijs; de cookiemelding lag boven de popup. De uiteindelijke popup ligt boven paginawidgets en houdt de focus bij de zichtbare inhoud.

Review1-results.json bewaart tevens vijf generieke “signal is aborted without reason”-meldingen uit de ronde met externe embeds. De exacte herkomst is niet geclassificeerd; alle functionele controles slaagden. De latere echte mobiele afspeelcontrole gaf geen browserfouten. Dit dossier claimt dus geen foutloze werking van alle externe providerinternals.

## Review 2: herhaling en storingen

De tweede ronde gebruikt gecontroleerde providervervangers om vertraging en storingen reproduceerbaar te maken. Dit is apart van de echte afspeelcontrole hierboven.

- 36 snelle nummerwissels: nooit meer dan één muziekiframe.
- 20 popupcycli met afspelen, Escape en sluitknop: geen achterblijvende muziekiframe.
- Browser-terug/vooruit, een rechtstreeks geopende songquery en filterwissels gecontroleerd.
- Geblokkeerd SoundCloud-script, herstel en opnieuw proberen gecontroleerd.
- Vertraagd Spotify-script na annuleren en overstappen naar SoundCloud: geen oude speler die alsnog verschijnt.
- 320/390/768/844/1440 pixels, inclusief landschap en reduced motion: geen afgesneden metadata of horizontale popupoverflow.

De eerste stressronde vond ontbrekende focusterugkeer na het sluiten van de inline speler. Die is in de laatste optimalisatie hersteld. De herhaalde ronde eindigde met nul bevindingen en nul browserfouten. Een aanvullende Chrome-touchtest bevestigde echte SoundCloud-start, focusterugkeer, behoud van de schermpositie van de aangeklikte knop en een bruikbare liggende popup. De test meet de knoppositie op het moment van activering; browserautomatisering kan vóór de klik zelf naar het element scrollen.

Dit zijn twee technische UX-reviewrondes, geen onafhankelijke bezoekersstudie, volledige toegankelijkheidscertificering of fysieke Safari/iPhone-test.

## Bouwcontrole

18 bestaande tests voor albumdata, toegang en muziek geslaagd. Typecheck en gerichte lint zonder fouten of waarschuwingen. Clientbuild, serverbuild en prerender geslaagd. SEO: 62 pagina's. Beeldcontrole: 63 pagina's / 71 unieke beelden, nul fouten en nul netwerkmeldingen. Publieke webrootcontrole geslaagd voor bron en distributie. Initiële JavaScriptbundel: 421 kB gzip, binnen de bestaande grens van 425 kB. Geen IndexNow-ping, deployment of release uitgevoerd.

## Grenzen van providers

De site bedient de officiële embeds en omzeilt geen providerrechten. Spotify kan afhankelijk van account, browser en providerbeleid een preview aanbieden. Browsers kunnen een extra tik in de native speler nodig hebben voordat audio wordt toegestaan. De zichtbare native speler en bronlink blijven hiervoor beschikbaar. Langdurige uitval van Spotify/SoundCloud kan deze site niet oplossen. Ongepubliceerde albumtitels en volledige private brandguides zijn niet aan publieke gegevens toegevoegd.

## Bronnen en continuïteit

Gelezen voor deze voortzetting: D:\ShadowPC\VAULT-START.md, D:\SecondBrainVault\raw\2026-11-03-dark-album-template-brand\IMPLEMENTATIE.md en de actuele sitecode voor muziek, albumhoezen, songpagina's en portal Dialogs. De coverkeuze uit raw/2026-11-03-current-final-neon-back-overlays blijft leidend. Laatst in deze werksessie geverifieerde GitHub-main: 4ec405e5096cfa573406ae5feb9afa90e235a94c (3 november 2026, 17:24:19 UTC); geen claim dat deze nieuwe lokale wijziging al is gesynchroniseerd.

Officiële technische bronnen, geraadpleegd tijdens deze taak:
- https://developer.spotify.com/documentation/embeds/references/iframe-api
- https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
- https://developers.soundcloud.com/docs/api/html5-widget

Implementatie: apps/personal/src/components/music/MusicExperience.tsx, MusicPlayer.tsx, styles/music-experience.css en integraties in Music, MusicAlbum, AlbumSleeve en MusicSong. Bewijs en de lokaal uitvoerbare reviewscriptjes staan bij dit dossier. Originele werkmap: D:\ShadowPC\work\music-albums-concept-2026-11-03. Lokale raw-opslag en een kopie in D:\ShadowPC\vault-inbox zijn gecontroleerd; ontvangst op andere apparaten is niet vastgesteld.
