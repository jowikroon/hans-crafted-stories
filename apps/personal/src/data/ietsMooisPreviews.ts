/**
 * Four website listening previews authorized by Jowikroon on 2026-11-06.
 * These private SoundCloud embeds become shareable when exposed on the public
 * album page. Never substitute the private playlist URL: it contains more
 * recordings than the four explicitly selected for the website.
 */
export interface IetsMooisPreview {
  position: number;
  title: string;
  duration: string;
  soundcloudTrackId: number;
  provider: "soundcloud";
  embed: string;
  versionNote?: string;
}

function soundcloudPrivateEmbed(trackId: number, secretToken: string): string {
  const recording = `https://api.soundcloud.com/tracks/soundcloud:tracks:${trackId}?secret_token=${secretToken}`;
  const params = new URLSearchParams({
    url: recording,
    color: "#cfa48d",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
    visual: "false",
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

export const ietsMooisPreviews: readonly IetsMooisPreview[] = [
  { position: 1, title: "N = 1", duration: "6:04", soundcloudTrackId: 2430066333, provider: "soundcloud", embed: soundcloudPrivateEmbed(2430066333, "s-oVRFFB9WqVS") },
  // SoundCloud's source title has an extra l in "allles"; website copy is normalized.
  { position: 2, title: "Mijn opa weet alles", duration: "4:01", soundcloudTrackId: 2356544483, provider: "soundcloud", embed: soundcloudPrivateEmbed(2356544483, "s-1lykJoN53BP") },
  { position: 3, title: "Allerkleinste Dingen", duration: "4:42", soundcloudTrackId: 2341348067, provider: "soundcloud", embed: soundcloudPrivateEmbed(2341348067, "s-jYDvWwXXrgE") },
  { position: 4, title: "Hypnotisch", duration: "2:37", soundcloudTrackId: 2431200012, provider: "soundcloud", embed: soundcloudPrivateEmbed(2431200012, "s-46w3epMhdYK"), versionNote: "Werkversie · niet definitief" },
];
