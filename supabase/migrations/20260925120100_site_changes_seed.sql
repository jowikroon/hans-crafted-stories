-- Seed the change register (applied to production 2026-09-25).
-- Shipped changes are measured now against the Search Console history; planned rows carry the
-- Linear id, and site-metrics activates each one (deploy date = merge time) when a merged PR
-- references that id. Idempotent: rows are keyed on pr_number / linear_issue.

insert into public.site_changes (title, kind, linear_issue, pr_number, deployed_at, paths, primary_metric, expected, hypothesis, status, source)
select * from (values
  ('Eén URL per taal (/nl), echte 404, dienstenpagina''s uit één bron', 'seo', 'HAN-167', 332, '2026-09-05T11:10:49Z'::timestamptz,
   '{/nl,/nl/*}'::text[], 'search_impressions', 'up',
   'Eigen /nl-URL''s worden los geïndexeerd en trekken Nederlandse vertoningen die eerder op de EN-URL landden.', 'measuring', 'seed'),
  ('Q4 A+B: kannibalisatie, interne links, /rates', 'seo', 'HAN-171', 336, '2026-09-05T15:52:42Z'::timestamptz,
   '{/interim-ecommerce-manager,/nl/interim-ecommerce-manager,/amazon-nl-specialist,/nl/amazon-nl-specialist,/bol-com-consultant,/nl/bol-com-consultant,/ai-ecommerce-automation,/nl/ai-ecommerce-automation,/rates,/nl/rates}'::text[],
   'search_impressions', 'up',
   'De homepage stopt met concurreren op dienst-queries; de dienstenpagina''s krijgen die vertoningen.', 'measuring', 'seed'),
  ('Naam in homepage-H1, CLS-fix, artikellinks op dienstenpagina''s', 'seo', null, 345, '2026-09-11T19:42:18Z'::timestamptz,
   '{/,/nl}'::text[], 'search_position', 'down',
   'Merk plus rol in de H1 versterkt de brand-query: de homepage stijgt in positie.', 'measuring', 'seed'),
  ('Homepage-titel in de prerender (merk eerst)', 'seo', 'HAN-178', 352, '2026-09-22T21:07:51Z'::timestamptz,
   '{/,/nl}'::text[], 'search_ctr', 'up',
   'Google ziet nu de merk-eerst-titel; de CTR op de homepage stijgt.', 'measuring', 'seed'),
  ('SERP-veilige titels en beschrijvingen, NL Person-entiteit', 'seo', null, 353, '2026-09-22T22:20:33Z'::timestamptz,
   '{}'::text[], 'search_ctr', 'up',
   'Titels en beschrijvingen die niet worden afgekapt verhogen de CTR over de hele site.', 'measuring', 'seed'),
  ('Echte OG-afbeelding, portret in hero, zichtbare laatst-bijgewerkt', 'seo', null, 354, '2026-09-22T22:22:22Z'::timestamptz,
   '{}'::text[], null, 'up', null, 'logged', 'seed')
) v(title, kind, linear_issue, pr_number, deployed_at, paths, primary_metric, expected, hypothesis, status, source)
where not exists (select 1 from public.site_changes c where c.pr_number = v.pr_number);

insert into public.site_changes (title, kind, linear_issue, paths, primary_metric, expected, hypothesis, status, source)
select * from (values
  ('Money pages in Google (alle drie dienstpagina''s geïndexeerd)', 'seo', 'HAN-156',
   '{/interim-ecommerce-manager,/nl/interim-ecommerce-manager,/amazon-nl-specialist,/nl/amazon-nl-specialist,/bol-com-consultant,/nl/bol-com-consultant,/ai-ecommerce-automation,/nl/ai-ecommerce-automation}'::text[],
   'search_impressions', 'up', 'Geïndexeerde dienstpagina''s krijgen vertoningen op dienst-queries.', 'planned', 'seed'),
  ('Brand-query terug in de top 10', 'seo', 'HAN-164', '{/,/nl}'::text[], 'search_position', 'down',
   'De homepage rankt weer voor "hans van leeuwen e-commerce".', 'planned', 'seed'),
  ('Q4-refresh kernpagina''s: nieuwe casus, verse cijfers', 'content', 'HAN-169',
   '{/interim-ecommerce-manager,/nl/interim-ecommerce-manager,/amazon-nl-specialist,/nl/amazon-nl-specialist,/bol-com-consultant,/nl/bol-com-consultant,/work/connect-car-parts,/nl/work/connect-car-parts}'::text[],
   'search_clicks', 'up', 'Actuele bewijslast op de kernpagina''s levert meer klikken uit Google.', 'planned', 'seed'),
  ('Eerste AI-automation case study met cijfers onder /work', 'content', 'HAN-46', '{/work/*,/nl/work/*}'::text[],
   'search_impressions', 'up', 'Een tweede case study verbreedt de zichtbaarheid van /work.', 'planned', 'seed'),
  ('Case studies: klantnaam, cijfers en datums', 'content', 'HAN-50', '{/work/*,/nl/work/*}'::text[],
   'engaged_rate', 'up', 'Concrete bewijslast houdt bezoekers langer vast op /work.', 'planned', 'seed'),
  ('Off-site: profielen, vermeldingen, gastartikel', 'offsite', 'HAN-173', '{}'::text[],
   'visits', 'up', 'Externe vermeldingen brengen verwijzingsbezoek en merkzoekopdrachten.', 'planned', 'seed'),
  ('Person.sameAs met Wikidata en YouTube', 'seo', 'HAN-115', '{/,/nl,/about,/nl/about}'::text[],
   'search_impressions', 'up', 'Sterkere entiteitsbinding vergroot de merkzichtbaarheid.', 'planned', 'seed'),
  ('LinkedIn About: freelance-positionering', 'offsite', 'HAN-45', '{}'::text[],
   'visits', 'up', 'LinkedIn stuurt meer gekwalificeerd bezoek door.', 'planned', 'seed'),
  ('Backlink-autoriteit (DR boven 0)', 'offsite', 'HAN-144', '{}'::text[],
   'search_impressions', 'up', 'Eerste verwijzende domeinen tillen de hele site in de zoekresultaten.', 'planned', 'seed'),
  ('Homepage-intro: product data en AI-assisted operations', 'content', 'HAN-78', '{/,/nl}'::text[],
   'search_impressions', 'up', 'De homepage gaat vertoningen trekken op product-data-queries.', 'planned', 'seed'),
  ('/writing-index met eigen inhoud', 'content', 'HAN-82', '{/writing,/nl/writing}'::text[],
   'search_clicks', 'up', 'Een inhoudelijke index rankt zelf en verdeelt klikken naar de artikelen.', 'planned', 'seed'),
  ('FAQPage-schema met 5+ echte vragen', 'seo', 'HAN-84', '{}'::text[],
   'search_ctr', 'up', 'FAQ-rich results vergroten de SERP-ruimte en de CTR.', 'planned', 'seed')
) v(title, kind, linear_issue, paths, primary_metric, expected, hypothesis, status, source)
where not exists (select 1 from public.site_changes c where c.linear_issue = v.linear_issue and c.status = 'planned');
