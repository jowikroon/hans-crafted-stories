-- Verificatie van contact_submissions.up.sql. Draai op STAGING (of in een transactie die
-- eindigt met ROLLBACK). Schrijft testrijen; op productie alleen na expliciet akkoord.
-- Verwachte uitkomst per stap staat in het commentaar; elke afwijking = RAISE.

begin;

-- 1. Als anon: geldige inzending lukt, lezen niet.
set local role anon;
insert into public.contact_submissions (name, email, reason, message)
values ('Test', 'Verify@Example.com', 'general', 'Verificatie van de migratie');
do $v$ begin
  perform 1 from public.contact_submissions;
  raise exception 'FOUT: anon kan contact_submissions lezen';
exception when insufficient_privilege then null; -- verwacht
end $v$;

-- 2. Servervalidatie: elk geval moet een check_violation geven.
do $v$
declare bad record;
begin
  for bad in
    select * from (values
      ('', 'a@b.nl', 'general', 'x'),                    -- lege naam
      ('X', 'geen-email', 'general', 'x'),               -- ongeldig e-mailadres
      ('X', 'a@b.nl', 'spam', 'x'),                      -- onbekende reden
      ('X', 'a@b.nl', 'general', repeat('x', 2001))      -- te lang bericht
    ) t(n, e, r, m)
  loop
    begin
      insert into public.contact_submissions (name, email, reason, message) values (bad.n, bad.e, bad.r, bad.m);
      raise exception 'FOUT: ongeldige invoer geaccepteerd: % / % / %', bad.n, bad.e, bad.r;
    exception when check_violation then null; -- verwacht
    end;
  end loop;
end $v$;

-- 3. Anon mag id/created_at niet zelf zetten (kolom-grant).
do $v$ begin
  insert into public.contact_submissions (id, name, email, reason, message)
  values (gen_random_uuid(), 'X', 'c@d.nl', 'general', 'x');
  raise exception 'FOUT: anon kon id zelf zetten';
exception when insufficient_privilege then null;
end $v$;

-- 4. Rate limit: 2 extra inzendingen van hetzelfde adres lukken (totaal 3), de 4e faalt.
insert into public.contact_submissions (name, email, reason, message) values ('Test', 'verify@example.com', 'general', 'twee');
insert into public.contact_submissions (name, email, reason, message) values ('Test', 'verify@example.com', 'general', 'drie');
do $v$ begin
  insert into public.contact_submissions (name, email, reason, message) values ('Test', 'verify@example.com', 'general', 'vier');
  raise exception 'FOUT: rate limit per e-mail werkt niet';
exception when raise_exception then null; -- P0001, verwacht
end $v$;

reset role;
select 'contact_submissions verify OK' as result;
rollback; -- geen testdata achterlaten
