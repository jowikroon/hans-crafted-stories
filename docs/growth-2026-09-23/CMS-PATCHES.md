# CMS-patches 2026-09-23 — procedure (inhoud staat bewust níét in Git)

Deze repository is publiek. De CMS-patches bevatten originele artikelteksten (backup, rollback, diff) en staan
daarom **buiten Git en buiten elke deployment-output**, op de pc van Hans:

`C:\AI\audit-hans-2026-09-18\cms-patch-werkmap-2026-09-23\`

| Bestand | Inhoud | sha256 |
|---|---|---|
| `01-anonimisering.forward.sql` | 21 kolomwijzigingen in 7 gepubliceerde `blog_posts` (anonimiseringscopy §5–§6 + aanvullende naamloze klantcijfers) | `f68396f591adc4c4a79f217a9692ca5c3a2b1dbb60376b2fbead2de92d576771` |
| `01-anonimisering.rollback.sql` | terugzetten naar de geëxporteerde waarden | `6b81f04b9e79d71774bf52f6aead103dc48a2aa459108ce9e4289497f31b536e` |
| `02-i18n.forward.sql` | 5 ontbrekende vertalingen (i18n-audit R3), handmatig vertaald | `e628eeb2ffe94e46391ca4debe4baa07496af66c1d48cc50621dcf098967f597` |
| `02-i18n.rollback.sql` | rollback | `0612c851e1e5ed9a9986731800bab695f1aafee821a8e37e34a0d87232df867e` |
| `03-case-studies-nl.forward.sql` | 9 × `case_studies.description_nl` (NL voor /nl/work) | `455137e249f9a7477f97eedbcc495321900a038ea9f19bbe7702e17b793ec170` |
| `03-case-studies-nl.rollback.sql` | rollback | `babe65a97d6d1c4d15e8e8cb78219a6879835541e850afba0dd3759bb5da08de` |

Daarnaast in die map: `backup.json` (read-only export), `export-backup.mjs`, `replacements.mjs`, `build-sql.mjs`,
`DIFF.md` (voor/na per alinea) en `guard-check.sql`.

## Veiligheid van de SQL
- Elke UPDATE: `WHERE id = … AND md5(coalesce(kolom,'')) = <md5 geëxporteerde waarde>` en moet exact 1 rij raken,
  anders `RAISE EXCEPTION` → de hele transactie rolt terug. Gewijzigde rijen worden dus nooit overschreven.
- Rollback gebruikt dezelfde guard op de nieuwe waarde.
- `build-sql.mjs` scant elke nieuwe waarde op de klantclaim-patronen en stopt bij een treffer.
- Read-only controle op 2026-09-23 tegen productie (`guard-check.sql`): **35/35 guards matchen**.

## Toepassen (alleen na akkoord Hans)
1. Lees `DIFF.md`. Let op: het artikel-slug `vendor-of-seller-bol-com-alpine` blijft ongewijzigd (URL-wijziging =
   aparte keuze met 308-redirect; een redirect wist historische koppelingen niet).
2. Draai `node export-backup.mjs` opnieuw vlak vóór toepassen en daarna `node build-sql.mjs` (verse hashes).
3. Supabase SQL-editor → project `pesfakewujjwkyybwaom` → `01…forward.sql`, dan `02`, dan `03`.
4. **Let op:** een wijziging aan `blog_posts` verhoogt `updated_at` en triggert de GitHub-workflow
   *content-redeploy* → productie-rebuild. Toepassen = publiceren. Doe dit pas als de code-PR's gemerged zijn,
   anders bouwt productie de nieuwe artikeltekst met de oude site.
5. Controle: `node apps/personal/scripts/anonymity-guard.mjs` na een build moet 0 CMS-treffers melden.
6. Rollback: de `*.rollback.sql` in omgekeerde volgorde (03, 02, 01).

Historische zoekresultaten, caches, eerdere git-commits en eerder gedeelde kopieën worden hiermee niet gewist.
