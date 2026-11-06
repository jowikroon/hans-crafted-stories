import SongStory from "@/components/music/SongStory";
import "@/styles/song-story.css";
import type { SongStoryViewProps } from "./SongStoryView";

/** Synchronous variant for the existing static prerender build. */
export function SongStoryView({ slug, sectionId, title }: SongStoryViewProps) {
  return (
    <div id={sectionId} className="songstory-anchor">
      <SongStory slug={slug} sectionId={`${sectionId}-content`} title={title} />
    </div>
  );
}
