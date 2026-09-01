---
type: operator-prompt
scope: CCP · Channable 314525 · kanaal eBay DE (159122) · regel 28231746
status: klaar om te plakken
versie: 2 — bulletproof
created: 2026-08-20
last_reviewed: 2026-08-20
bron: live inspectie Build-mapping 57357 + regels 28120292 / 28119550 / 27874006 / 28202493, en UI-leerpunten uit de Kernel-sessies van 19 en 20 augustus
---

# Operator-prompt v2 — Build-velden vullen

Plak alles tussen de streepjes in Claude in Chrome, met Channable open en ingelogd.

---

## PROMPT — kopieer vanaf hier

Je bestuurt **Channable** in Chrome voor Connect Car Parts. Je werkt in **project 314525** (company 101300), kanaal **eBay** met API-id **159122**. Werk stap voor stap en rapporteer na elke stap. Ga niet door naar de volgende stap als de vorige niet klopt.

### 0 · Context — lees dit eerst, het verklaart de opdracht

Op eBay Duitsland staan 1.167 actieve remblok-listings. Op die listings zijn zes item specifics leeg, terwijl de data in Channable wél bestaat. Dat komt door een veldnaam-mismatch: er zijn drie actieve regels die keurig draaien, maar hun resultaat in een ander veld zetten dan de Build-stap uitleest.

| eBay-attribuut | Build-stap **leest** | Bestaande regel **schrijft naar** |
|---|---|---|
| Einbauposition | `einbauposition_ebay` | `ebay_de_bremsbelage_einbauposition` |
| Produktart | `produktart` | `ebay_de_bremsbelage_produktart` |
| Oe/Oem Referenznummer(n) | `oe_nummern_kurz` | `oe_reference` |

Jouw taak is **niet** die drie regels aanpassen. Jouw taak is één bestaande, nog lege regel vullen die de waarden overzet naar de velden die de Build wél leest.

Die regel bestaat al: **id 28231746**, naam **`DE | AA01 | Build-velden vullen`**, staat onderaan de regellijst van kanaal eBay. Hij staat nu op `alle → alle velden → doe niets` en doet dus niets.

### 1 · Harde guardrails — overtreden betekent stoppen en melden

1. Klik **nooit** op **"Uitvoeren"** of **"Run now"**. Alleen op **"Regel opslaan"**. Het kanaal staat op *Publiceer* en draait op scheduled syncs; elke opgeslagen wijziging gaat vanzelf mee met de eerstvolgende run. Dat is de bedoeling. Handmatig uitvoeren is dat niet.
2. Wijzig **uitsluitend** regel **28231746**. Raak geen andere regel aan, ook niet om "even te kijken en terug te zetten".
3. Kom **niet** aan de regel **"SKU Filter 400 producten_copy"**, niet aan import **745824**, en niet aan master-regelgroepen — met name niet aan **"Omschrijvingen" (321808)**, die is gedeeld over alle kanalen.
4. Kom **niet** aan de **Build-stap** (stap 4 Opbouw). De attribuutkoppeling daar is correct en wordt gedeeld met remschijven; één verkeerde klik raakt twee categorieën.
5. **Verzin geen veldnamen.** Gebruik alleen namen die je letterlijk in de veldkiezer ziet staan. Staat een veld er niet, dan bestaat het niet — meld dat en sla die sectie over.
6. Typ **geen merknamen of vaste teksten** in deze regel. Alles is `kopieer waarde` uit een bestaand veld.
7. Verwijder niets. Voeg geen secties toe die hieronder niet staan.
8. Twijfel je over een klik? Niet klikken. Beschrijf wat je ziet en vraag het.

### 2 · Bekende valkuilen in deze UI — hier gaat het meestal mis

Deze zijn met de hand vastgesteld in eerdere sessies. Ze schelen je een half uur.

- **Het regel-overzicht zit op `/apis/159122/operators`**, niet op `/rules`.
- **Elke sectie heeft zijn eigen IF.** Channable kent géén regel-brede conditie. Laat je een sectie zonder conditie staan, dan raakt hij **alle ~24.000 items**. Dit is de gevaarlijkste fout die je kunt maken.
- **De veldkiezer opent niet altijd op een gewone klik.** Werkt hij niet: klik precies in het midden van het invoervak, of gebruik muis-omlaag + muis-omhoog met een korte pauze ertussen. Er verschijnt dan een zoekvak met placeholder **"Zoeken"**.
- **De veldkiezer is gevirtualiseerd.** Een exacte naam als `material` staat vaak buiten beeld terwijl er tien lijkende namen boven staan. Typ de volledige naam in het zoekvak en klik de **exacte** treffer aan — niet de eerste de beste.
- **Let op bijna-identieke namen.** `einbauposition_ebay` is iets anders dan `einbauposition_de` en iets anders dan `ebay_de_bremsbelage_einbauposition`. Alle drie bestaan. Lees twee keer.
- **De operator-dropdowns negeren programmatische selectie.** Selecteer met de muis.
- **Preview (stap 6) is leeg tot de volgende build.** Verifiëren doe je via **"Items na"** bij de regel zelf, niet via Preview en niet via Items.

### 3 · Uit te voeren — vier secties in regel 28231746

Open `https://app.channable.com/companies/101300/projects/314525/apis/159122/operators` en klik in de lijst op **`DE | AA01 | Build-velden vullen`**.

De conditie is voor alle vier de secties **exact hetzelfde**:

```
Als   categories_clean   bevat   remblok
```

Let op: `remblok` in kleine letters en zonder -ken. Dat matcht zowel *Remblokken* als *remblok*.

**Sectie 1 — Einbauposition**
```
Dan neem   einbauposition_ebay
en         kopieer waarde   uit   ebay_de_bremsbelage_einbauposition
```

**Sectie 2 — Produktart**
```
Dan neem   produktart
en         kopieer waarde   uit   ebay_de_bremsbelage_produktart
```

**Sectie 3 — OE-nummers**
```
Dan neem   oe_nummern_kurz
en         kopieer waarde   uit   oe_reference
```

**Sectie 4 — Material** *(alleen als het bronveld bestaat)*
```
Dan neem   material
en         kopieer waarde   uit   ebay_de_bremsbelage_material
```
Bestaat `ebay_de_bremsbelage_material` niet in de kiezer, probeer dan `materiaal`. Bestaat die ook niet: **sla sectie 4 over** en meld het. Niet improviseren.

Klik daarna op **"Regel opslaan"**.

### 4 · Verificatie — verplicht, dit is geen formaliteit

Herlaad de pagina van de regel en controleer eerst dat de vier secties er nog staan zoals je ze hebt gebouwd. Channable kan een sectie stilzwijgend laten vallen als een veld niet geaccepteerd werd.

Ga daarna naar **"Items na"** bij deze regel en zoek deze vijf SKU's op. Dit zijn echte artikelen met bekende waarden — vergelijk, vink niet alleen af of er iets staat:

| SKU | Verwacht `einbauposition_ebay` | Verwacht `produktart` | `oe_nummern_kurz` begint met |
|---|---|---|---|
| `35001` | Hinterachse | Bremsbelagsatz | `2K5698451C` |
| `35018` | Vorderachse | Bremsbelagsatz | `1610428780` |
| `37411` | Hinterachse | Bremsbelagsatz | niet leeg |
| `36784` | Vorderachse | Bremsbelagsatz | niet leeg |
| `37307` | Vorderachse | Bremsbelagsatz | niet leeg |

Controleer daarnaast:

- **Geen lekkage buiten remblokken.** Zoek drie remschijven op (SKU `16883`, `18825`, `17541`) en bevestig dat `produktart` daar nog steeds `Bremsscheibe` is en niet `Bremsbelagsatz`. Als dat wél veranderd is, is een conditie fout gegaan — meld het en sla niets meer op.
- **Lengte OE.** Geen enkele `oe_nummern_kurz` boven 65 tekens.

### 5 · Terugdraaien als het misgaat

Er is niets destructiefs aan deze regel — hij vult alleen lege velden. Gaat er toch iets mis:

1. Open regel 28231746
2. Klik **"Pauzeer regel"**
3. Meld precies wat je zag: welke sectie, welk veld, welke waarde

Pauzeren zet alles terug naar de situatie van vóór vandaag. Verwijder de regel niet.

### 6 · Wat je expliciet NIET doet in deze opdracht

- Je repareert **niet** de mismatch in de Build-stap waar `Vergleichsnummer` en `Oe/Oem Referenznummer(n)` allebei aan `oe_nummern_kurz` hangen. Dat is een aparte opdracht.
- Je voegt **geen** Brembo-sectie toe aan regel 28202493 `Hersteller`. Ook aparte opdracht.
- Je raakt `besonderheiten` en `lieferumfang` niet aan — daar bestaat geen bronveld voor.

### 7 · Rapporteer in dit format

```
REGEL 28231746 — af / gedeeltelijk / gestopt

Secties opgeslagen:
  1 Einbauposition        ja/nee   bronveld gebruikt: ...
  2 Produktart            ja/nee   bronveld gebruikt: ...
  3 OE-nummers            ja/nee   bronveld gebruikt: ...
  4 Material              ja/nee/overgeslagen   reden: ...

Na herlaad nog aanwezig: ja/nee

Verificatie op 5 SKU's:
  35001  einbauposition=...  produktart=...  oe=...
  35018  einbauposition=...  produktart=...  oe=...
  37411  einbauposition=...  produktart=...  oe=...
  36784  einbauposition=...  produktart=...  oe=...
  37307  einbauposition=...  produktart=...  oe=...

Regressiecheck remschijven (16883 / 18825 / 17541):
  produktart nog Bremsscheibe: ja/nee

Langste oe_nummern_kurz: ... tekens

Afwijkingen / wat ik niet kon:
Vraag aan Hans:
```

## (einde prompt)

---

## Voor jezelf — wat er na deze regel nog openstaat

1. **Vergleichsnummer loskoppelen.** In de Build-stap van categorie 57357 wijzen zowel `Vergleichsnummer` als `Oe/Oem Referenznummer(n)` naar `oe_nummern_kurz`. Zodra dat veld gevuld raakt, krijgen twee verschillende eBay-attributen dezelfde waarde. Feitelijk onjuist: OE-nummers zijn fabrikantreferenties, Vergleichsnummern zijn nummers van concurrerende merken.
2. **Brembo-merksectie.** Regel 28202493 `Hersteller` luidt nu: *als `hersteller` leeg is → `A.B.S.`*, zonder merkconditie. Voor de 1.167 A.B.S.-listings klopt dat. Gaat Brembo live, dan krijgen die 1.501 artikelen ook `A.B.S.` — een onjuiste merkclaim op een listing. Er moet een sectie bóven de fallback: SKU begint met `P` of met `08.`/`09.` → `Brembo`.
3. **`besonderheiten` en `lieferumfang`** blijven leeg tot A.B.S. de TecDoc-criteria levert.
