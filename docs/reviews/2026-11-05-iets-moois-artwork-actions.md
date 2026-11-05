# IETS MOOIS: artwork openen en delen

Datum: 5 november 2026. Vervolg op de gepubliceerde galerie en de eerdere 30 aanvullende UX-reviewrondes. Dit vervolg voegt twee concrete beeldacties toe; het presenteert de controles niet als extra gebruikersonderzoek of een nieuw aantal feedbackrondes.

## Resultaat en keuzes

Onder het bestaande bijschrift staan twee rustige, benoemde acties:

- **Bekijk groot** opent de bestaande volledige WebP in een nieuw tabblad. De browser verzorgt de afbeeldingsweergave; de galeriepositie blijft behouden.
- **Kopieer beeldlink** schrijft alleen de canonieke publieke URL met het geselecteerde `beeld` en `#album-world`. Campagneparameters, andere querywaarden, previewdomeinen en toegangsgegevens worden niet meegenomen.

De succesmelding verschijnt uitsluitend wanneer de clipboardbelofte slaagt. Bij ontbrekende of geweigerde clipboardtoegang verschijnt een gelabeld, alleen-lezen URLveld voor handmatig kopiëren. Dit veld wordt alleen automatisch geselecteerd wanneer de kopieerknop nog focus heeft. Een laat resultaat van een vorig beeld kan het huidige beeld of een gesloten dialoog niet bijwerken. Een lopende actie wordt niet dubbel gestart.

Alle 15 afbeeldingen, vier hoofdstukken en bestaande bijschriften zijn behouden. Bijschriften blijven maximaal twee zinnen. Er is geen nieuwe dependency, eigen zoommodal of extra beeldbestand toegevoegd.

## UX-correcties tijdens verificatie

1. Pijl-, Home- en End-navigatie vanaf een verdwijnende beeldactie verplaatst focus naar het blijvende benoemde figuur. Het handmatige URLveld behoudt zijn normale teksttoetsen.
2. Touchbewegingen vanuit de actiezone starten geen galleryswipe. Daarmee kan handmatige tekstselectie niet onbedoeld het beeld vervangen.
3. De extra captionhoogte veroorzaakte bij 568 × 320 een echte previewregressie: het artwork eindigde op 284,875 px terwijl de vaste footer op 252 px begon. `align-self:start` in landscape herstelt de zichtbaarheid: artworkonderkant 236 px, footerstart 252 px. Bij 844 × 390 zijn dat respectievelijk 274 en 313 px.
4. Het handmatige URLveld gebruikt 16px-tekst; knoppen hebben minimaal 44px-hoogte en ombreekbare labels. Een gereserveerde statusregel voorkomt verspringing bij normale kopieerfeedback.

## Uitgevoerde controles

Functionele verificatie op `f00522a781326c97df177d785d329862dd0178e6`:

| Controle | Resultaat |
| --- | --- |
| Volledige personal Vitest-suite | 513 geslaagd, 50 bestanden, 0 mislukt |
| Galeriecomponent | 37 geslaagde tests |
| Nieuwe beeldacties | 15 geslaagde tests |
| Personal ESLint | 0 fouten, 19 bestaande waarschuwingen |
| Standaard typecheck | Geslaagd |
| Expliciete app-tsc | 255 bestaande diagnostics; 0 toegevoegd of verdwenen |

De expliciete compileruitvoer is byte-identiek aan de eerdere baseline, SHA256 `ef0868020ba847f9e6f17da8b11542f6b8f95580e53cf76def03a4bf135d58e1`. Dit is geen claim dat de volledige app-compiler foutvrij is. De latere CSS-correctie wijzigde geen TS/TSX-invoer.

Native Chromium-controles op de gecorrigeerde preview `50ec670afe0bb7297bd0d5e8b9f86edba9c2c309`:

- De bestaande volledige afbeelding opende in een afzonderlijk tabblad en decodeerde als 1254 × 1254.
- Een echte kopieeractie gevolgd door Ctrl+V in een tijdelijk, lokaal verwerkt controleveld leverde exact de canonieke publieke beeldlink op, zonder de aanwezige campagneparameter of het previewdomein.
- Pijlnavigatie vanaf de kopieerknop selecteerde het volgende beeld, maakte de kopieermelding leeg en focuste het juiste blijvende figuur.
- Zes CSS-viewports: 320 × 568, 390 × 844, 568 × 320, 844 × 390, 768 × 1024 en 1363 × 936. Alle zes ook met verdubbelde tekst, twaalf metingen totaal.
- Geen horizontale overflow van het dialooglichaam; geen afgekapte actielabels; vaste footer binnen de viewport. De kopieerknop was ook na focus/scroll volledig bereikbaar op 320 × 568 met verdubbelde tekst.
- Het landscape-artwork blijft op normale tekstgrootte volledig boven de vaste footer.

De tijdelijke fixture compileert de echte componenten en CSS met bronhashes. Zij verdubbelt uitsluitend lettergroottes; dit is een authored stresscase, geen native browserzoom. De fixtures en hun bundles worden vóór de release verwijderd. De echte verhaalpagina is afzonderlijk gebruikt voor de klik-, clipboard- en afbeeldingscontrole.

## Grenzen

Geen fysieke telefoon, native OS-tekstinstelling of screenreader gebruikt. De clipboardfoutpaden en asyncraces zijn afgedekt in tests; daadwerkelijke browserweigering is niet geforceerd. De browserclipboard-uitleestool gaf leeg terug; daarom is het daadwerkelijke resultaat via de native plakactie gecontroleerd. De bestaande JavaScriptvereiste van de interactieve galerie blijft bestaan. Build, CI en publieke productiecontrole worden op de schone release uitgevoerd en in de releaseregistratie vastgelegd.
