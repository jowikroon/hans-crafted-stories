# Geverifieerde SKU → eBay DE ItemID (Seller Hub, 21-07-2026)

Deze staan ook ingebouwd in `scripts/build_ebay_compat.py` (dict `ITEMID`). Nieuwe SKU's toevoegen:
verifieer live in Seller Hub en lever een `sku,itemid`-CSV aan via `--itemid-map`, of breid de dict uit.

| SKU   | Titel                                   | ItemID         | EAN            | Status      |
|-------|-----------------------------------------|----------------|----------------|-------------|
| 16880 | ABS 16880 Bremsscheibe Vorne Ø256       | 257626217845   | 8717109021424  | live        |
| 18537 | ABS 18537 Bremsscheibe Hinten Ø300      | 257624435711   | 8717109674705  | live        |
| 37414 | ABS 37414 Bremsbelagsatz Vorne          | 257626217817   | 8717109260243  | live        |
| 37760 | ABS 37760 Bremsbelagsatz Vorne          | 257626217754   | 8717109501667  | live        |
| 17521 | —                                       | —              | —              | NIET actief |
| 18117 | —                                       | —              | —              | NIET actief |

## Status van de KType-koppeling (21-07-2026)
- **16880** (Bremsscheibe) — 438 KTypes in de export; 425 live gekoppeld, 13 door eBay's MVL geweigerd
  (bestaan niet in de MVL). Groene stripe actief: "Teil ist kompatibel mit 425 Fahrzeug(en)".
- **18537** (Bremsscheibe) — 161 KTypes; alle 161 geaccepteerd.
- **37414 / 37760** (Bremsbeläge) — **KTypes ontbreken nog** in de ABS-export. De specialist moet de
  TecDoc-koppeltabel (sku → ktype) apart aanleveren; de specs/OE-export bevat geen ktypes.

## De 13 door eBay geweigerde KTypes van 16880 (ter info)
136274, 132363, 132366, 136277, 141738, 800134, 136275, 132368, 800136, 116534, 136276, 100786, 800135.
Patroon: de 800xxx-reeks en enkele hoge 13xxxx-nummers — vrijwel zeker verouderde/niet-gepubliceerde
TecDoc-ID's. Niets aan te fixen (ze bestaan niet in eBays MVL). Draai met MVL-validatie om ze vooraf
uit te filteren en warnings te vermijden.
