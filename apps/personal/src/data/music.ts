/**
 * music.ts, typed Song data for the /music section.
 *
 * Ported 1:1 from the claude.ai/design handoff bundle:
 *   _redesign-handoff/project/Music.html  (songs grid + featured release)
 *   _redesign-handoff/project/song-template.html  (per-song detail body)
 *
 * The prototype shipped ONE filled-in detail template (Nightline) and three
 * stub cards. For v1 every track therefore reuses the Nightline production
 * notes / gear / lyrics as demo content, lightly varied per track. Real
 * per-song copy is expected to replace `detail` later, see TODO markers.
 *
 * Copy is intentionally English (the prototype is English). No translation
 * keys are added here; if/when Music goes bilingual, mirror the writing-v2
 * approach and add NL fields to these types.
 */


/** Genre filter slug as used by the toolbar pills (data-tag in the prototype). */
export type GenreTag = "lofi" | "electronic" | "ambient" | "pop";

export interface LyricSection {
  /** e.g. "Verse 1", "Chorus", "Bridge" */
  tag: string;
  /** Lines of the section; rendered with <br/> between lines. */
  lines: string[];
}

export interface GearItem {
  /** Bolded instrument / unit name. */
  name: string;
  /** Short description of how it was used. */
  note: string;
}

export interface SessionSpec {
  label: string;
  value: string;
}

export interface ProseBlock {
  type: "lead" | "p" | "h2" | "pull" | "callout";
  /** For h2: anchor id. */
  id?: string;
  /** For callout: the small kicker label. */
  kicker?: string;
  /**
   * Text. May contain a small whitelist of inline HTML (<strong>) which the
   * renderer injects via dangerouslySetInnerHTML, content is author-trusted,
   * never user input.
   */
  text: string;
}

export interface SongDetail {
  /** Category line above the title, e.g. "Lo-fi · Single". */
  category: string;
  /** Facts shown in the song header. */
  facts: SessionSpec[];
  /** "The session" spec table in the aside. */
  session: SessionSpec[];
  /** Gear & instruments list. */
  gear: GearItem[];
  /** Production-notes prose, in order. */
  prose: ProseBlock[];
  /** Lyrics, grouped into sections. */
  lyrics: LyricSection[];
  /** Footnote under the lyrics (placeholder disclaimer in the prototype). */
  lyricsNote?: string;
}

export type Provider = "spotify" | "soundcloud";

export interface Song {
  title: string;
  slug: string;
  /** Artist name as credited on the streaming platform (e.g. "Jowikroon"). */
  artist: string;
  /** Which platform hosts the embed/player. */
  provider: Provider;
  /** Pre-release concept on SoundCloud (official releases are on Spotify). */
  concept?: boolean;
  /** Genre filter tags (first one is also the primary genre label source). */
  tags: GenreTag[];
  /** Human label shown in the meta row, e.g. "Lo-fi". */
  genre: string;
  /** ISO date (YYYY-MM-DD), used for sort + display. */
  date: string;
  /** Track length, e.g. "3:42". */
  duration: string;
  /** Imported cover image (resolved URL string at build time). */
  cover: string;
  /** Embed src for the inline lazy player (Spotify or SoundCloud iframe). */
  embed: string;
  /** Height of the inline embed iframe. */
  embedHeight: number;
  /** Direct listen link on the host platform (Spotify or SoundCloud). */
  listenUrl: string;
  /** Optional extra platform links for the song page. */
  links?: { spotify?: string; soundcloud?: string; youtube?: string; appleMusic?: string; suno?: string };
  /** Optional self-hosted video file (served from R2 via /media/...). Preferred over videoUrl. */
  videoFile?: string;
  /** Optional YouTube watch link (official video), secondary link / fallback. */
  videoUrl?: string;
  detail: SongDetail;
}

export interface Release {
  kicker: string;
  title: string;
  sub: string;
  chips: string[];
  /** Album embed (eager, above the fold). */
  embed: string;
  embedHeight: number;
}

/** Featured release + previous official, both shown at the top of /music. */
export const featuredRelease: Release = {
  kicker: "Latest release",
  title: "Neon House of Glass",
  sub: "My second official single, out now on Spotify, released as Jowikroon. Spotify carries my official releases; SoundCloud is where my pre-release concept tracks land first.",
  chips: ["2026", "Electronic", "Single"],
  embed: "https://open.spotify.com/embed/album/2JAngR51N6h1mTUI43MHge?utm_source=generator",
  embedHeight: 352,
};

/** Previous official single, shown next to the featured release. */
export const previousRelease: Release = {
  kicker: "Also on Spotify",
  title: "Beat Drop",
  sub: "My first official single, also live on Spotify as Jowikroon.",
  chips: ["2026", "Electronic", "Single"],
  embed: "https://open.spotify.com/embed/album/7gHaf9f1kcQaOtg9sMzPlo?utm_source=generator",
  embedHeight: 352,
};

/** Build a SoundCloud iframe embed URL from a track page URL. */
function scEmbed(trackUrl: string): string {
  const u = encodeURIComponent(trackUrl);
  return `https://w.soundcloud.com/player/?url=${u}&color=%231C6B45&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
}

/** Lighter detail for the concept tracks, honest, no fabricated studio specs. */
function conceptDetail(opts: { category: string; released: string; length: string; note: string }): SongDetail {
  return {
    category: opts.category,
    facts: [
      { label: "Released", value: opts.released },
      { label: "Length", value: opts.length },
      { label: "Status", value: "Pre-release concept" },
      { label: "As", value: "Jowikroon" },
    ],
    session: [
      { label: "Status", value: "Pre-release concept" },
      { label: "Host", value: "SoundCloud" },
      { label: "Artist", value: "Jowikroon" },
    ],
    gear: [],
    prose: [
      { type: "lead", text: opts.note },
      {
        type: "p",
        text: "This is a pre-release concept on SoundCloud. My official releases go out on Spotify; on SoundCloud I share tracks while the mix, arrangement and final master are still moving.",
      },
      {
        type: "callout",
        kicker: "Heads up",
        text: "Made as Jowikroon, the artist alias of Hans van Leeuwen. Press play to hear the SoundCloud version.",
      },
    ],
    lyrics: [],
  };
}

/** Real catalogue: Beat Drop (Spotify) + 4 SoundCloud concept tracks. */
export const songs: Song[] = [
  {
    title: "Neon House of Glass",
    slug: "neon-house-of-glass",
    artist: "Jowikroon",
    provider: "spotify",
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-07-03",
    duration: "4:46",
    cover: "https://i.scdn.co/image/ab67616d0000b27331d1dc7e59bd437f979191c7",
    embed: "https://open.spotify.com/embed/album/2JAngR51N6h1mTUI43MHge?utm_source=generator",
    embedHeight: 352,
    listenUrl: "https://open.spotify.com/album/2JAngR51N6h1mTUI43MHge",
    links: { spotify: "https://open.spotify.com/track/5ubWiujjSERZhUzxLeqwzM" },
    detail: {
      category: "Electronic · Single",
      facts: [
        { label: "Released", value: "Jul 3, 2026" },
        { label: "Length", value: "4:46" },
        { label: "Label", value: "Jowikroon (self-released)" },
      ],
      session: [
        { label: "Artist", value: "Jowikroon" },
        { label: "Format", value: "Single" },
        { label: "Platforms", value: "Spotify" },
      ],
      gear: [],
      prose: [
        { type: "lead", text: "Second official single. Live on Spotify as of July 3, 2026." },
      ],
      lyrics: [],
    },
  },
  {
    title: "Beat Drop",
    slug: "beat-drop",
    artist: "Jowikroon",
    provider: "spotify",
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-01-01",
    duration: "2:44",
    cover: "https://i.scdn.co/image/ab67616d0000b273e9e292c832749ec9b5aecd66",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    listenUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    links: {
      spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
      youtube: "https://youtube.com/shorts/95_c0K98HCY",
      suno: "https://suno.com/@jowikroon",
    },
    videoFile: "/media/final_neon_beat_drop.mp4",
    videoUrl: "https://youtube.com/shorts/95_c0K98HCY",
    detail: {
      category: "Electronic · Single",
      facts: [
        { label: "Released", value: "2026" },
        { label: "Length", value: "2:44" },
        { label: "Type", value: "Official single" },
        { label: "As", value: "Jowikroon" },
      ],
      session: [
        { label: "Status", value: "Released" },
        { label: "Host", value: "Spotify" },
        { label: "Artist", value: "Jowikroon" },
        { label: "Tempo", value: "~124 BPM" },
        { label: "Style", value: "Minimal techno · funk-house" },
        { label: "Also on", value: "Suno" },
      ],
      gear: [
        { name: "Drum machine", note: "tight, punchy kick with crisp offbeat hi-hats and soft, filtered claps for a hypnotic pulse" },
        { name: "Sub bass", note: "rounded, rubbery low end locked to the kick" },
        { name: "Arp synth", note: "looping arpeggiated pattern with subtle, evolving variation" },
        { name: "Piano", note: "bright, syncopated riff that adds the human \"player\" touch" },
        { name: "Analog-style pads", note: "slow-blooming background chords that fill space without crowding the groove" },
      ],
      prose: [
        { type: "lead", text: "Beat Drop is my first official single, out now on Spotify under my artist name Jowikroon." },
        { type: "p", text: "An energetic electronic track with an official video. Press play above to listen, or open it on Spotify." },
        { type: "h2", id: "style", text: "Sound & style" },
        { type: "p", text: "Mellow, mid-tempo groove around 124 BPM, blending minimal techno with a warm, funk-infused house feel. The mix is ultra-clean and precise: a tight, punchy kick locks in with a rounded, rubbery sub bass, while crisp offbeat hi-hats and soft, filtered claps create a steady, hypnotic pulse." },
        { type: "p", text: "Instead of dense layering, a few carefully chosen elements carry the track, an arpeggiated synth pattern loops with subtle variation, interacting with a bright, syncopated piano riff that adds a human, \"player\" touch. Analog-style pads bloom slowly in the background, filling space without crowding the groove." },
        { type: "p", text: "The arrangement evolves through gradual filtering, muting, and reintroducing parts, with occasional restrained risers for tension. The focus stays on repetition, groove and tonal clarity, a smooth, hypnotic flow that feels both mechanical and soulful, built for understated but uplifting movement on the dancefloor." },
        { type: "callout", kicker: "Out now", text: "Released as Jowikroon, the artist alias of Hans van Leeuwen. Also on Suno." },
      ],
      lyrics: [
        { tag: "Verse 1", lines: ["Clock ticks", "Time flies", "Neon whispers", "Behind my eyes", "A new sound grows", "A rhythm takes hold"] },
        { tag: "Pre-Chorus", lines: ["Something's coming", "Can you feel it now", "Static in the airwaves", "Sweat upon your brow"] },
        { tag: "Chorus", lines: ["Beat drop", "Yeah the beat drop", "The floor shakes", "My mind breaks", "Beat drop", "Oh the beat drop", "Laser lights flashing", "Hearts all crashing", "Beat drop", "Feel the beat drop", "Everything changes", "No more cages"] },
        { tag: "Verse 2", lines: ["Old ghosts fade", "New lines are drawn", "Cassette tape spinning", "Just before the dawn", "Less is more", "Then more is more again", "Keytar screaming", "Through the city rain"] },
        { tag: "Pre-Chorus", lines: ["Something's building", "Can you hear it now", "Midnight on the dial", "Turn it up and howl"] },
        { tag: "Chorus", lines: ["Beat drop", "Yeah the beat drop", "The floor shakes", "My mind breaks", "Beat drop", "Oh the beat drop", "Laser lights flashing", "Hearts all crashing", "Beat drop", "Feel the beat drop", "Everything changes", "No more cages"] },
      ],
    },
  },
  {
    title: "Hanging On (NEON master)",
    slug: "hanging-on",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-10-14",
    duration: "7:59",
    cover: "https://i1.sndcdn.com/artworks-mneK4Z6GuPDAyWnk-tw6iuQ-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14",
    links: { soundcloud: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "7:59",
      note: "Hanging On in its NEON album master (96 kHz, 24-bit), the long version as it stands before release.",
    }),
  },
  {
    title: "78 THz Texture",
    slug: "78-thz-texture",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-10-11",
    duration: "2:38",
    cover: "https://i1.sndcdn.com/artworks-ZYuvKEXMylQVE2iH-r6JYIA-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/78-thz-texture"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/78-thz-texture",
    links: { soundcloud: "https://soundcloud.com/jowikroon/78-thz-texture" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "2:38",
      note: "78 THz Texture, a short texture study built around one evolving sound.",
    }),
  },
  {
    title: "Beat Drop (original)",
    slug: "beat-drop-original",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-09-28",
    duration: "2:44",
    cover: "https://i1.sndcdn.com/artworks-mnWTKG1aNWITRn7g-gTixHQ-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/2m44-beatdrop-original"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/2m44-beatdrop-original",
    links: { soundcloud: "https://soundcloud.com/jowikroon/2m44-beatdrop-original" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "2:44",
      note: "The original version of Beat Drop. The official release lives on Spotify; this is where it started.",
    }),
  },
  {
    title: "With a Grin (stem mix)",
    slug: "with-a-grin",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-09-27",
    duration: "4:11",
    cover: "https://i1.sndcdn.com/artworks-000zz1GdKMtCxyBz-X02WMg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem",
    links: { soundcloud: "https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "4:11",
      note: "With a Grin, a stem mix concept: the parts are there, the final balance is still moving.",
    }),
  },
  {
    title: "That Spark",
    slug: "that-spark",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-07-12",
    duration: "3:09",
    cover: "https://i1.sndcdn.com/artworks-KzObgF8l73kd5EiV-sPCntg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/pressure-remastered-x2-4"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4",
    links: { soundcloud: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "3:09",
      note: "That Spark, a concept track that grew out of an earlier remaster session.",
    }),
  },
  {
    title: "Beat Between Our Years",
    slug: "beat-between-our-years",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-06-13",
    duration: "4:26",
    cover: "https://i1.sndcdn.com/artworks-Lb2WRfIP4rmG3lAC-g6H5HA-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/beat-between-our-years"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/beat-between-our-years",
    links: { soundcloud: "https://soundcloud.com/jowikroon/beat-between-our-years" },
    detail: conceptDetail({
      category: "Electronic · Pre-release concept",
      released: "SoundCloud · 2026",
      length: "4:26",
      note: "Beat Between Our Years, an early concept and one of the first tracks I put online.",
    }),
  },
];

/** Genre filter pills, ported from the prototype toolbar. */
export const GENRE_FILTERS: { tag: "all" | GenreTag; label: string }[] = [
  { tag: "all", label: "All" },
  { tag: "electronic", label: "Electronic" },
  { tag: "pop", label: "Pop" },
];

export function getSongBySlug(slug: string | undefined): Song | undefined {
  if (!slug) return undefined;
  return songs.find((s) => s.slug === slug);
}

