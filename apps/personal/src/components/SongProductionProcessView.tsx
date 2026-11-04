import { lazy, Suspense } from "react";
import type { Song } from "@/data/music";
import "@/styles/song-production.css";

const Process = lazy(() => import("@/components/SongProductionProcess").then(({ SongProductionProcess }) => ({ default: SongProductionProcess })));

export type SongProductionProcessViewProps = { song: Song; sectionId?: string };

/** Keep measurements out of other pages' initial JavaScript; the anchor stays mounted while loading. */
export function SongProductionProcessView({ song, sectionId = "song-process" }: SongProductionProcessViewProps) {
  return <div id={sectionId}>
    <Suspense fallback={<section className="ho-process" aria-label={`${song.title} recording notes`} aria-busy="true"><p className="ho-eyebrow" role="status">Loading recording notes…</p></section>}>
      <Process song={song} sectionId={`${sectionId}-content`} />
    </Suspense>
  </div>;
}
