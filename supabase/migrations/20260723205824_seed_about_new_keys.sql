-- Seeds for CMS keys + page-element flags introduced in PRs #267/#272/#275/#277
-- (Codex reviews: rows must exist before admins can edit/toggle them in the portal).

-- page_content: new editable keys for /about
insert into public.page_content (page, content_key, content_value, content_group, content_label, content_type)
select 'about', 'about_h1', 'Freelance E-commerce Manager & Marketplace Specialist (Amazon & Bol.com)', 'hero', 'About H1 (keyword-rich)', 'text'
where not exists (select 1 from public.page_content where page = 'about' and content_key = 'about_h1');

insert into public.page_content (page, content_key, content_value, content_group, content_label, content_type)
select 'about', 'about_book_call_label', 'Book a 30-min call', 'hero', 'Book-a-call button label', 'text'
where not exists (select 1 from public.page_content where page = 'about' and content_key = 'about_book_call_label');

insert into public.page_content (page, content_key, content_value, content_group, content_label, content_type)
select 'about', 'about_methodology_heading', 'How I work', 'methodology', 'Methodology heading', 'text'
where not exists (select 1 from public.page_content where page = 'about' and content_key = 'about_methodology_heading');

insert into public.page_content (page, content_key, content_value, content_group, content_label, content_type)
select 'about', 'about_methodology_intro', 'Every engagement runs through four phases. Compact and measurable, no abstract framework — just what happens each week and which KPIs move.', 'methodology', 'Methodology intro', 'text'
where not exists (select 1 from public.page_content where page = 'about' and content_key = 'about_methodology_intro');

insert into public.page_content (page, content_key, content_value, content_group, content_label, content_type)
select 'about', 'about_faq_heading', 'Frequently Asked Questions', 'faq', 'FAQ heading', 'text'
where not exists (select 1 from public.page_content where page = 'about' and content_key = 'about_faq_heading');

-- page_elements: visibility flags for the new About sections
insert into public.page_elements (page, element_key, element_label, element_group, is_visible)
select 'about', 'methodology_section', 'Methodology (4-phase framework)', 'sections', true
where not exists (select 1 from public.page_elements where page = 'about' and element_key = 'methodology_section');

insert into public.page_elements (page, element_key, element_label, element_group, is_visible)
select 'about', 'about_faq_section', 'FAQ section', 'sections', true
where not exists (select 1 from public.page_elements where page = 'about' and element_key = 'about_faq_section');

insert into public.page_elements (page, element_key, element_label, element_group, is_visible)
select 'about', 'book_call_cta', 'Book-a-call CTA (Calendly)', 'hero', true
where not exists (select 1 from public.page_elements where page = 'about' and element_key = 'book_call_cta');
