---
type: operator-prompt
scope: CCP · Channable 314525 · kanaal eBay DE (159122) · regel 28231746
status: klaar om uit te voeren
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live inspectie Build-mapping 57357 + regels 28120292, 28119550, 27874006
---

# De oorzaak: drie regels schrijven naar het verkeerde veld

Ik heb de Build-mapping van categorie 57357 uitgelezen en de regels ernaast gelegd. Het patroon is drie keer hetzelfde — precies dezelfde fout als bij de omschrijving gisteren.

| eBay-attribuut | Build **leest** | Regel **schrijft naar** | Regel |
|---|---|---|---|
| Einbauposition | `einbauposition_ebay` | `ebay_de_bremsbelage_einbauposition` | 28120292 · actief |
| Produktart | `produktart` | `ebay_de_bremsbelage_produktart` | 28119550 · actief |
| Oe/Oem Referenznummer(n) | `oe_nummern_kurz` | `oe_reference` (alleen ingekort op 65) | 27874006 · actief |

Geen van de drie is gepauzeerd. Ze doen precies wat er staat — alleen landt het resultaat in een veld dat de Build niet leest. Daarom staan die attributen leeg op 1.167 listings terwijl de regels netjes draaien.

Ook gevonden: `Vergleichsnummer` en `Oe/Oem Referenznummer(n)` zijn allebei gekoppeld aan `oe_nummern_kurz`. Twee verschillende attributen, één veld.

## Wat er klaarstaat

Regel **28231746 · `DE | AA01 | Build-velden vullen`** is aangemaakt op kanaal eBay DE, onderaan de lijst. Hij staat nu op `alle → alle velden → doe niets`, dus hij doet niets. Hij hoeft alleen gevuld te worden.

Ik kreeg hem niet afgebouwd: de headless browser krijgt de veldkiezer van de Build-stap niet geladen (15 velden blijven op "Bezig met laden") en de dropdowns in de regeleditor reageren onbetrouwbaar. Op jouw laptop met Claude in Chrome is dit een kwestie van vijf minuten.

## Prompt voor Claude in Chrome

```
Je bestuurt Channable. Project 314525, kanaal eBay (159122), regel 28231746
"DE | AA01 | Build-velden vullen". Die regel bestaat al en is leeg.

Doel: de velden vullen die de Build-stap daadwerkelijk leest.

HARDE REGELS
- Klik nooit op "Uitvoeren". Alleen "Regel opslaan".
- Kom niet aan andere regels, niet aan de SKU-filter, niet aan master-groepen.
- Verzin geen veldnamen. Staat een veld niet in de kiezer, meld dat en stop.

Bouw vier secties. Elke sectie krijgt zijn eigen volledige conditie —
Channable heeft geen regel-brede gate.

Conditie voor alle vier: categories_clean  bevat  remblok

SECTIE 1
  Dan neem  einbauposition_ebay
  en        kopieer waarde  uit  ebay_de_bremsbelage_einbauposition

SECTIE 2
  Dan neem  produktart
  en        kopieer waarde  uit  ebay_de_bremsbelage_produktart

SECTIE 3
  Dan neem  oe_nummern_kurz
  en        kopieer waarde  uit  oe_reference

SECTIE 4
  Dan neem  material
  en        kopieer waarde  uit  ebay_de_bremsbelage_material
  (bestaat dat veld niet, probeer dan materiaal; bestaat ook dat niet,
   sla sectie 4 over en meld het)

Sla op. Ga daarna naar "Items na" van deze regel en controleer bij vijf
remblok-SKU's dat einbauposition_ebay, produktart en oe_nummern_kurz
een waarde hebben. Rapporteer die vijf.
```

## Waarom kopiëren en niet de Build-mapping omzetten

De Build-mapping omzetten naar `ebay_de_bremsbelage_*` kan ook en is even correct. Ik kies kopiëren omdat de Build-mapping per categorie is en ook door remschijven (33564) wordt gebruikt — één fout klikje daar raakt twee categorieën. Een regel onderaan het kanaal raakt alleen wat de conditie toelaat.

## Nog te doen na deze regel

1. **Vergleichsnummer loskoppelen** van `oe_nummern_kurz` in de Build-stap — nu krijgen twee verschillende attributen dezelfde waarde.
2. **Brembo-sectie** boven de fallback in regel 28202493 `Hersteller`: SKU begint met `P` of `08.`/`09.` → `Brembo`. Zonder dat krijgt Brembo straks `A.B.S.` als merk.
3. `besonderheiten` en `lieferumfang` hebben geen bron — die blijven leeg tot TecDoc levert.

## Wat vandaag al wél live staat

Regel 28202493 `Hersteller` is aangepast van `ABS` naar **`A.B.S.`**, opgeslagen en na herlaad geverifieerd. Dat is het attribuut waarop eBay 0 scoorde en het zwaarste van de zeven. Die verbetering zit in de push die je nu doet.
