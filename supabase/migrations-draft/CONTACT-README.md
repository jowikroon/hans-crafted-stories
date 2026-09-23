# Contactformulier v3: draft, niet uitgevoerd

Status: **reviewbare draft**. Er is niets uitgevoerd in een Supabase-project en er is niets gedeployed.

Doelproject: **`pesfakewujjwkyybwaom`**. Dit is hetzelfde project als in de live websitebundle.

Let op: `supabase/config.toml` wijst naar een ánder project. Gebruik daarom nooit een generieke `supabase db push` of `supabase functions deploy`.

## Ontwerp

```
browser (alleen productiedomein, na Turnstile)
  └─POST─> Edge Function contact-submit    supabase/functions-draft/contact-submit/
             ├─ Origin-allowlist, honeypot, validatie (zelfde regels als CHECK)
             ├─ Turnstile siteverify, fail-closed (geen geheim ⇒ 503, niets opgeslagen)
             └─POST─> /rest/v1/rpc/contact_submit    (server-side sleutel, EXECUTE alleen service_role)
                        └─ INSERT contact_submissions
                             ├─ CHECK-constraints
                             └─ trigger: vergrendelde sliding-window-limiter (3/e-mail, 30 totaal per 10 min)
```

- **Geen omzeilbare directe inserts.** `anon`, `authenticated` en andere API-rollen hebben geen INSERT/UPDATE op de tabel en geen EXECUTE op de RPC. Ook `service_role` heeft geen directe tabelrechten: alleen de RPC.
- **Default privileges.** In het doelproject geven default privileges nieuwe tabellen en functies automatisch aan anon/authenticated en andere rollen. Daarom trekt de migratie de rechten expliciet per rol in. `REVOKE … FROM public` alleen is daar niet genoeg.
- **Lezen en verwijderen** mag alleen `authenticated` met `has_role(auth.uid(), 'admin')` (RLS).
- **Grenzen.** De limiter is een backstop en geen botbescherming. De globale limiet kan bewust worden opgebruikt; Turnstile is de primaire drempel. Er is geen per-IP-limiet, omdat doorgestuurde IP-headers niet te vertrouwen zijn.
- **Notificatie.** Opslaan is geen notificatie. Een geslaagde insert bewijst niet dat Hans een mail heeft gekregen. De zichtbare e-mailuitwijk blijft staan.

## Bestanden

| Bestand | Doel |
|---|---|
| `contact_submissions.up.sql` | Tabel, limiter, RPC, rechten en RLS in één transactie. Faalt bewust als de tabel al bestaat. |
| `contact_submissions.verify.sql` | Read-only controle. Faalt hard bij de eerste afwijking en vangt geen exceptions af. |
| `contact_submissions.disable.sql` | Niet-destructieve terugval: blokkeert nieuwe inzendingen en bewaart alle leads. |
| `test/test_contact_v3.py` | Geïsoleerde PG17-test op deze exacte bestanden, uitgevoerd als niet-superuser `postgres`, met het productie-privilegemodel. |
| `../functions-draft/contact-submit/` | Edge Function met Deno-unittests (`deno test supabase/functions-draft/contact-submit/`). |

## Uitvoering (alleen na expliciete productieautorisatie)

1. Maak een aparte server-side sleutel aan (`sb_secret_…`, naam bijv. `contact-submit`). Maak een Turnstile-widget aan met hostname `hansvanleeuwen.com`.
2. SQL-editor van **pesfakewujjwkyybwaom**: voer `contact_submissions.up.sql` uit en daarna `contact_submissions.verify.sql`. Verwacht de notice `alle checks OK (submit-status: actief)`.
3. Zet de function-secrets op dit project: `CONTACT_DB_KEY`, `TURNSTILE_SECRET_KEY` en optioneel `CONTACT_ALLOWED_ORIGINS`. `SUPABASE_URL` levert het platform zelf.
4. Deploy vanuit een tijdelijke werkmap, zodat de draftmap niet in `supabase/functions/` belandt:
   ```
   mkdir -p /tmp/cs/supabase/functions && cp -r supabase/functions-draft/contact-submit /tmp/cs/supabase/functions/
   supabase functions deploy contact-submit --project-ref pesfakewujjwkyybwaom --no-verify-jwt --workdir /tmp/cs
   ```
   Het endpoint gebruikt `--no-verify-jwt`, omdat de browser geen gebruikers-JWT heeft. De autorisatie loopt via Turnstile plus Origin, en de databasekant via de RPC-rechten.
5. Vercel production-env: `VITE_TURNSTILE_SITE_KEY` (publieke sitekey). Pas daarna de frontend releasen.
6. Smoke test, één keer, met een eigen adres: verwacht één lead zichtbaar voor de admin. Een tweede poging zonder token moet 403 geven.

## Rollback

- **Operationeel:** voer `contact_submissions.disable.sql` uit. De RPC gaat dicht en de leads blijven bewaard. De frontend toont dan een fout plus de e-mailuitwijk.
- **Frontend:** een deploy zonder `VITE_TURNSTILE_SITE_KEY` betekent geen widget. Het formulier geeft dan "spamcontrole niet afgerond" en de e-mailuitwijk blijft zichtbaar.
- **Edge Function:** eerdere versie terugzetten of de functie verwijderen. Geen invloed op opgeslagen leads.
- **Geen `DROP TABLE` als routinematige rollback.** Verwijderen gebeurt alleen na een expliciet besluit en als de tabel aantoonbaar leeg is.
