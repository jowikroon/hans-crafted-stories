import { useSearchParams } from "react-router-dom";
import { neonPreviews } from "@/data/neonPreviews";
import { useMusicExperience } from "./MusicExperience";
import AlbumPreviewListening from "./AlbumPreviewListening";

/** Four private master previews, separate from the two official Spotify singles. */
export default function NeonPreviews({ totalTracks }: { totalTracks: number }) {
  const { active, stop } = useMusicExperience();
  const [params] = useSearchParams();
  return <AlbumPreviewListening album="neon" totalTracks={totalTracks} tracks={neonPreviews}
    onStart={() => stop()} stopForOtherAudio={active !== null || params.has("song")} />;
}
