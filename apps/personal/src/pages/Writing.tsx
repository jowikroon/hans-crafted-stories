import WritingV2 from "@/components/writing-v2/WritingV2";

/**
 * Writing.tsx — entry point for /writing route.
 *
 * 2026-06-13: redesign v2 actief. Originele implementatie verplaatst naar
 * components/writing-v2/WritingV2.tsx. Behouden vanuit eerdere /writing:
 *   - Auth-aware fetch via getBlogPosts() (RLS gates published-only for anon)
 *   - isDraft mapping (CONCEPT badge zichtbaar voor Hans-auth)
 *   - useSEO met canonical + JSON-LD CollectionPage + BreadcrumbList
 *   - Bilingual (NL/EN) via useLang + translations
 *   - usePreloadedBlogPosts voor SSR hydration
 *
 * Nieuw in v2:
 *   - Featured essay panel (eerste post, image-led, accent border)
 *   - Image-led row layout met thumbnail + meta inline
 *   - Filter pills (All / Amazon / Bol / Marketplace / E-commerce / AI / UX)
 *   - Switzer + JetBrains Mono fonts via Fontshare
 *   - Accent #1C6B45 (dark green) scoped to .writing-v2
 *   - Sticky toolbar with elevation on scroll
 *   - Reveal animation on scroll via IntersectionObserver
 *   - Mobile-optimized: horizontal scrolling pills, stacked posts
 *
 * Indien je terug wil naar v1: git log apps/personal/src/pages/Writing.tsx
 * en revert de commit die deze regel introduceerde.
 */
export default function Writing() {
  return <WritingV2 />;
}
