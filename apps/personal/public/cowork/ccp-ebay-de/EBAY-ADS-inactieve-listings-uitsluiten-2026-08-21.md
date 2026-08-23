---
type: onderzoek + bevinding
scope: CCP · eBay DE · Advertising · inactieve listings in campagnes
status: uitgezocht · geen actie nodig
created: 2026-08-21
last_reviewed: 2026-08-21
bron: campagnedetailpagina's en regel-editor, live uitgelezen 21-08-2026
---

# Inactieve listings uitsluiten — het hoeft niet, en het kan niet

**Je campagnes adverteren al uitsluitend actieve listings. Het getal 2.496 op de detailpagina is een rapportagerestant, geen advertentievoorraad.**

Ik heb dit uitgezocht in plaats van uitgevoerd, omdat het onderweg iets anders bleek te zijn dan het lijkt.

## 1 · Het bewijs

**In de regel-editor van de Remblokken-campagne staat het zwart op wit: "1.167 Angebote anhand Ihrer Regel hinzugefügt"** en "1.166 Angebote kommen in Frage". Dat is exact het aantal live Bremsbeläge uit je eBay-export. De regel voegt dus alleen actieve listings toe.

De detailpagina van diezelfde campagne zegt "2.496". Dat verschil is historie: eBay houdt beëindigde listings in de rapportage om je de cijfers van vóór hun einde te kunnen tonen.

**Waar die dubbeling vandaan komt, is ook duidelijk geworden.** Gesorteerd op voorraad zie je hetzelfde artikel twee keer, met twee ItemID's:

| Artikel | ItemID | Status | Voorraad |
|---|---|---|---|
| ABS 37665 Bremsbelagsatz Hinten MERCEDES-BENZ | 257662175800 | Beendet | 1.142 |
| ABS 37665 Bremsbelagsatz Hinten MERCEDES-BENZ | 257637849059 | Aktiv | 1.142 |
| ABS 37272 Bremsbelagsatz Vorne CITROEN | 257662217766 | Beendet | 657 |
| ABS 37272 Bremsbelagsatz Vorne CITROEN | 257637849084 | Aktiv | 657 |

Dat zijn oude listings die door een nieuwe zijn vervangen. De campagne bevat ze allebei; alleen de actieve wordt geadverteerd.

## 2 · Ze kosten je niets

Gefilterd op status `Beendet` en gesorteerd op impressies, hoogste eerst:

| Artikel | Impressies 7d | Klikken | Verkocht |
|---|---:|---:|---:|
| ABS 17640 Bremsscheibe HYUNDAI | 153 | 0 | 0 |
| ABS 17558 Bremsscheibe AUDI | 138 | 0 | 0 |
| ABS 16876 Bremsscheibe CITROEN | 106 | 0 | 0 |
| ABS 16150 Bremsscheibe LADA | 55 | **1** | 0 |
| overige beëindigde listings | 0 | 0 | 0 |

De impressies stammen uit de dagen vóórdat ze eindigden. Eén klik in de hele week, op een Basis-campagne waar je per verkoop betaalt en niet per klik — dus €0.

Hetzelfde geldt voor de **83 actieve listings met voorraad 0**: gecontroleerd, allemaal 0 impressies en 0 klikken. Ze kunnen ook niet verkopen, dus onder het cost-per-sale-model kost een beëindigde of uitverkochte listing per definitie niets.

## 3 · En eBay laat het ook niet toe

Ik heb het geprobeerd. Met de filter op `Beendet` zijn de selectievakjes **uitgeschakeld** — aanklikken doet niets, en er verschijnt geen actieknop.

Met de filter op `Aktiv` werkt het wel: vakje aan, en bovenaan verschijnt "1 von 25 Angeboten ausgewählt" met een **Entfernen**-knop.

**Je kunt dus alleen actieve listings uit een campagne halen, en dat is precies wat je níét wilt.**

## 4 · Wat wél in beeld kwam

Twee dingen die belangrijker zijn dan waar je naar vroeg.

**De regel staat op slot.** In de regel-editor: *"Nach dem Starten einer Kampagne kann die Regel nicht mehr bearbeitet werden."* De criteria — categorie, prijsspanne, merk, staat, dagen online en **Stückzahl** — zijn er wel, maar staan vast zodra de campagne draait. Er is één criterium dat je bij een nieuwe campagne meteen goed moet zetten: **Stückzahl op minimaal 1**, zodat uitverkochte artikelen er nooit in komen. Bij deze campagnes kan dat niet meer.

Wat wél kan op een draaiende campagne is **"Angebote ausschließen"** — de uitsluitfunctie die eBay in mei 2026 toevoegde, maximaal 10.000 per campagne. Dat is de route als je later selectief wilt worden, bijvoorbeeld om alleen te adverteren op SKU's waar je écht om zichtbaarheid vecht.

**Het advertentietarief per listing loopt op.** In de Basis-campagne staat per artikel het actuele tarief: **8,7% · 8,9% · 9,0% · 9,2% · 10,0% · 10,5% · 10,6%**, en de kolom "Heute empfohlener Anzeigentarif" is telkens exact hetzelfde getal. Het dynamische tarief volgt eBay's aanbeveling één op één, binnen een band van 5,1% tot 15,4% zonder bovengrens.

**Dat is waar je geld weglekt — niet in dode listings.** Bij 12% categorieprovisie plus 9% advertentietarief gaat 21% van je omzet naar eBay voordat je iets hebt ingekocht. De bovengrens op 4% zetten is één veld en scheelt bij €500 omzet per week ruwweg €25 per week.

## 5 · Wat ik heb aangeraakt

Niets. Ik heb gefilterd, gesorteerd, één selectievakje aan- en weer uitgezet om te testen of het werkte, en de regel-editor geopend en zonder opslaan verlaten. Er is geen instelling gewijzigd.

## 6 · Wat ik voorstel

1. **Niets uitsluiten.** De dode listings kosten niets en verdwijnen vanzelf uit de rapportage.
2. **Wel de bovengrens** op het dynamische tarief van campagne 4 naar 4% — dat is de ingreep die wel geld scheelt.
3. **Bij een volgende campagne**: zet in de regel meteen `Stückzahl ≥ 1` en beperk de categorie. Na de start kan het niet meer.
4. Wil je alsnog selectief adverteren op de artikelen waar je om zichtbaarheid vecht, dan is **"Angebote ausschließen"** de route — zeg het en ik bouw de uitsluitlijst op basis van het aantal concurrenten per SKU.
