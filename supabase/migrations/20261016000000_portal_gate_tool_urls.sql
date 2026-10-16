-- Lab tools open through the portal-gate Worker (workers/portal-gate) on their
-- hansvanleeuwen.com hosts; portal_launch_tool must return exactly those hosts.
update public.portal_tools t set config = jsonb_set(t.config, '{external_url}', to_jsonb(v.url))
from (values
  ('chatdev', 'https://chatdev.hansvanleeuwen.com/'),
  ('autodev', 'https://lab-autodev.hansvanleeuwen.com/'),
  ('canvas', 'https://lab-canvas.hansvanleeuwen.com/'),
  ('changes', 'https://lab-changes.hansvanleeuwen.com/'),
  ('browser', 'https://lab-browser.hansvanleeuwen.com/'),
  ('reverse', 'https://reverse.hansvanleeuwen.com/')
) v(slug, url)
where t.config->>'repo_slug' = v.slug;
