---
type: bronanalyse
scope: CCP · ABS Assortment (1).xlsx · remblokken eBay DE
status: getoetst, deels bruikbaar
created: 2026-08-20
last_reviewed: 2026-08-20
bron: ABS Assortment (1).xlsx, 39.359 rijen, 26 kolommen
---

# ABS Assortment.xlsx getoetst — wat het wél en niet oplost

## 1 · Het korte antwoord

**Nee, dit bestand kan de ontbrekende attributen niet vullen.** Het is dezelfde bron die onze pijplijn al inleest, met dezelfde 26 kolommen. Van de negen velden die je bij Nils opvroeg zitten er **acht helemaal niet in het bestand**, en het negende — OE voor Brembo — is er net zo leeg als bij ons.

Ik heb het volledig doorgemeten voordat ik dit zeg.

## 2 · Wat het bestand bevat

39.359 artikelen, 39 artikelgroepcodes. De remblokken zitten in twee groepen:

| Groep | Merk | Rijen |
|---|---|---|
| AA01 | A.B.S. | 1.911 |
| AA09 | Brembo (P-serie, 08./09.) | 1.507 |
| **Totaal Brake Pads** | | **3.418** |

Vulgraad per veld:

| Veld | A.B.S. (AA01) | Brembo (AA09) |
|---|---|---|
| OE Reference | 1.911 / 1.911 — 100% | **2 / 1.507 — 0,1%** |
| Pos Front Rear | 1.892 / 1.911 — 99,0% | 1.501 / 1.507 — 99,6% |
| EAN, gewicht, MOQ, doosaantal, land | 100% | 100% |
| Car Brands / Models | 99,0% | 99,6% |
| Pos Left Right | 10 / 1.911 | 0 / 1.507 |
| Other Side Art Nr | 0 | 0 |

## 3 · De acht velden die er niet in staan

Het bestand heeft 26 kolommen, allemaal commercieel of logistiek: prijs, brutoprijs, artikelgroep, voertuigen, bouwjaren, EAN, gewicht, verpakkingsmaten, intrastat, positie, MOQ, doosaantal, releasedatum, OE, land van herkomst.

Niet aanwezig, in geen enkele vorm:

- Breite / Höhe / Dicke
- Bremssystem
- Verschleißwarnkontakt
- WVA-Nummer
- ECE-R90 / Prüfzeichen
- Belagmaterial
- Anzahl pro Packung
- Vergelijkingsnummern

Dit zijn TecDoc-criteria. Ze zitten niet in de commerciële assortimentsexport en komen daar ook niet in. **Het verzoek aan Nils blijft dus onverkort staan** — en dit bestand is het bewijs dat de vraag terecht is.

## 4 · Brembo OE: bevestigd leeg aan de bron

De 1.507 Brembo-remblokken hebben in dit bestand **2 OE-referenties**. Exact dezelfde twee die wij al hadden. Steekproef:

```
P 85 020   pos: Front/Rear   OE: leeg
P 85 126   pos: Front        OE: leeg
P 85 124   pos: Rear         OE: leeg
```

Dat betekent iets belangrijks voor je mail aan Nils: het gat zit **niet in de export die jullie krijgen**, het zit in wat A.B.S. van Brembo doorgeeft. De vraag of hij bij het Brembo-merknummer in TecDoc kan is daarmee nog scherper geworden — dit is niet iets wat hij met een andere kolomselectie oplost.

## 5 · De 24 zonder inbouwpositie: ook aan de bron leeg

Alle 24 SKU's zonder positie in onze database staan in dit bestand, en hebben daar **allemaal een lege positie**:

```
35027 35140 35141 35379 35389 36065 36434 36738 36806 36931 36971
37024 37026 37047 37657 37770 37771 37772
P 54 024  P 54 035  P 54 043  P 54 044  P 54 064  P 54 065
```

Het bestand bevat er zelfs 25 zonder positie — één meer dan wij (35461, waar wij wel een waarde voor hebben). Onze data is op dit punt dus iets vollediger dan de bron.

Deze 24 zijn niet af te leiden en niet te raden. Zet ze op de lijst voor Nils, of laat Einbauposition bij die 24 leeg — het is 0,7%.

## 6 · Wat ik wél heb doorgevoerd: Duitse inbouwpositie

Je vroeg om de juiste Duitse waarden. De positie stond overal in het Engels. Nieuwe kolommen op `ccp_sku_attributes`: `einbauposition_de` en `einbauposition_bron`.

| Duitse waarde | Aantal | Herkomst |
|---|---|---|
| Vorderachse | **2.217** | bron: ABS Assortment |
| Hinterachse | **1.065** | bron: ABS Assortment |
| Vorderachse, Hinterachse | **136** | meervoudig — vergt een keuze |
| leeg | 24 | ontbreekt in bron |

**Let op die 136.** eBay-categorie 57357 accepteert voor Einbauposition **één** waarde; het attribuut staat op `meerdere_waarden = false`. Deze artikelen passen echt op beide assen, maar je moet er één kiezen of ze zonder positie laten. Kiezen we automatisch Vorderachse, dan staat er bij 136 listings iets dat maar half klopt — daarom heb ik dat níét gedaan en de bron-kolom gemarkeerd.

Dat raakt 3,9% van het assortiment. Mijn voorstel: laat Einbauposition bij die 136 leeg en zet "Vorder- und Hinterachse" in de omschrijving. Dan klopt de listing en verlies je alleen een filterpositie.

## 7 · Stand na deze ronde

| Veld | Gevuld van 3.442 |
|---|---|
| Einbauposition (Duits) | 3.418 — 99,3%, waarvan 136 meervoudig |
| OE — A.B.S. | 1.941 / 1.941 — 100% |
| OE — Brembo | 2 / 1.501 — 0,1% |
| Acht TecDoc-criteria | ontbreken volledig, bestaan niet in deze bron |

Titel, omschrijving, EAN, GPSR, categorie-ID en afbeelding stonden al op 100%.

## 8 · Conclusie voor je mail

Stuur hem. En voeg één zin toe: dat je het assortimentsbestand hebt gecontroleerd en dat de negen velden daar niet in zitten. Dan weet Nils meteen dat hij niet naar dezelfde export hoeft te wijzen, en scheelt dat een ronde.
