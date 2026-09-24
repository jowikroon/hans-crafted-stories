# Edit overlay: tekst live zetten én terugschrijven naar de bron

Sinds 2026-09-24. Tekst bewerken via de voorkant staat weer aan (was uit sinds #206),
nu met write-back naar de plek waar de tekst vandaan komt.

## Flow

```
admin klikt element → "Opslaan → bron"
  1. overlay (page_overrides, taal-gebonden)  → direct live voor bezoekers
  2. bron bepalen (in de browser)
       page_content-rij met exact deze tekst  → rij bijwerken (+ versie)   → klaar
       JSX-tekst / string in de code          → patch {file, line, find, replace}
       niet eenduidig of berekend             → alleen overlay, job = needs_manual
  3. job in overlay_source_edits (status queued)
       └ trigger → pg_net → n8n "Overlay Source Sync (HansOS)" (webhook overlay-source-sync)
            claim → patch toepassen op main → branch + PR → squash-merge
            → wacht tot /build.json de merge-commit bevat → overlay-tekst opgeruimd (status live)
```

## Onderdelen

| Onderdeel | Waar |
|---|---|
| Bron-tags `data-src="file:regel:kolom"` + `/__edit/source-map.json` + `/build.json` | `vite-plugins/editSourceMap.ts` (client- én SSR-build) |
| Decoderen/encoderen JSX-tekst en strings, patch met verificatie | `src/lib/editSource/codec.ts` (+ tests) |
| DOM-edit → exacte bronpatch (taal, NL/EN-takken, geneste elementen) | `src/lib/editSource/resolve.ts` (+ tests) |
| Overlay-provider (taalbewuste text-overrides, markup blijft heel) | `src/components/edit-overlay/EditOverlayProvider.tsx` |
| Panel (tekstveld, status, recente wijzigingen) | `src/components/edit-overlay/EditLayer.tsx` |
| Jobs, RPC's, trigger | `supabase/migrations/20260924100307_overlay_source_edits.sql` |
| Worker | n8n `Overlay Source Sync (HansOS)` op n8n.srv1402218.hstgr.cloud |

## Grenzen (bewust)

- Alleen tekst gaat terug naar de bron. Stijl-tweaks blijven een overlay-laag.
- Eén tekstdeel per bewerking: een wijziging die over opmaakgrenzen heen gaat
  (bijv. deels in een `<em>`) wordt niet automatisch teruggeschreven.
- Blogartikelen komen uit `blog_posts`: bewerken via Blog CMS (`/write`).
- Tekst die op meerdere plekken in de code staat en niet eenduidig te herleiden is,
  wordt nooit gegokt: status `needs_manual`, overlay blijft staan.

## Noodrem

n8n-workflow `Overlay Source Sync (HansOS)` deactiveren: bewerkingen blijven dan als
overlay live en jobs blijven `queued`. Na heractiveren opnieuw aftrappen:

```sql
select net.http_post('https://n8n.srv1402218.hstgr.cloud/webhook/overlay-source-sync',
                     jsonb_build_object('job_id', id))
from public.overlay_source_edits where status = 'queued';
```
