# CMS-patch 04: positionering marketplace manager (2026-09-24)

**Status: voorbereid, niet uitgevoerd.** De patchbestanden (forward, rollback en guard-check) staan buiten deze
publieke repo in de private werkmap `cms-patch-werkmap-2026-09-24`. Een CMS-write kan de content-redeploy
starten en staat daarmee gelijk aan publiceren. Alleen uitvoeren na expliciete autorisatie.

## Waarom

De homepage, About en de /work-kop lezen een deel van hun tekst uit `public.page_content`. De code negeert
sinds deze wijziging de sleutels uit `apps/personal/src/data/codeOwnedCms.ts`. Zo kan een oude CMS-rij de
nieuwe copy na het laden niet terugzetten, en tonen prerender (zonder CMS) en browser dezelfde tekst.

De patch ruimt de verouderde waarden op, zodat het CMS-beheerscherm dezelfde tekst laat zien als de site.

## Read-only inventaris (2026-09-24, doelproject van de site)

Van alle code-owned sleutels (home, about en work, inclusief `_nl`-varianten) bestaan er twee als rij.

| Pagina | Sleutel | md5 huidige waarde | Opmerking |
|---|---|---|---|
| about | `about_h1` | `396172d0407c49738f2dba7452937ec3` | Oude identiteit ("Interim E-commerce Manager …"). Zonder de code-owned regel zou de live EN-About-H1 na het laden hierop terugvallen. |
| about | `about_methodology_intro` | `aa9b19927d79bd439bb8c904d6fd4730` | Bevat een lange gedachtestreep |

- Geen `page_elements` op home, about of work staan op onzichtbaar.
- Guard-check: 2/2 matchen.

## Procedure

1. Draai `04-positionering.guard-check.sql` (read-only). Verwacht 2 rijen, allebei `match = true`.
2. Draai `04-positionering.forward.sql`. Die bevat id- en md5-guards, verwacht per update exact 1 rij, en rolt anders alles terug.
3. Controleer in het CMS-scherm en op de site: de H1 op /about is gelijk voor en na het laden.
4. Rollback: draai `04-positionering.rollback.sql`. Die zet de oude waarden alleen terug als de patchwaarde er nog staat.

De code blijft deze sleutels negeren; de rollback verandert de site dus niet.
