# Artist Radar: onafhankelijke staging en acceptatie

Datum: 2026-11-05. Status: **database- en deploymenttests deels geslaagd; echte aanmelding en browser-E2E nog niet geslaagd**. Geen productie-go.

## Grens en provenance

- Code: [concept-PR #492](https://github.com/jowikroon/hans-crafted-stories/pull/492), met de beveiligingsfix op commit `03b8624e6bd82f54d6bfd54d8d47c82f701898dd`.
- Afzonderlijke Supabase-projectnaam `jowikroon-artist-radar-staging-20261105`, ref `wwgmgqxchamvbhaxjezq`, regio `eu-central-1`, URL `https://wwgmgqxchamvbhaxjezq.supabase.co`. Het productieproject `pesfakewujjwkyybwaom` is niet aangepast.
- De eerste, mislukte ontwikkelbranch op productieproject liep vast bij migratie 13 van 328 (ontbrekende historische tabel `public.seo_news_digest`). Deze lege branch is verwijderd en de verwijdering gecontroleerd.
- Gebruiker heeft een nieuw standalone project tegen de bevestigde prijs van ongeveer $10 per maand, plus variabel gebruik, voor **30 dagen** goedgekeurd. Op of rond **2026-12-05**: afzonderlijk beoordelen of verwijderen; niet stilzwijgend blijven betalen of automatisch gegevens vernietigen.
- Een eenmalige evaluatieherinnering kon niet worden ingepland: het account heeft 15/15 actieve automatiseringen. Er is geen bestaande taak overschreven; **5 december blijft dus een handmatige vervolgdatum**.
- Geen productiedata, echte klantmails, betaalgegevens of credentials zijn naar staging gekopieerd.

## Wat is geïnstalleerd

1. Een minimale staging-only brontabel `public.artist_radar_concerts`, zonder publieke direct-SELECT, volgens [dit herhaalbare contract](artist-radar-staging-minimal-schema.sql). Dit is *niet* het complete productieconcertschema en bevat niet de upstream importer-/deduplicatiebeperkingen.
2. `20261105140000_artist_radar_accounts.sql`: volgt, voorkeuren, eigen accountactiviteit en brongebonden statushistorie met eigenaars-RLS, kolomrechten en quota.
3. `20261105141000_artist_radar_verified_ticket_links.sql`: brongecontroleerde externe ticketlinks. **Niet** een checkout of aankooprecord.
4. Extra staging-migratie `artist_radar_staging_revoke_account_guard_rpc`: trekt expliciete `EXECUTE`-rechten op de SECURITY DEFINER-triggerfunctie van `PUBLIC`, `anon`, `authenticated` en `service_role` in. Dezelfde fix is op PR #492 gezet; oorspronkelijke migratie hoeft op een nieuw project niet met de herstelstap te worden gevolgd.
5. Supabase Edge Function `artist-radar-public-events`, versie 1, status `ACTIVE`, met `verify_jwt=false` voor een anonieme **uitsluitend GET**-feed. De functie filtert bekende ticketverkopers, originele bronverwijzingen en maximaal zeven dagen oude verificaties.

## Verifieerbare acceptatie op 5 november

| Controle | Uitkomst | Betekenis |
| --- | --- | --- |
| Account-eigenaar U1 ziet eigen volg-, voorkeur- en activiteitgegevens | PASS | Gesimuleerde `authenticated`-JWT in geïsoleerde SQL-transactie |
| Gebruiker U2 leest U1's account en statushistorie niet | PASS | Alle vier privétabellen met RLS gecontroleerd |
| U2 probeert als U1 te schrijven | **GEWEIGERD** | Database-trigger en owner-policy blokkeerden de write |
| Volglimiet: 100 invoeren, daarna 101e proberen | **100 PASS, 101 GEWEIGERD** | Serverzijdequota, niet enkel frontendvalidatie |
| Anonieme directe concert/account-SELECT en directe trigger-RPC | **GEWEIGERD** | Effectieve rolgrants onafhankelijk gecontroleerd |
| Supabase security advisors | GEEN WARNING/ERROR | Eén bewuste INFO: RLS op concerttabel zonder directe clientpolicy |
| Testdata-opruiming | PASS | Na `ROLLBACK`: 0 auth.users, 0 volgers, 0 voorkeuren, 0 activiteiten, 0 historie, 0 concerten |
| Edge Function deploy | ACTIEF | Geregistreerd als versie 1, **geen uitgevoerde HTTP-respons gevalideerd** |
| Function HTTP GET | **NIET GETEST** | Uitvoeringsomgeving gaf `Proxy CONNECT aborted due to timeout`; registratie als ACTIVE is geen healthcheck |
| Algemene CMS-staging safety-check | **GEBLOKKEERD** | Bewust geen lokale `.env.staging`-credentials; geen Artist Radar-browser-E2E uitgevoerd |
| Echte mail, callback, sessievernieuwing en uitloggen | **OPEN** | Geen geconfigureerde Auth-SMTP/redirectproef met ontvangen mail en twee echte accounts |
| Mobiel, schermlezer, toetsenbord, 200% zoom | **OPEN** | Alleen offline tests; browser-extensie niet gekoppeld aan deze sessie |
| Officiële verkoperlinks | **OPEN** | Lege brontabel, dus geen echt onafhankelijk geverifieerde ticket-CTA |

De SQL-acceptatie gebruikt tijdelijke synthetische identiteiten in één transactie die is teruggedraaid. Dat is geen bewijs van een echte email-login of een getekende JWT vanuit de Auth-service. De publieke brontabel is leeg; een leeg feed-resultaat zou dus normaal zijn, maar is nog niet over HTTP waargenomen.

## Afgebakende vervolgstappen

1. Geef uitsluitend de juiste Vercel-project-/omgevingsrechten vrij. De huidige toegang tot Vercel environment variables gaf **403 Forbidden**. Zet de feature flag niet aan zolang een preview productiecredentials kan erven. Maak een zelfstandige, afgeschermde preview en controleer *alle drie* de buildvars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` en `VITE_ARTIST_RADAR_ACCOUNTS_ENABLED=true`. Publiceer deze variabelen niet in een productieomgeving. Supabase public/publishable key is geen service-role key.
2. Configureer in het **stagingproject** Auth Site URL en de exacte callback-toestemming `<preview-origin>/auth/callback?artist-radar=account` volgens het Supabase Auth-redirectbeleid. Controleer echte ontvangst via SMTP of Send Email Hook, rate limits, misbruikpreventie en veilige origins voordat twee aparte testaccounts inloggen.
3. Draai in de stagingpreview de volledige UX-journey: anonimiteit, open/dicht op `/music`, e-mail aanvragen, bevestiging op hetzelfde en ander apparaat, volglijst bewaren, rubrieken bewaren, accountgeschiedenis en privacy tussen U1/U2, refresh/uitloggen, mobiele breedtes, Back/Forward en reduced motion.
4. Toon `Tickets kopen` alleen na een aantoonbaar onafhankelijke, recente officiële seller-link. Controleer opening van een externe verkoper in een nieuwe sessie en de precieze tekst: een linkklik is **geen bestelling**. Voor daadwerkelijke betaal- of orderhistorie is een andere integratie nodig en die is niet goedgekeurd.
5. Opnieuw bouwen en beoordelen tegen de laatste main vóór merge. Behoud de bestaand geanimeerde radar en oude deeplink. Vraag expliciete goedkeuring voor iedere productie-uitrol en apart voor verplaatsing of verwijdering van staging.

De expliciete nieuwsbriefopt-in werkt via de *oude* functie `artist-radar-signup`; die is niet naar de lege stagingdatabase gekopieerd. De nieuwsbrief-journey is daarom in deze stagingfase niet gevalideerd. Accountregistratie mag geen impliciete nieuwsbriefregistratie worden.
