# NEON Official: vier private SoundCloud-previews op de website

Datum: 2026-11-06. Domein: muziek / hansvanleeuwen.com. Taak: na expliciete toestemming de eerste vier tracks uit `NEON Official` via de NEON-albumpagina beluisterbaar maken, analoog aan IETS MOOIS. HansOS-contract: 1.0.0.

## Bronnen en besluiten

- Gebruikersbesluit in deze conversatie: op de expliciete vraag of de vier private NEON-deellinks publiek in GitHub en op de website mogen komen, antwoordde Hans **ja**.
- De eerste vier individuele tracks zijn op 2026-11-06 uit de private SoundCloud-playlist gecontroleerd. Alleen deze selectie: **New Level, Beat Drop, Neon House of Glass, Pressure**. De overige vier playlistopnamen blijven buiten de bron en de site.
- Op de NEON-albumpagina staan nog steeds **negen geplande albumposities**, met uitsluitend Beat Drop (02) en Neon House of Glass (04) als officieel uitgebrachte singles. De volgorde van de vier SoundCloud-previewtracks is niet de definitieve albumvolgorde.
- Het bestaande contract voor de interactieve hoes (760 ms flip, negen versnellende regels, anonieme onuitgebrachte posities) en de 12 posities van IETS MOOIS blijft ongewijzigd.
- De HansOS/SecondBrainVault-controle eerder op 2026-11-06 gebruikte de GitHub-back-up met genoemde commit `46a3541`, inclusief manifest/incomingcontrole; een complete actuele canonieke-bronsnapshot of schrijfrecht naar de primaire vault is niet onafhankelijk aangetoond. Geen private vaultinhoud als nieuwe publicatiebron gebruikt.

## Implementatie en privacy

- Vier afzonderlijke SoundCloud-players laden pas na een expliciete afspeelklik. Een nieuwe klik vervangt een al actieve preview; een geopende officiële Spotify-player stopt de preview. Geen autoplay en geen volledige playlist-embed.
- De publieke website en GitHub bevatten de vier eigenaar-goedgekeurde deel-URL's. Dat is een **publiek deelbare toegang** tot private SoundCloud-opnamen, niet een toegangsbeperking tot hansvanleeuwen.com. De pagina vermeldt deze grens.
- De selectie gebruikt een gedeelde playercomponent met de reeds goedgekeurde IETS MOOIS-previews, zonder aanpassing van hun vier bronversies. Vier tests en album-SEO/schema bewaken de scheiding met officieel uitgebrachte singles en de overige onbekende LP-titels.
- Relevante permanente documentatie is bijgewerkt zodat een volgende agent de tweede expliciete publicatietoestemming en de beperkte scope kan herkennen.

## Controles en overdracht

- Op de gecombineerde bron met de eerder gepubliceerde NEON-verhaal- en coverwijzigingen: `npm run test:personal` **59 testbestanden, 554 tests geslaagd**; TypeScript geslaagd; ESLint **0 fouten, 19 bestaande waarschuwingen**.
- `npm run build:personal` geslaagd: 71 prerender-routes, SEO-guard 70 pagina's/27 controles, image-guard 71 pagina's/94 unieke beelden/0 fouten, bundel **409 kB gzip** binnen budget van 425 kB.
- De losse `test:soundcloud` (4 tests), `test:images` (5 tests) en `test:bundle` (6 tests) zijn geslaagd. De automatisch gegenereerde niet-gerelateerde sitemapwijziging is niet opgenomen. `git diff --check` is schoon.
- **Releasecheck volgt:** controleer CI/CodeQL op de exacte GitHub PR-SHA, daarna squash merge en Vercel-`READY` op de merge-SHA. Als dat niet lukt, vermeld dat expliciet; de bovenstaande lokale controles zijn geen bewijs van publicatie.
- Browsersimulatie met een echte SoundCloud-player is niet door de unit tests vervangen; de productieplayer en de uiteindelijke iframe-respons moeten afzonderlijk worden gemeten indien beschikbaar.
- Behoud de andere vier private opnamen en niet-definitieve albuminformatie buiten de openbare website. Er is geen SoundCloud-privacyinstelling gewijzigd en niets op Spotify/DistroKid uitgebracht.
- Vault-inbox-log en centraal leslog zijn niet onafhankelijk schrijfbaar aangetoond; deze getrackte repo-review houdt de handeling controleerbaar. Niets is als naar de vault gesynchroniseerd voorgesteld.
