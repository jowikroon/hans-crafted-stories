import { lazy, Suspense } from "react";
import "@/styles/song-story.css";

const Story = lazy(() => import("@/components/music/SongStory"));

export type SongStoryViewProps = { slug: string; sectionId: string; title: string };

/**
 * Keep the large editorial data out of the shared route chunk. The anchor
 * remains mounted while the client chunk loads. The server alias below writes
 * the full text to statically rendered HTML for SEO and no-JS readers.
 */
export function SongStoryView({ slug, sectionId, title }: SongStoryViewProps) {
  return (
    <div id={sectionId} className="songstory-anchor">
      <Suspense fallback={<section className="songstory songstory--loading" aria-busy="true"><p role="status">Loading the story…</p></section>}>
        <Story slug={slug} sectionId={`${sectionId}-content`} title={title} />
      </Suspense>
    </div>
  );
}
