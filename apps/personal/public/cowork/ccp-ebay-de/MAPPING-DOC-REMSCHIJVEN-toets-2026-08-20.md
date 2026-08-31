---
type: verificatie
scope: CCP · remschijven (CA01 / eBay-categorie 33564) · Supabase ccp-marketplace
status: gemeten
created: 2026-08-20
last_reviewed: 2026-08-20
bron: "Mapping Document: Definitieve Inrichting voor Automotive Productcatalogi (Remsystemen)" getoetst tegen live ccp_sku_attributes
---

# Het mapping-document naast de werkelijke data

Het document beschrijft een remschijf-datamodel. Elk attribuut dat het voorschrijft **bestaat al als kolom** in `ccp_sku_attributes` — op twee na. Het probleem is niet het model, het is de vulgraad.

## 1 · Vulgraad per voorgeschreven attribuut

Gemeten op de 214 remschijven in `ccp_sku_attributes` (eBay-categorie 33564).

| Document-attribuut | Kolom | Gevuld | % |
|---|---|---|---|
| Diameter | `durchmesser_mm` | 10 | **4,7%** |
| Type Remschijf (Solid/Vented) | `bremsscheibenart` | 11 | **5,1%** |
| Dikte | `staerke_mm` | 7 | **3,3%** |
| Minimum Dikte | `mindestdicke_mm` | 4 | **1,9%** |
| Hoogte | `hoehe_mm` | 5 | 2,3% |
| Centreerdiameter | `zentrierungsdurchmesser_mm` | 7 | 3,3% |
| Steekcirkel (PCD) | `lochkreis` | 7 | 3,3% |
| Aantal gaten | `lochzahl` | 7 | 3,3% |
| Oppervlakte (Coated) | `oberflaeche` | 117 | 54,7% |
| Gewicht | `weight_kg` | 214 | 100% |
| OE-referenties | `oe_references` | 214 | 100% |
| EAN | `ean` | 214 | 100% |

**Ontbreekt volledig als kolom:**
- **Naafdiameter / Hub Diameter** (document: 150 mm bij artikel 17520)
- **Hub Height / Protrusion** — het attribuut dat het document expliciet verplicht stelt voor de Mercedes W205/W213-case

## 2 · Wat dit betekent voor de veiligheidsregel uit §4

Het document eist axiale differentiatie: *"De systeemlogica moet voorkomen dat een gebruiker een 'solid' schijf selecteert voor een 'vented' as-positie."*

Die regel is op dit moment **niet te bouwen**. Hij draait op `bremsscheibenart`, en dat veld is gevuld op 11 van 214 schijven. Een gate op 5% dekking laat 95% ongecontroleerd door en geeft valse zekerheid — erger dan geen gate.

Zelfde geldt voor de Mercedes-waarschuwing: zonder `hub_protrusion_mm` is er niets om op te waarschuwen.

## 3 · De grotere discrepantie: 214 versus 3.254

`cat_sku` bevat **uitsluitend remblokken** (3.442 rijen, categorie `Remblokken`). Er is geen remschijven-catalogus in `ccp-marketplace`. De 214 remschijven leven alleen in `ccp_sku_attributes`, de 398-rijen verrijkingstabel.

Tegelijk telt kanaal eBay DE **3.254 items in CA01 → Bremsscheiben**.

Er is dus geen `v_companion_remschijven` die doet wat `v_companion_remblokken` voor remblokken doet. Zolang die er niet is, kan het mapping-document niet worden geïmplementeerd — er is geen tabel om het model in te leggen.

## 4 · Wat het document wél goed vastlegt en wat overgenomen hoort te worden

- **Vented = vooras, Solid = achteras** als harde regel, met 17521 (288×25 mm, vooras) en 17520 (253×10 mm, achteras) als referentiepaar
- **OE is de sleutel voor voertuigkoppeling, EAN voor logistiek** — twee rollen, niet uitwisselbaar. Dat sluit aan op de eerdere bevinding dat OE níét in de titel hoort maar wél in de item specifics
- **MSRP vs. huidige prijs** tonen (voorbeeld: €27,99 tegenover €56,05 adviesprijs bij 17520) en **prijs per 2 stuks** prominent, omdat schijven per as-set worden vervangen. Dat is een concrete Channable-Build-eis die nu nergens staat
- **Coating als koopargument** ("montageklaar, geen ontvetting") — positionering tussen RIDEX (budget) en ATE (premium). Bruikbaar voor de A.B.S.-omschrijvingen

## 5 · Status van de claims in het document

De prijzen, de OE-lijsten per artikel (17520 / 17521) en de voertuiggeneraties (Golf Mk5 1K1 / Mk6 5K1 / Mk7 5G1, Octavia 1Z5 / 5E5, Leon Mk2 1P1) staan niet in de vault en zijn niet tegen een primaire bron getoetst. `[unverified]` tot ze uit de A.B.S.-bronbestanden of TecDoc worden bevestigd.

Het "expertsentiment" in §6 (Franse en Duitse gebruikersfeedback) heeft geen bronvermelding. Niet gebruiken als onderbouwing in een listing — een niet-onderbouwde kwaliteitsclaim in een Duitse listing is Abmahnfähig.
