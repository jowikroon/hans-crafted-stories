import { ietsMooisPreviews } from "@/data/ietsMooisPreviews";
import type { AlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";
import AlbumPreviewListening from "./AlbumPreviewListening";

/** Four owner-approved website previews, not official single releases. */
export default function IetsMooisPreviews({ totalTracks, ownerTracks }: {
  totalTracks: number;
  ownerTracks?: AlbumPrivateDetails["tracks"];
}) {
  return <AlbumPreviewListening album="iets-moois" totalTracks={totalTracks} ownerTracks={ownerTracks} tracks={ietsMooisPreviews} />;
}
