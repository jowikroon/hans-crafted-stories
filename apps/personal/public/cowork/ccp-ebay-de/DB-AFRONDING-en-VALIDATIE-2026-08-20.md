---
type: migratie-log + validatie
scope: CCP · Supabase ccp-marketplace (kskumhtisifsdjjbzvbo) · Channable 314525
status: uitgevoerd en geverifieerd
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live SQL tegen ccp-marketplace + Channable-UI-waarneming 2026-08-19/20
---

# Databaselaag afgerond + validatie van de geplakte operator-instructies

## 1 · Wat er in de database is veranderd

Vier migraties, alle vier geverifieerd na afloop.

### M1 — `ccp_brand_gpsr` gesplitste adreskolommen
`add column if not exists gpsr_street, gpsr_zip, gpsr_city, gpsr_country, gpsr_phone` + gevuld voor ABS en Brembo met exact de waarden die tot nu toe hardgecodeerd in de view stonden. `gpsr_address` blijft ongewijzigd — die samengestelde string voedt `v_channable_brand_gpsr`.

### M2 — `v_companion_remblokken` op een echte JOIN
De zeven hardgecodeerde `CASE WHEN c.sku ~ '^P'`-blokken voor GPSR zijn vervangen door `g.*` uit `ccp_brand_gpsr`, gejoind op de SKU-afgeleide `brand_key`.

Uitgevoerd als **`CREATE OR REPLACE VIEW`**, niet als `DROP ... CASCADE`. Dat was noodzakelijk: `v_publish_flags` hangt aan deze view en zou bij een DROP CASCADE zijn meegesleurd. De 50 kolommen staan in dezelfde volgorde met dezelfde types, dus Postgres accepteert de replace.

**Bewijs dat er niets is veranderd aan de uitkomst:**

| Meting | Vóór | Ná |
|---|---|---|
| Rijen | 3.442 | 3.442 |
| Brembo N.V. | 1.501 | 1.501 |
| A.B.S. All Brake Systems B.V. | 1.941 | 1.941 |
| NULL in gpsr_name | 0 | 0 |
| md5-fingerprint over alle GPSR-velden | `fe8511cea5466635b413f49c7dc468fc` | `fe8511cea5466635b413f49c7dc468fc` |

`v_publish_flags` doet het nog: 7.680 rijen.

Wat blijft SKU-afgeleid: `brand_display` en `gpsr_brand_key`. Dat is bewust — de SKU is de identiteitsbron, `ccp_brand_gpsr` levert alleen de fabrikantgegevens die bij die identiteit horen. Een merkcorrectie in de tabel werkt nu meteen door naar alle 3.442 SKU's; dat was de hele bedoeling van DB-1.

### M3 — publicatiegates gededupliceerd
`v_publish_flags_ebay_de` telde 3.840 rijen op 3.690 unieke SKU's: **150 dubbele merge-keys**. Channable merget op `sku`; een dubbele key geeft een niet-deterministische gate-waarde. De 150 dubbelen waren gelukkig niet-conflicterend (106× beide true, 44× beide false), dus dedupliceren via `group by sku` + `bool_and(enabled)` is gedragsneutraal. `bool_and` is bewust conservatief gekozen: enabled alleen als élke bronrij dat zegt.

Zelfde behandeling voor `v_publish_flags_bol_nl` (identiek probleem).

**Gevolg voor de cijfers:** het getal "356 true" uit CCPSTATUS was duplicaat-inflatie. Echt: **250 enabled van 3.690**. Dat sluit nu wél aan op `ccp_publish_control` (252).

### M4 — `v_ebay_de_remblokken_tranches`
Nieuwe read-only view die de uitrolvolgorde bepaalt die je zelf voorstelde (100 → 300 → rest), per merk gerangschikt op datavolledigheid.

| Tranche | A.B.S. | Brembo | Titel | Omschrijving | K-Types | Titel > 80 tekens |
|---|---|---|---|---|---|---|
| 1 | 50 | 50 | 100% | 100% | 100% | 0 |
| 2 | 150 | 150 | 100% | 100% | 100% | 0 |
| 3 | 1.741 | 1.301 | 100% | 100% | 99,2% | 0 |

De view zet zelf niets aan. Hij voedt `ccp_publish_control`.

## 2 · De omschrijving-knoop, met cijfers

| Veld | Gevuld op 3.442 remblokken |
|---|---|
| `description_de` | **3.442 (100%)** |
| `ebay_beschreibung_de` (bronkolom in `ccp_sku_attributes`) | 150 (4,4%) |

Je besluit klopt: `description_de` is de bron van waarheid.

**Wat ik bewust níét heb gedaan:** `ebay_beschreibung_de` in de database volschrijven vanuit `description_de`. Dat zou een tweede waarheid maken die kan gaan divergeren. De mapping hoort op kanaalniveau in Channable: `{description_de}` uit de companion-import → doelveld `ebay_beschreibung_de`. Eén bron, één kopie, op het punt waar hij nodig is.

**Compliance-controles op die 3.442 omschrijvingen:**

- ISO-claim met certificaat **10750362**: op 1.941 rijen — exact het A.B.S.-aantal
- ISO-claim op een Brembo-omschrijving: **0** — Abmahnung-veilig
- Voorkomen van "S.p.A.": **0**
- Voorkomen van certificaat 10750361: **0**

## 3 · Validatie van de geplakte instructies

### Fout — ISO-certificaatnummer
De tekst noemt `10750361`. De database en de verified facts noemen **10750362**. Nul omschrijvingen bevatten 10750361. Een fout certificaatnummer in een Duitse listing is precies het soort detail waarop een Abmahnung wordt gebouwd. Corrigeren vóór er iets live gaat.

### Fout — "Product_Online pauzeren"
Staat er drie keer in als actiepunt. Regel 28097660 toont in de UI de knop "Hervat regel" en is dus **al gepauzeerd**. Idem `SKU Filter 400 producten_copy` (28097628) en `Filter verwijderen product online` (28201901). De hele causale keten "lowercase mismatch → alles verwijderd → nul items" kan daarmee niet kloppen — en klopt ook niet: stap 6 Bekijk toont items, stap 5 Kwaliteit draait.

### Fout — "356 true / 3.484 false van 3.840"
Duplicaat-inflatie. Werkelijk 250 true van 3.690 unieke SKU's. Na M3 is dit cijfer stabiel.

### Onbevestigd — "46 wijzigingen in de afgelopen 24 uur"
Mijn eigen regel-log telde 65 echte wijzigingen over de volledige historie, niet 46 in 24 uur. Niet reproduceerbaar zonder een nieuwe scan. `[unverified]`

### Onbevestigd — "Categories_clean: 3 actief / 21 gepauzeerd"
De snapshot van 12-08 zegt 24 regels waarvan 22 gepauzeerd, dus 2 actief. De geplakte tekst zegt 3 actief / 21 gepauzeerd. Verschil van één. Beide kunnen kloppen als er sindsdien iets is gewijzigd. Vergt een verse telling. `[unverified]`

### Correct — verify-only kan niet
Je eigen correctie is juist en ik heb hem hard bevestigd: in stap 1 Instellingen staat `data-disabled="true"` op zowel "Alleen verifiëren" als "Publiceer", en beide radio-inputs zijn `disabled`. Het kanaal zit vast op Publiceer. De enige rem is "Deactiveer API" of het stilzetten van de schedules.

### Correct — Brembo N.V., Viale Europa 2, 24040 Stezzano (BG), IT
Staat zo in `ccp_brand_gpsr`, `verified = true`, en wordt nu via de JOIN aan alle 1.501 Brembo-SKU's geleverd.

### Correct — audit vóór delete
De reflex om niet blind 26 regels en 342 velden te verwijderen is de juiste. Zeker nu blijkt dat de aannames over regelstatussen in dezelfde tekst aantoonbaar fout zijn.

### Deels correct — (EG) 461/2010
Verordening (EU) nr. 461/2010 is de groepsvrijstelling voor de motorvoertuigensector en is inderdaad de basis voor "gelijkwaardige kwaliteit"-claims op onderdelen. De verordening zelf spreekt van *matching quality*; de Duitse listingtekst hoort dat als `Ersatzteile in Erstausrüsterqualität` of een vergelijkbare Duitse formulering te brengen, niet als Engelse term. `[te controleren door jurist vóór livegang]`

## 4 · Wat er nu nog tussen jou en een perfecte livegang staat

1. **Gate dekt Brembo niet.** Van de 3.442 remblokken staan er 212 op enabled — waarvan **0 Brembo**. De tranche-view is klaar; `ccp_publish_control` moet gevuld worden. Dat is de enige stap die daadwerkelijk listings aanmaakt, dus die zet ik niet zonder jouw woord.
2. **Prijs is niet gemapt** in de Build-stap van eBay DE ("Niet gemapt veld" in de preview).
3. **14.837 items zonder categorie** — grootste enkele hefboom op de kwaliteitsstap.
4. **Afbeeldingen** — `image_main_1600` leeg; Creatives wacht op budget.
5. **Sectie 3 van regel 28209293** doet `car_models leeg is → car_models · splits items`. Niet begrepen, niet aangeraakt, wél verdacht.

## 5 · NotebookLM

Skill `notebooklm-harvest` is opgeslagen. Getest tegen notebook `e515cfcd-499a-4d71-bd67-d7a0a64cb6df`: het Kernel-profiel `channable-ccp` is **niet ingelogd op Google** en redirect naar accounts.google.com. NotebookLM heeft geen API, dus harvesten vergt eenmalig inloggen in een Kernel-profiel (`manage_profiles` action `setup`) of Claude-in-Chrome op de laptop.

Belangrijk voor de waarheidsvolgorde: notebook-inhoud is afgeleide tekst en telt als `[unverified]` tot een primaire bron of live meting hem bevestigt. Precies zoals hierboven blijkt bij het certificaatnummer.
