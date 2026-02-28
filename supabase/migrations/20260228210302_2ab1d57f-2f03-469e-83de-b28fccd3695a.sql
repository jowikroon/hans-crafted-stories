
ALTER TABLE public.blog_posts
  ADD COLUMN title_nl text NOT NULL DEFAULT '',
  ADD COLUMN excerpt_nl text NOT NULL DEFAULT '',
  ADD COLUMN content_nl text NOT NULL DEFAULT '';
