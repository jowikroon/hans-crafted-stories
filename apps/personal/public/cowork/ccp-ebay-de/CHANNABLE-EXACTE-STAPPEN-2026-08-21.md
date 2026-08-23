---
type: instructie
scope: CCP · Channable 314525 · import + Build eBay DE 159122
status: mapping gecontroleerd · hoofdoorzaak gevonden
created: 2026-08-21
last_reviewed: 2026-08-21
bron: Channable interne API, uitgelezen 21-08-2026 · PostgREST-test op v_channable_import
---

# Wat je in Channable moet doen

**Aan de mapping hoef je niets te veranderen — die staat al goed. Maar de import haalt maar 1.000 van de 3.690 SKU's op. Dat is de echte reden dat je verrijking niet doorkomt.**

## 1 · De vondst

Import 849793 "CCP Attributen" staat op:

```
kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_channable_import?select=*&order=sku&limit=5000&apikey=...
```

`limit=5000` heeft geen effect. PostgREST kapt hard af op 1.000 rijen. Getest:

| Aanroep | Resultaat |
|---|---|
| `limit=5000` | **1.000 rijen** — van SKU 15315 tot 36699 |
| `offset=1000` | 1.000 rijen — 36701 tot 37981 |
| `offset=3000` | 690 rijen — P 54 037 tot P B7 002 |

**Alles boven SKU 36699 krijgt dus geen enkel veld uit Supabase.** Dat betekent: alle 38xxx-remblokken, alle remklauwen, alle vloeistoffen, en **de complete Brembo P-serie van 1.501 SKU's** — want die sorteert helemaal achteraan.

Dit verklaart alles wat we de afgelopen dagen hebben zien misgaan:

- `Einbauposition` in de feed 261 van 908, terwijl Supabase er 2.501 van de 2.521 heeft
- Brembo dat "data-arm" leek in de briefing
- `Marke` dat op `ABS` blijft staan
- OE-nummers die niet doorkomen bij de hogere SKU's

De data in Supabase is goed. Hij komt alleen niet binnen.

## 2 · Wat je moet aanmaken — drie extra imports

Ga naar `Setup → Import → Nieuwe import` en maak er drie, precies zoals "CCP Attributen" maar met een andere URL:

| Naam | URL |
|---|---|
| CCP Attributen 2 | `kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_channable_import?select=*&order=sku&limit=1000&offset=1000&apikey=<dezelfde key als import 849793>` |
| CCP Attributen 3 | idem maar `offset=2000` |
| CCP Attributen 4 | idem maar `offset=3000` |

Per import instellen:

- **Type:** JSON
- **Samenvoegen op:** `sku`
- **Samenvoegstrategie:** `Samenvoegen` (merge), niet Toevoegen
- **Volgorde:** na 849793

De apikey staat al in de URL van import 849793 — kopieer hem daaruit, dan hoeft hij niet door de chat.

**Waarom je dit met de hand moet doen:** ik heb geprobeerd de drie imports via Channable's API aan te maken. Aanmaken lukte (201), maar de velden `combine` en `join_strategy` accepteert die API niet — ze bleven op leeg en `append` staan. Met `append` en zonder samenvoegsleutel had je er 2.690 dubbele items bij gekregen. **Ik heb ze daarom meteen weer verwijderd; je project staat weer op de oorspronkelijke drie imports.** In de wizard is de samenvoegstap verplicht, dus daar gaat het wel goed.

## 3 · Wat er al goed staat — niets aan doen

Ik heb de volledige Build-mapping uitgelezen. Deze staan al gekoppeld:

| eBay-veld | Gekoppeld aan |
|---|---|
| Shopcategorie (`store_category_id`) | **`ebay_shop_kategorie_id`** ✓ |
| Titel | `ebay_title_de` |
| Omschrijving | `ebay_beschreibung_de` |
| Afbeeldingen | `image_link` + additional images |
| Anzahl pro Packung | `anzahl_pro_packung` |
| Einbauposition | `einbauposition_ebay` |
| Hersteller | `hersteller` |
| Herstellernummer | `sku` |
| Produktart | `produktart` |
| OE/OEM Referenznummer(n) | `oe_nummern_kurz` |
| Material, Besonderheiten, Oldtimer, Tuning, Ursprungsland, Garantie | eigen velden |

**De shopcategorie was dus al gekoppeld.** Het probleem is niet de mapping maar dat `ebay_shop_kategorie_id` de meeste items nooit bereikt door die 1.000-limiet.

## 4 · Twee dingen die wel aandacht vragen

**`Vergleichsnummer` staat op hetzelfde veld als OE/OEM** — beide op `oe_nummern_kurz`. Je stuurt dus dezelfde nummers twee keer. Vergleichsnummer is bedoeld voor de nummers van concurrerende merken, niet voor OE. Ontkoppelen of leeglaten.

**`Marke` staat nergens in de mapping.** Niet bij de gedeelde attributen, niet bij de categorie-attributen van 57357. Toch komt hij in de feed als `ABS` bij 907 van de 908. Ik kan niet vinden waar dat vandaan komt — mogelijk vult eBay hem uit de catalogus, of het staat in een deel van het Build-formulier dat de API niet teruggeeft. **Kijk in de Build onder Gedeelde attributen of er een veld Marke staat en waar het aan hangt.** Als het aan `brand` hangt, zet het op **`marke_ebay`** — dat veld staat klaar en levert `A.B.S.` en `Brembo`.

## 5 · De volgorde

1. **Drie imports aanmaken** zoals hierboven, elk met samenvoegen op `sku` en merge
2. **Alle imports verversen** — `Opslaan & import vernieuwen`
3. **Controleren in Items:** zoek een Brembo-SKU (bijvoorbeeld `P 85 161`) en kijk of `einbauposition_ebay`, `anzahl_pro_packung`, `marke_ebay` en `ebay_shop_kategorie_id` gevuld zijn. Zijn ze leeg, dan is de merge niet goed gegaan
4. **Preview draaien** en kijken of `attributes.Einbauposition` en `store_category_id` nu bij vrijwel alles staan
5. Pas daarna **`ebay-VERRIJKING-shopcategorie-NIET-API-908-2026-08-21.csv`** uploaden — die 908 blijven altijd handwerk, want het kanaal mag er niet bij

## 6 · Wat ik heb aangeraakt

- Drie imports aangemaakt en binnen twee minuten weer verwijderd. Project staat op de oorspronkelijke drie.
- Verder niets in Channable gewijzigd. De mapping is alleen gelezen.
- In Supabase: `anzahl_pro_packung` gevuld, en de velden `marke_ebay` en `ebay_shop_kategorie_id` toegevoegd aan de view.
- Een edge function `channable-feed` gedeployed die alle 3.690 rijen in één keer teruggeeft (getest: 3.690 rijen, 17 MB, 6 seconden). Die is nu nog niet bruikbaar omdat hij een Authorization-header eist en Channable die niet kan meesturen. Als de vier imports te omslachtig worden, is dit het alternatief — dan moet de functie eerst publiek gemaakt worden.
