import { SongProductionProcess } from "@/components/SongProductionProcess";
import type { SongProductionProcessViewProps } from "./SongProductionProcessView";

/** Vite selects this synchronous view for prerender so the exported HTML contains every chart. */
export function SongProductionProcessView({ song, sectionId = "song-process" }: SongProductionProcessViewProps) {
  return <div id={sectionId}>
    <SongProductionProcess song={song} sectionId={`${sectionId}-content`} />
  </div>;
}
