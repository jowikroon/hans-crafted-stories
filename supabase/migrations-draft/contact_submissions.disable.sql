-- Niet-destructieve terugval voor contact_submissions (v3). Doelproject: pesfakewujjwkyybwaom.
-- Blokkeert NIEUWE inzendingen; alle ontvangen leads blijven bewaard en leesbaar voor admins.
-- Frontend: de zichtbare e-mailuitwijk blijft staan. Nooit DROP als routinematige rollback.
-- Heractiveren: grant execute on function public.contact_submit(text, text, text, text) to service_role;
begin;
revoke execute on function public.contact_submit(text, text, text, text) from service_role;
commit;
