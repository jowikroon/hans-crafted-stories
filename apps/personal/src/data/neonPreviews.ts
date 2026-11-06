import { soundcloudPrivateEmbed, type AlbumPreviewTrack } from "./albumPreviews";

/**
 * First four individual recordings from the owner's private `NEON Official`
 * playlist, checked on 2026-11-06. Their order is the playlist order, not a
 * confirmed album running order. Never embed the complete eight-track list.
 *
 * Jowikroon explicitly authorized publishing these four shareable private
 * links on the public website and in its GitHub repository on 2026-11-06.
 * Do not publish other recordings from the eight-track private playlist.
 */
export const neonPreviews: readonly AlbumPreviewTrack[] = [
  { position: 1, title: "New Level", duration: "4:41", soundcloudTrackId: 2419106895, provider: "soundcloud", embed: soundcloudPrivateEmbed(2419106895, "s-k0u413NBurp", "#9c4dff") },
  { position: 2, title: "Beat Drop", duration: "2:44", soundcloudTrackId: 2419106883, provider: "soundcloud", embed: soundcloudPrivateEmbed(2419106883, "s-C4hPTdynMx8", "#9c4dff") },
  { position: 3, title: "Neon House of Glass", duration: "4:46", soundcloudTrackId: 2419106874, provider: "soundcloud", embed: soundcloudPrivateEmbed(2419106874, "s-mzq5QqWgvWH", "#9c4dff") },
  { position: 4, title: "Pressure", duration: "4:14", soundcloudTrackId: 2419106871, provider: "soundcloud", embed: soundcloudPrivateEmbed(2419106871, "s-WqEj7os7vmK", "#9c4dff") },
];
