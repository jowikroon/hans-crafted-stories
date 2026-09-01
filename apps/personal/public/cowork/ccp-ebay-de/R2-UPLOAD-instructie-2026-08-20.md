---
type: instructie
scope: CCP · Cloudflare R2 · 3.442 remblok-afbeeldingen
status: wacht op sleutels
created: 2026-08-20
last_reviewed: 2026-08-20
---

# R2-upload — alles staat klaar, alleen de sleutels ontbreken

## 1 · Wat er in de env moet

In `_skill/adapters/.env`. `CLOUDFLARE_ACCOUNT_ID` staat er al, die hoeft niet opnieuw.

```
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
```

**Waar je ze haalt:** Cloudflare dashboard → R2 → **Manage R2 API Tokens** → *Create API token* → permission **Object Read & Write**, scope beperkt tot deze ene bucket. Je krijgt dan een Access Key ID en een Secret Access Key. De secret zie je één keer.

**`R2_BUCKET` is de bucketnaam, niet de publieke URL.** De naam staat in het R2-overzicht boven de bucket. `pub-92e364856d48455eae5e22a6d7ef618f.r2.dev` is het publieke domein van die bucket, niet zijn naam.

Zet de sleutels er machine-to-machine in — niet in de chat plakken.

## 2 · Wat er dan gebeurt

Script: `_cowork/ccp-ebay-de/scripts/r2-upload-remblokken.py`

```bash
python3 r2-upload-remblokken.py            # dry-run, telt alleen
python3 r2-upload-remblokken.py --upload   # echt uploaden
```

Eigenschappen:

- **Idempotent.** Leest eerst de bucket uit en slaat over wat er al staat. Je kunt hem zonder risico twee keer draaien.
- **Zet `Content-Type: image/jpeg`** en `Cache-Control: public, max-age=31536000` — eBay weigert bestanden zonder correct content-type.
- **Faalt niet stil.** Meldt per bestand als het misgaat, met de eerste vijf fouten uitgeschreven.
- Voortgang elke 200 bestanden.

Verwachting: 3.442 bestanden, 186 MB. Bij een normale verbinding tien tot vijftien minuten.

Als de sleutels ontbreken stopt hij meteen met een nette melding — dat is nu ook het geval, ik heb hem al gedraaid als test.

## 3 · Daarna de vier listings

`ebay-revise-FIX-4-afbeeldingen-2026-08-20.csv` staat klaar. Vier regels, kolommen `Action`, `ItemID`, `CustomLabel`, `PicURL`.

| SKU | ItemID | Was | Wordt |
|---|---|---|---|
| 36133 | 257692306262 | 400×498 | 1600×1600 |
| 36056 | 257692306289 | 400×425 | 1600×1600 |
| 36077 | 257692306388 | 400×445 | 1600×1600 |
| 37700 | 257692306393 | 400×467 | 1600×1600 |

Alle vier lokaal gecontroleerd: exact 1600×1600, 59–75 kB.

**Belangrijk: eerst uploaden, dan pas dit bestand.** Wijst `PicURL` naar een bestand dat nog niet in de bucket staat, dan weigert eBay opnieuw — en dan heb je twee mislukte pogingen op dezelfde listing.

Controleer vóór de upload één URL in je browser. Krijg je het beeld te zien, dan is de bucket publiek bereikbaar en klopt de sleutel. Krijg je een 404, dan is het bestand er niet; krijg je een 401, dan staat de bucket niet publiek.

## 4 · Wat dit verder oplevert

Die vier zijn de zichtbare gevallen. Het echte gewin is dat na de upload **alle 3.442 remblokken een 1600×1600-hoofdafbeelding hebben** — de mandatory quality-fout `image_main_1600` in Channable, die nu op 100% leeg staat, gaat daarmee dicht.

Let op de aard van de bewerking: het beeld is op een wit 1600×1600 canvas gezet, niet opgeschaald. Het onderwerp blijft even scherp als het origineel van circa 600×400. eBay stelt eisen aan de canvasmaat, niet aan de scherpte, dus dit voldoet. Wil je écht scherpere productfoto's, dan is dat nieuwe fotografie of de Creatives-module — een aparte beslissing.
