---
type: infrastructuur + status
scope: CCP · Cloudflare R2 · productafbeeldingen · Channable-import 849793
status: live
created: 2026-08-20
last_reviewed: 2026-08-20
---

# R2-afbeeldingen — permanent geregeld

## 1 · Toegang, permanent vastgelegd

De R2-sleutels stonden niet in `everything.env` en hoefden ook niet: **de bestaande `CLOUDFLARE_API_TOKEN` werkt als S3-credential.** Dat is de officiële Cloudflare-methode:

- **Access Key ID** = het token-ID (uit `/user/tokens/verify`)
- **Secret Access Key** = SHA-256 van de tokenwaarde

Weggeschreven in `_skill/adapters/.env` — machine-to-machine, niet in chat:

```
R2_ACCOUNT_ID       (= CLOUDFLARE_ACCOUNT_ID)
R2_ENDPOINT         https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID    (token-id)
R2_SECRET_ACCESS_KEY (sha256 van de tokenwaarde)
R2_BUCKET           ccp-product-images
R2_PUBLIC_BASE      https://pub-9ccb70216ac94f948be5a3b58f14b2e8.r2.dev
```

Rotatie: verandert de `CLOUDFLARE_API_TOKEN`, dan moet `R2_SECRET_ACCESS_KEY` opnieuw berekend worden. Het script rekent dat niet zelf uit — dat staat in de vault genoteerd zodat het niet zoekraakt.

## 2 · Belangrijke correctie: verkeerde bucket in de oude URL's

De URL's die in `product_inputs` stonden wezen naar **`pub-92e364856d48455eae5e22a6d7ef618f.r2.dev`**. Die bucket zit **niet in dit Cloudflare-account**. In dit account staan er drie:

| Bucket | Publiek domein | Publiek aan |
|---|---|---|
| **ccp-product-images** | `pub-9ccb70216ac94f948be5a3b58f14b2e8.r2.dev` | **nu ja** (stond uit) |
| hansvanleeuwen | pub-0ddc3d62…r2.dev | ja |
| hvl-blog-media | pub-99b350bf…r2.dev | nee |

`ccp-product-images` was leeg en het publieke domein stond uit. Beide nu geregeld. De oude URL's zijn dus nooit de onze geweest — goed dat we daar niet op zijn gaan bouwen.

## 3 · Wat er nu staat

**3.442 afbeeldingen, 178,4 MB, bucket `ccp-product-images`.**

- Alle remblokken: 1.941 A.B.S. + 1.501 Brembo
- Exact 1600 × 1600, wit canvas, JPEG kwaliteit 88, gemiddeld 53 kB
- `Content-Type: image/jpeg`, `Cache-Control: public, max-age=31536000`
- Publiek bereikbaar, met curl geverifieerd op meerdere keys

Naamgeving:
```
<sku-met-streepjes>_<ean>/<sku-met-streepjes>_<ean>_REMBLOKKEN_MAIN.jpg
35001_8717109627077/35001_8717109627077_REMBLOKKEN_MAIN.jpg
P-02-001_8020584102619/P-02-001_8020584102619_REMBLOKKEN_MAIN.jpg
```

**Let op bij testen:** `r2.dev` weigert requests met een Python-urllib user-agent (403). Met curl of een browser krijg je gewoon 200. Niet schrikken van een 403 in een scriptje.

## 4 · Doorgekoppeld naar Supabase

`ccp_sku_attributes.image_main_1600` staat voor alle 3.442 remblokken op de nieuwe publieke URL. `image_status` = `live in R2 bucket ccp-product-images`.

## 5 · Doorgekoppeld naar Channable — zonder UI-werk

Import **849793 "CCP Attributen"** blijkt een JSON-import te zijn op:

```
kskumhtisifsdjjbzvbo.supabase.co/rest/v1/v_channable_import?select=*&order=sku&limit=5000
```

Door `select=*` **komt elke nieuwe kolom in die view automatisch mee**. Daarom is `image_main_1600` aan `v_channable_import` toegevoegd — geen dropdown, geen mapping, geen risico.

Stand van de view nu:

| Veld | Gevuld van 3.690 |
|---|---|
| `image_main_1600` | 3.442 (alle remblokken) |
| `hersteller` | 3.690 |
| `einbauposition_ebay` | 3.655 |
| `oe_nummern_kurz` | 2.180 |

## 6 · Dit verklaart de lege attributen in de preview

De preview van vanmiddag toonde Einbauposition op 115 en OE op 0. **De data is niet stuk — de import is verouderd.** De bron levert 3.655 posities en 2.180 OE-strings; Channable heeft die simpelweg nog niet opgehaald.

De view produceert trouwens zelf al `hersteller` (Brembo voor `^P`, anders `A.B.S.`) en `einbauposition_ebay` in Vorne/Hinten-vorm. Die logica zat er dus altijd al in.

**Volgende actie:** import 849793 vernieuwen in Channable (`Opslaan & import vernieuwen` op de importpagina, of wachten op de volgende automatische run). Daarna opnieuw naar de preview kijken.

## 7 · De vier mislukte listings

`ebay-revise-FIX-4-afbeeldingen-2026-08-20.csv` is bijgewerkt naar de nieuwe bucket. Alle vier URL's geven HTTP 200 met correct content-type. Klaar om te uploaden.

| SKU | ItemID | Was | Nu |
|---|---|---|---|
| 36133 | 257692306262 | 400×498 | 1600×1600 |
| 36056 | 257692306289 | 400×425 | 1600×1600 |
| 36077 | 257692306388 | 400×445 | 1600×1600 |
| 37700 | 257692306393 | 400×467 | 1600×1600 |

## 8 · Wat er nog niet is

- **Alleen remblokken.** De bronmap heeft 40.142 bestanden; wij hebben er 3.442 verwerkt. Remschijven, remklauwen en de rest wachten.
- **Alleen de hoofdafbeelding.** Eén beeld per SKU, geen extra hoeken.
- **Geen echte 1600×1600-scherpte.** Canvas-uitbreiding van circa 600×400. eBay stelt eisen aan de canvasmaat, niet aan de scherpte — dit voldoet, maar het is geen nieuwe fotografie.
