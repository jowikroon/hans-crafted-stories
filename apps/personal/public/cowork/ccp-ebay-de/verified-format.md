# Geverifieerd eBay DE compatibiliteits-importformaat

Bron van waarheid: eBay's eigen sample `Upload_Fahrzeugverwendungsliste_Autoteile.xlsx`
(Verkauferportal, gecontroleerd 21-07-2026) plus een geslaagde live upload op 21-07-2026
(16880: 425/438 geaccepteerd, 18537: 161/161 geaccepteerd).

## Structuur (hiërarchisch)
```
Action,ItemID,Relationship,Relationship Details
Revise,257626217845,,
Add,,Compatibility,ktype=8798|Notes=Vorderachse
Add,,Compatibility,ktype=9306|Notes=Vorderachse
Revise,257624435711,,
Add,,Compatibility,ktype=108003|Notes=Hinterachse
```

## Harde regels
- Kolommen exact: `Action, ItemID, Relationship, Relationship Details`.
- **Artikelregel**: `Revise` + de echte ItemID; kolommen `Relationship` en `Relationship Details` LEEG.
- **Per voertuig een aparte regel**: `Add`, `ItemID` LEEG, `Relationship=Compatibility`,
  `Relationship Details=ktype=<id>`.
- Keyword is **lowercase** `ktype=` (niet `KType=`).
- Optionele note achter de ktype: `|Notes=<tekst>` (hoofdletter N), bv. de Einbauposition.
- **Nooit** meerdere ktypes in één cel (`ktype=1|ktype=2`) — dat is fout. Eén voertuig per regel.
- Elk voertuig maximaal **1×** per listing. Dubbele ktype = afkeuring.
- Regeleindes **LF**, encoding **UTF-8 zonder BOM**.
- `Action` op de compat-regels: `Add` voegt toe aan de bestaande lijst; `Revise` vervangt de hele
  lijst. Pilot-listings hadden nog geen compatibiliteit, dus `Add` is juist. Wil je een bestaande
  lijst volledig herschrijven, gebruik dan `--action Revise`.

## Waarom geen "meerdere ktypes per cel"
Een eerder AI-gegenereerd testbestand propte `KType=..|KType=..` in één cel. Dat is niet het
officiële patroon en werd terecht als fragiel/fout aangemerkt. eBay's sample bewijst: één voertuig
per regel, hiërarchisch onder de artikelregel.

## Foutcodes bij upload (resultaatbestand)
- `25023` — Invalid compatibility information (ongeldige/onbekende ktype, of categorie ondersteunt
  geen Parts Compatibility).
- Ongeldige `ProductIdentifier` / ItemID — het advertentienummer bestaat niet of is niet actief.
- Warnings over individuele ktypes die niet in de MVL staan: die voertuigen bestaan niet in eBays
  database; de overige regels worden gewoon gekoppeld. Draai vooraf met MVL-validatie om deze
  warnings te vermijden.

## Limieten
- Max. **3.000 voertuigregels per listing**, geteld **geëxpandeerd per bouwjaar** (een ktype met
  bouwperiode 2000–2005 telt als 6). Boven de limiet splitsen over max. 5 listings zonder overlap.
- Bestandsgrootte max. 15 MB (25 MB via Merchant Integration Platform).
