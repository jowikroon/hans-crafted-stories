# Access pointers — CCP (GEEN secrets in dit bestand)

*classificatie: internal · 2026-07-06 · wachtwoorden staan NIET hier en NIET in Supabase — alleen in `_skill/adapters/.env` of de password manager*

## Magento (CCP)
- Admin login-URL: `http://connectcarparts.nl/atvise/admin`
- Admins (volledig eigenaar): Hans, Luca — beiden kunnen zelf alle config doen (o.a. Allow Countries, verzendmethodes).
- Inloggegevens: → `_skill/adapters/.env` (key `MAGENTO_ADMIN_*`) / password manager. Niet hier opslaan.

## Overige accounts (credentials → .env / password manager)
- Canva — Connect Car Parts — account: info@connectcarparts.com
- Returnless — account: luca@connectcarparts.com

> Waarom hier geen wachtwoorden: §8 hard rule + classifier-gate. Confidential mag nooit naar publieke endpoints (Supabase, wiki-app, Gemini, OpenAI). Dit pointer-bestand bevat bewust alleen niet-geheime verwijzingen.
