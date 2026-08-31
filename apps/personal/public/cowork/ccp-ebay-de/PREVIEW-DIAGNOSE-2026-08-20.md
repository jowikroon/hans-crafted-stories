---
type: diagnose
scope: CCP · Channable 314525 · kanaal eBay DE (159122) · preview-export 20-08-2026
status: oorzaken vastgesteld
created: 2026-08-20
last_reviewed: 2026-08-20
bron: 627649_ebay_preview.csv (4.452 foutregels, 2.792 unieke SKU's) + all-active-listings 20-08
---

# Preview-diagnose — twee blokkades, en ze staan los van je regels

## 1 · Er gaat niets de deur uit. Elk van de 2.792 items heeft een fout

| Foutcode | Aantal | Betekenis |
|---|---|---|
| `CHANNABLE_GENERATE_ERROR` | **1.132** | *Item ignored, on eBay but not sent through this API* |
| `21919188` | **1.660** | eBay-verkooplimiet bereikt |
| `21917236` | 1.655 | waarschuwing over ingehouden betalingen — blokkeert niet |
| `21920270` | 5 | catalogus-specifics overschrijven de jouwe — onschuldig |

De 4.452 regels zijn 2.792 unieke SKU's; sommige hebben twee meldingen.

## 2 · Antwoord op je vraag — de bestaande listings

**1.132 items worden genegeerd met: *op eBay, maar niet via deze API verstuurd*.** Alle 1.132 zijn A.B.S., en alle 1.132 staan live op eBay.

Dat is het bewijs dat deze listings **niet door kanaal 159122 zijn aangemaakt**. Ze zijn wél met Channable gemaakt — maar via een ander kanaal of een eerdere API-koppeling die is vervangen. Channable koppelt listings aan de API die ze heeft aangemaakt; ziet het kanaal een listing die het niet zelf heeft ingestuurd, dan laat het die met rust. Dat is geen bug maar een veiligheidsmechanisme.

Dit sluit ook het raadsel van stap 7 «0 succesvol verstuurd»: dat klopte gewoon.

**Gevolg:** dit kanaal kan die 1.167 actieve listings niet bijwerken. Niet met deze regels, niet met andere regels. De Revise-upload die ik vanochtend heb gebouwd is daarmee niet het vangnet maar de **enige** route naar die listings.

Er zijn daarnaast **157 live listings die helemaal niet in de preview voorkomen** — die zitten niet eens in de feed.

## 3 · De tweede blokkade — je zit aan je eBay-verkooplimiet

> *Sie haben den Höchstbetrag für eingestellte Artikel erreicht. Sie können diesen Monat Artikel im Wert von bis zu € 868.507,90 einstellen.*

**1.660 items worden hierdoor geweigerd**, waarvan **1.335 Brembo** en 325 A.B.S. Geen van die 1.660 staat live — het zijn allemaal nieuwe listings.

Dit staat volledig los van je data. Zolang de limiet vol zit komt er geen enkel nieuw artikel bij, hoe perfect het ook is. Verhoging aanvragen via het Verkäufer-Cockpit; dat is een verzoek aan eBay met doorlooptijd.

Goed nieuws erin verstopt: **Brembo zit gewoon in de feed** — 1.335 SKU's staan klaar. Ze worden alleen tegengehouden door de limiet.

## 4 · Wat je vier regels wél hebben gedaan

Gemeten over alle 4.452 preview-regels:

| Attribuut | Gevuld | Waarde |
|---|---|---|
| Hersteller | **4.452 / 4.452** | `A.B.S.` |
| Produktart | **4.452 / 4.452** | `Bremsbelagsatz` |
| Anzahl pro Packung | **4.452 / 4.452** | `4` |
| Herstellernummer | **4.452 / 4.452** | SKU |
| Einbauposition | **115 / 4.452** | Vorne 66 · Hinten 40 · «Vorne, Hinten» 9 |
| Material | 2 | |
| Besonderheiten | 7 | |
| **OE/OEM Referenznummer(n)** | **0** | |
| **Vergleichsnummer** | **0** | |

Sectie 2 (Produktart) werkt perfect. Sectie 1 (Einbauposition) vult 2,6%. Sectie 3 (OE) doet niets.

## 5 · De vondst die alles verandert: Marke ≠ Hersteller

Dit zijn **twee verschillende eBay-attributen**, en ik heb de verkeerde gerepareerd.

```
attributes.Hersteller  →  A.B.S.   op alle 4.452     ← mijn fix, werkt
attributes.Marke       →  ABS 1.750 · Brembo 2.702   ← hier telt eBay op
```

Het kwaliteitsrapport zei *Marke = 0*. Dat gaat over `Marke`, niet over `Hersteller`. `Marke` staat nog steeds op `ABS` zonder punten — precies de waarde die eBay aan het modemerk koppelt.

**Waarom ik dat niet zag:** `Marke` staat niet bij de categorie-attributen van 57357. Het is een **gedeeld attribuut** in de Build-stap, en het hangt aan het projectveld `brand`. En `brand` wordt project-breed op `ABS` gezet door importregel **143655 "Brand ABS"**.

De fix zit dus in de gedeelde attributen: `Marke` moet gevoed worden door **`brand_display`** (`A.B.S.` / `Brembo`) in plaats van `brand`. Dat veld bestaat al in het project.

Let op de bijvangst: `Marke` staat bij 2.702 items op `Brembo` — dus daar leest hij wél het echte merk. Alleen bij de 1.750 A.B.S.-items staat de puntloze variant.

## 6 · Waarom Einbauposition maar 2,6% vult

Twee dingen:

1. Het bronveld `ebay_de_bremsbelage_einbauposition` is zelf grotendeels leeg. De keten `DE | Inbouwpositie 01–06` levert maar voor een fractie. Kopiëren van een leeg veld geeft leeg.
2. De waarden die er wél staan zijn `Vorne` / `Hinten` — dat is correct voor eBay 57357. Maar 9 items hebben **«Vorne, Hinten»**, en dat attribuut accepteert één waarde. Die 9 worden geweigerd.

Onze database heeft de positie op **99,1%** (`einbauposition_de` in `ccp_sku_attributes`, met Vorderachse/Hinterachse). Die staat alleen niet in Channable.

## 7 · Waarom OE 0 blijft

Sectie 3 kopieert `oe_reference` → `oe_nummern_kurz`. Als het resultaat 0 is, is `oe_reference` in dít kanaal leeg. Regel 27874006 kapt `oe_reference` af op 65 tekens — maar afkappen vult niets. Het veld moet eerst gevuld worden vanuit de Magento- of attributenimport.

Onze database heeft OE op **100%** voor A.B.S. (1.941/1.941). Ook die staat niet in Channable.

## 8 · Wat dit betekent voor de volgorde

De rode draad: **de goede data zit in Supabase, niet in Channable.** Regels kunnen alleen verplaatsen wat er al is. Zolang de companion-feed geen import is, blijven Einbauposition en OE leeg — ongeacht hoeveel regels we bouwen.

Voorstel in deze volgorde:

1. **`Marke` omzetten naar `brand_display`** in de gedeelde attributen. Eén dropdown, raakt alle 4.452, en het is het attribuut waarop eBay je een 0 gaf.
2. **Verkooplimiet verhogen** aanvragen bij eBay. Zonder dat komt er geen enkel nieuw artikel bij — ook geen Brembo.
3. **Revise-upload** voor de 1.167 live listings. Dat is de enige route naar items die dit kanaal niet mag aanraken.
4. **Companion-feed als import** koppelen, zodat OE en Einbauposition echt binnenkomen.
5. Pas daarna opnieuw naar de attributen kijken.

Stap 1 en 3 kunnen vandaag. Stap 2 ligt bij eBay.
