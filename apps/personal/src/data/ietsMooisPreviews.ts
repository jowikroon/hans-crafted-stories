import { soundcloudPrivateEmbed, type AlbumPreviewTrack } from "./albumPreviews";

/**
 * Four website listening previews authorized by Jowikroon on 2026-11-06.
 * These private SoundCloud embeds become shareable when exposed on the public
 * album page. Never substitute the private playlist URL: it contains more
 * recordings than the four explicitly selected for the website.
 */
export type IetsMooisPreview = AlbumPreviewTrack;

export const ietsMooisPreviews: readonly IetsMooisPreview[] = [
  { position: 1, title: "N = 1", duration: "6:04", soundcloudTrackId: 2430066333, provider: "soundcloud", embed: soundcloudPrivateEmbed(2430066333, "s-oVRFFB9WqVS", "#cfa48d") },
  // SoundCloud's source title has an extra l in "allles"; website copy is normalized.
  { position: 2, title: "Mijn opa weet alles", duration: "4:01", soundcloudTrackId: 2356544483, provider: "soundcloud", embed: soundcloudPrivateEmbed(2356544483, "s-1lykJoN53BP", "#cfa48d") },
  { position: 3, title: "Allerkleinste Dingen", duration: "4:42", soundcloudTrackId: 2341348067, provider: "soundcloud", embed: soundcloudPrivateEmbed(2341348067, "s-jYDvWwXXrgE", "#cfa48d") },
  { position: 4, title: "Hypnotisch", duration: "2:37", soundcloudTrackId: 2431200012, provider: "soundcloud", embed: soundcloudPrivateEmbed(2431200012, "s-46w3epMhdYK", "#cfa48d"), versionNote: "Werkversie · niet definitief" },
];
