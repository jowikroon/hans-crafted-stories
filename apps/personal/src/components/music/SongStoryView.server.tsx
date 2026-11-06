import SongStory from "@/components/music/SongStory";
import type { SongStoryViewProps } from "./SongStoryView";

/** Vite selects this synchronous view for prerender so the exported HTML carries the story. */
export function SongStoryView({ slug, sectionId, title }: SongStoryViewProps) {
  return (
    <div id={sectionId}>
      <SongStory slug={slug} sectionId={`${sectionId}-content`} title={title} />
    </div>
  );
}
