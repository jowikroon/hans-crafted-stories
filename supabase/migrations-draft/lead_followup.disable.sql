-- Niet-destructieve terugval voor lead_followup v1: statuswijzigingen blokkeren, alle opvolgdata en logregels bewaren.
-- Heractiveren: grant execute on function public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz) to authenticated;
begin;
revoke execute on function public.contact_set_status(uuid, text, boolean, text, text, text, timestamptz) from authenticated;
commit;
