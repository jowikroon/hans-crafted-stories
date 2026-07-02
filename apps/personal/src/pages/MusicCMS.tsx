// MusicCMS — the /music-cms and /music-cms/:id routes.
// Renders the Music CMS shell (3-mode left rail: Songs / Schrijven / Voices),
// het zusje van de Blog CMS op /write. Zelfde stramien, eigen data (music_songs).
import { useParams } from "react-router-dom";
import MusicCmsShell from "@/components/music-cms/MusicCmsShell";

export default function MusicCMS() {
  const { id } = useParams<{ id: string }>();
  return <MusicCmsShell songId={id} />;
}
