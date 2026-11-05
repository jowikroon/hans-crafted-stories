import { lazy, Suspense } from "react";
import "@/styles/song-story.css";

const Story = lazy(() => import("@/components/music/SongStory"));

export type SongStoryViewProps = { slug: string; sectionId: string; title: string };

/**
 * Keeps the narrative text out of the JavaScript every page downloads.
 * The anchor stays mounted while the chunk loads, so the in-page section
 * menu keeps a valid target. Prerender uses SongStoryView.server.tsx, which
 * renders the same section synchronously into the exported HTML.
 */
export function SongStoryView({ slug, sectionId, title }: SongStoryViewProps) {
  return (
    <div id={sectionId}>
      <Suspense fallback={<section className="songstory songstory--loading" aria-busy="true"><p role="status">Loading the story…</p></section>}>
        <Story slug={slug} sectionId={`${sectionId}-content`} title={title} />
      </Suspense>
    </div>
  );
}
