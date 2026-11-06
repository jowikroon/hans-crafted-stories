/** Album website previews are not official distributed releases. */
export interface AlbumPreviewTrack {
  /** Order in the selected SoundCloud playlist, not necessarily the album. */
  position: number;
  title: string;
  duration: string;
  soundcloudTrackId: number;
  provider: "soundcloud";
  embed: string;
  versionNote?: string;
}

/** Private SoundCloud links are shareable by anyone who can access the website. */
export function soundcloudPrivateEmbed(trackId: number, secretToken: string, color: string): string {
  const recording = `https://api.soundcloud.com/tracks/soundcloud:tracks:${trackId}?secret_token=${secretToken}`;
  const params = new URLSearchParams({
    url: recording,
    color,
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
