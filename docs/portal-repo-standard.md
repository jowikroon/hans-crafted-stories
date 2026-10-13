# Repo tools in Hans' portal

Besluit Hans, 13 oktober 2026. Elke nieuwe repo-installatie krijgt een kaart in `/portal`, in de bestaande Tools-grid. De primaire actie opent de werkende gebruikersinterface in een nieuw tabblad; GitHub is een secundaire bronlink.

## Ontwerp

Bestaande tokens: achtergrond #FAF8F2, kaart #FFFFFF, tekst #17150F, secundair #F3F1EC, accent #1C7A48. Switzer voor koppen en tekst. Links uitgelijnde kaarten in één, twee of drie kolommen; dezelfde rand, iconen en afronding als bestaande tools. Geen extra admin-submenu voor leden. Eén toegankelijke dialoog per tool, met nut, mogelijkheden, probeeropdracht, beperkingen, openen en een persoonlijke beoordeling. De bestaande portalstijl is bewust leidend boven een nieuw design-systeem.

## Toegang

- Alleen de bestaande, geverifieerde Hans-owner is beheerder. Nieuwe personen worden leden, nooit admins.
- Geen automatische toekenning van alle tools. Per tool apart bekijken en gebruiken; gebruiken impliceert bekijken.
- Geen configuratie, webhookgeheimen of beheer-URL's in de ledencatalogus. Servercontroles zijn leidend.
- Een kaartrecht is geen bewijs van tenant-isolatie in de achterliggende app. Een gedeelde browser, agentwerkruimte of andere eigenaarssessie blijft owner-only totdat een afzonderlijke omgeving of echte gebruikerslogin is gecontroleerd.
- Status `owner-only`, `individual-login` of `stateless` is een verplichte deelbaarheidsbeslissing. Geef nooit Hans' gedeelde labwachtwoord aan vrienden.
- Een beoordeling is van de ingelogde gebruiker. Andere leden kunnen deze niet lezen of wijzigen.

## Installatiecontract

Registreer stabiele `repo_slug`, officiële `repository_url`, geteste `external_url`, gebruikersgerichte beschrijving, features, `try_prompt`, `limitations`, `member_access`, `release_status` en exacte geteste commit in het uitvoeringsregister. Geen credentials in toolconfig. Nieuwe repo's krijgen dezelfde kaart en dialoog zonder nieuwe frontendcode. Controleer echte taak, HTTPS, afwijzing zonder rechten, intrekken rechten en eventuele eigen gebruikersomgeving. Noteer open punten expliciet; een HTTP 200 is geen geslaagde gebruikerstest.

## Geheugen

Schrijf bron/evidence en besluiten naar SecondBrainVault/raw voor de Librarian; voeg een append-only logregel toe en verwijs vanuit HANSOS REGISTRY en de repo-launch-skill. Claude leest dezelfde bron; dit is geen garantie dat een reeds lopende Claude-sessie opnieuw geladen is.
