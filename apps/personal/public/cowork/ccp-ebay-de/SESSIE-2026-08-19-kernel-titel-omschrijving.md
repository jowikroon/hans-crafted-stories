---
type: sessie-log
scope: CCP · Channable 314525 · kanaal eBay DE (159122)
status: deels-geslaagd
created: 2026-08-19
last_reviewed: 2026-08-19
bron: Kernel-operator (profiel channable-ccp), live UI, twee saves
---

# Sessie 2026-08-19 — titel + omschrijving remblokken via Kernel

Leidend bij conflict: `CHANNABLE-VERIFIED-FACTS-2026-08-19.md`. Deze notitie legt vast wat er in de **live regel** is gewijzigd en waar ik tegen die verified-facts in ben gegaan zonder het te weten.

## Wat er live is gewijzigd — regel 27864233 "DE | AA01 | Remblokken (Bremsbeläge)"

Twee secties toegevoegd en opgeslagen (nooit "Uitvoeren"; SKU-filter onaangeroerd).

**Sectie 3 — titel-fallback. WERKT, geverifieerd.**
- Als `categories_clean` bevat `remblok` EN `car_brands_top1` **leeg is**
- Dan `ebay_title_de` = combineer `brand` + " " + `sku` + " Bremsbelagsatz Bremsbeläge Bremsklötze Scheibenbremse"
- Bewijs: zoekactie op "Bremsklötze" in Items-na levert Brembo-remblokken met titel
  `Brembo P 06 001 Bremsbelagsatz Bremsbeläge Bremsklötze Scheibenbremse` (69 tekens).
- ABS-titels ongewijzigd: `ABS 35002 Bremsbelagsatz für u.a. HONDA` staat er nog.

**Sectie 4 — omschrijving. GEBOUWD, MAAR VUURT NIET.**
- Als `categories_clean` bevat `remblok` EN `ebay_omschrijving_de` **leeg is**
- Dan `ebay_omschrijving_de` = Duitse tekst met chips `brand`, `sku`, `ean`, `oe_reference`, `gpsr_manufacturer_name`
- Zoekactie op een unieke zin uit die tekst: **0 resultaten**.

## Waarom sectie 4 niet werkt — twee oorzaken

1. **Fout doelveld (hoofdoorzaak).** Verified-facts §2: de Build leest **`ebay_beschreibung_de`**; `ebay_omschrijving_de` is **dode output**. Ik heb naar het dode veld geschreven. Zowel het doelveld als de conditie moeten om.
2. **Conditie te zwak.** "leeg is" op een veld dat door een eerdere sectie half gevuld wordt, vuurt nooit. Meting: zoeken op "Original Qualität" (uit de bestaande omschrijving-sectie) gaf 45 ABS-items en **0 Brembo** — de bestaande sectie dekt alleen ABS.

## Openstaand conflict — niet opgelost, moet geverifieerd

Verified-facts §1 zegt dat import-regel **143655 "Brand ABS"** het veld `brand` project-breed op `ABS` forceert, en dat merk uit de SKU afgeleid moet worden (numeriek → A.B.S., P-serie/08./09. → Brembo).

**Mijn live-observatie spreekt dat tegen:** in Items-na van kanaal eBay rendert `brand` voor P-serie-SKU's gewoon als `Brembo`. Mogelijke verklaringen: 143655 heeft een conditie die Brembo uitsluit, staat gepauzeerd, of wordt op kanaalniveau overschreven. **Te verifiëren vóór de merk-uit-SKU-migratie**, want als `brand` op eBay DE wél klopt, is de titelsectie zoals gebouwd correct.

Extra vondst: het veld **`brand_display` bestaat al** in het project (gezien in de veldkiezer). Verified-facts noemt het als databron-implementatie — nog niet bevestigd of het in Channable gevuld is.

## Correctie die nog moet gebeuren

1. Sectie 4: doelveld → `ebay_beschreibung_de`, conditie → merk-gebaseerd (zelfde patroon als sectie 3: `car_brands_top1 leeg is`) in plaats van "veld leeg".
2. Overwegen om sectie 4 helemaal te schrappen ten gunste van **`v_companion_remblokken`** (verified-facts §3): 3.442 rijen met kant-en-klare `title_de` en `description_de` per SKU, merge op `sku`. Dat is rijker dan wat een kanaalregel kan samenstellen en is de bedoelde architectuur — tekst bouwen in Channable-regels is een workaround voor data die al bestaat.

## Stand van zaken remblokken eBay DE (eerlijk)

| Onderdeel | Status |
|---|---|
| Titels | ✅ live en geverifieerd |
| Omschrijvingen | ❌ verkeerd veld, vuurt niet |
| Afbeeldingen | ❌ niet aangeraakt; `image_main_1600` leeg op 24.089 items |
| K-Type fitment | ❌ 100% leeg in feed; kan pas ná livegang via upload |
| Datakwaliteit | ❌ 650 SKU-conflicten, 5.645 ongecategoriseerde items, mis-map remschijven actief |

Een push nu levert Brembo-listings mét titel maar zónder omschrijving — eBay weigert die.

## Operationele leerpunten Kernel-operator

- Rules-pad is `/apis/<id>/operators`, niet `/rules`.
- De combine-editor is een **contenteditable**; chips zijn `span[role=button]`. ⊕ voegt een chip in **op de cursorpositie**.
- Spaties zijn **letterlijk** — combine voegt niets automatisch toe.
- Bij het typen in de editor kan een chip verdwijnen; altijd de chip-volgorde naderhand controleren.
- Operator-dropdowns negeren `selectOption`; wél werkt de native value-setter plus `input`+`change` events.
- Veldkiezer is gevirtualiseerd: een exacte match als `sku` staat vaak buiten beeld en vereist scrollen in de lijst.
- Preview (`/preview`) is leeg tot de volgende build; verifiëren gaat via **Items-na** met een zoekterm die alleen in de nieuwe output voorkomt.
