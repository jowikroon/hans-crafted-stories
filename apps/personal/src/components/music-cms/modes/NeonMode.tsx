import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import ArtworkMode from "./ArtworkMode";
import DevelopmentLibrary from "../DevelopmentLibrary";
import NeonWorkspace from "../NeonWorkspace";
import { listDevelopmentPages } from "../lib/developmentStore";
import { listArtwork, previewUrls } from "../lib/artworkStore";

export default function NeonMode() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const query = useQuery({ queryKey: ["music-development-pages", user?.id], queryFn: listDevelopmentPages, enabled: !!user && isAdmin && !loading, gcTime: 0, staleTime: 60_000, retry: false });
  const artwork = useQuery({ queryKey: ["music-artwork", user?.id], queryFn: listArtwork, enabled: !!user && isAdmin && !loading, gcTime: 0, staleTime: 60_000, retry: false });
  const front = artwork.data?.find(a => a.album === "NEON" && a.is_current && a.categories.includes("Album") && /front|voorzijde|voorkant/i.test([a.title, ...a.origins.map(o => o.file)].join(" ")));
  const image = useQuery({ queryKey: ["neon-front-preview", user?.id, front?.id], queryFn: () => previewUrls(front ? [front] : []), enabled: !!user && isAdmin && !!front, gcTime: 0, staleTime: 600_000, refetchInterval: 600_000 });
  if (loading) return <p role="status">Toegang controleren…</p>;
  if (!isAdmin) return <p role="alert">Deze albumwerkruimte is alleen beschikbaar voor het admin-account.</p>;
  return <NeonWorkspace cover={front?.thumbnail_path ? image.data?.[front.thumbnail_path] : undefined} library={<DevelopmentLibrary pages={query.data ?? []} loading={query.isPending} error={query.error?.message} onRetry={() => { void query.refetch(); }} />} artwork={<ArtworkMode initialAlbum="NEON" embedded />} />;
}
