-- Voice DNA (design contract #16): calibration sentence + signature phrases + strengths/watch-outs + unique markers
-- Applied to production via MCP on 2026-06-12; this file is the repo record.
alter table public.hvl_voice_templates
  add column if not exists calibration_sentence text not null default '',
  add column if not exists signature_phrases text[] not null default '{}',
  add column if not exists strengths text[] not null default '{}',
  add column if not exists watch_outs text[] not null default '{}',
  add column if not exists unique_markers text[] not null default '{}';
