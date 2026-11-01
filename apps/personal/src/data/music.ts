/**
 * music.ts, typed Song data for the /music section.
 *
 * Ported 1:1 from the claude.ai/design handoff bundle:
 *   _redesign-handoff/project/Music.html  (songs grid + featured release)
 *   _redesign-handoff/project/song-template.html  (per-song detail body)
 *
 * Public SoundCloud recordings are verified by immutable track ID and public
 * RSS metadata. Never invent lyrics or production equipment where no
 * artist-approved information exists. Private/follower-only work is excluded.
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
  /** ISO date: official release for Spotify, public upload for SoundCloud. */
  date: string;
  /** Stable ID of a verified public SoundCloud recording; never a private token. */
  soundcloudTrackId?: number;
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
  kicker: "Latest official release",
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

/** Source-grounded public SoundCloud metadata, without invented gear or lyrics. */
function conceptDetail(opts: { category: string; uploaded: string; length: string; note: string; version?: string }): SongDetail {
  return {
    category: opts.category,
    facts: [
      { label: "Uploaded", value: opts.uploaded },
      { label: "Length", value: opts.length },
      { label: "Availability", value: "Public on SoundCloud" },
      { label: "As", value: "Jowikroon" },
    ],
    session: [
      { label: "Platform", value: "SoundCloud" },
      { label: "Availability", value: "Public recording" },
      ...(opts.version ? [{ label: "Version", value: opts.version }] : []),
      { label: "Artist", value: "Jowikroon" },
    ],
    gear: [],
    prose: [
      { type: "lead", text: opts.note },
      { type: "p", text: "The date above is the public SoundCloud upload date, not necessarily the composition, mastering or official release date." },
      { type: "callout", kicker: "Listen", text: "Play this SoundCloud recording above or open its source page. Instrument and lyric details appear only when verified." },
    ],
    lyrics: [],
  };
}

/** Two official Spotify singles and seven verified public SoundCloud uploads. */
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
    cover: "https://i.scdn.co/image/ab67616d0000e1a30f634758128b532d176879d6",
    embed: "https://open.spotify.com/embed/album/2JAngR51N6h1mTUI43MHge?utm_source=generator",
    embedHeight: 352,
    listenUrl: "https://open.spotify.com/album/2JAngR51N6h1mTUI43MHge",
    links: { spotify: "https://open.spotify.com/track/5ubWiujjSERZhUzxLeqwzM" },
    detail: {
      category: "Electronic · Single",
      facts: [
        { label: "Released", value: "Jul 3, 2026" },
        { label: "Length", value: "4:46" },
        { label: "Type", value: "Official single" },
        { label: "As", value: "Jowikroon" },
      ],
      session: [
        { label: "Status", value: "Released" },
        { label: "Host", value: "Spotify" },
        { label: "Artist", value: "Jowikroon" },
        { label: "Style", value: "French touch house · rock vocal" },
        { label: "Lead", value: "Male vocal + gritty violin" },
        { label: "Label", value: "Jowikroon (self-released)" },
      ],
      gear: [
        { name: "Drum machine", note: "straight four-on-the-floor kick holding the whole track together" },
        { name: "Bass", note: "rubbery and sidechained, so the low end breathes with every kick" },
        { name: "Filtered disco loops", note: "the French touch backbone, opening and closing across the arrangement" },
        { name: "Violin", note: "gritty lead line, the one raw element in an otherwise polished mix" },
        { name: "Pads", note: "shimmering beds that keep the verses moody and spacious" },
        { name: "Piano", note: "bright stabs that land with the chorus" },
        { name: "Strings", note: "swells that lift the chorus over the top" },
        { name: "Vocals", note: "rangy, emotive male lead in a stadium-rock register; chopped hooks, gang vocals and octave doubles stacked on the final chorus" },
      ],
      prose: [
        { type: "lead", text: "Neon House of Glass is my second official single, out now on Spotify under my artist name Jowikroon." },
        { type: "p", text: "French touch house with a rock voice on top. Press play above to listen, or open it on Spotify." },
        { type: "h2", id: "style", text: "Sound & style" },
        { type: "p", text: "A dance track built on filtered disco loops, a rubbery sidechained bass and a straight four-on-the-floor kick. Over that sits a male lead vocal in a rangy, emotive rock register, closer to a stadium frontman than to a club vocal, with shimmering pads underneath and a gritty violin carrying the lead line." },
        { type: "p", text: "The verses stay moody and spacious: pads, filter, room to breathe. The choruses explode, with chopped vocal hooks, bright piano stabs and string swells arriving at once. The final chorus stacks crowd-style gang vocals and octave doubles on top for maximum festival lift." },
        { type: "h2", id: "about", text: "What it is about" },
        { type: "p", text: "The song sits in one gap: a thousand hearts on the screen and still nobody in the room. Every verse adds more signal, more faces, more comments, a frozen laugh in a thumbnail, and every chorus lands on the same line anyway." },
        { type: "p", text: "That is why the track keeps getting bigger while the lyric never resolves. The bridge is the only place the polish breaks: the violin cuts through raw, and what is left over is a question instead of an answer." },
        { type: "callout", kicker: "Out now", text: "Released as Jowikroon, the artist alias of Hans van Leeuwen." },
      ],
      lyrics: [
        { tag: "Verse 1", lines: ["Scrolling through a thousand faces", "Every smile in a little blue frame", "I'm talking big love", "Big faith", "Big changes", "But it's all just code in my name", "My shadow on the kitchen wall", "Glows cold from a phantom call", "I'm a saint in a silent feed", "Got a thousand hearts", "Still missing what I need"] },
        { tag: "Chorus", lines: ["I live in a neon house of glass", "Where the echoes dance and the real ones pass", "I raise my hands to a pixel sky", "But I still can't feel you", "Still can't feel you", "I'm screaming your name through a fiber wire", "While the crowd goes wild in a slow-burn fire", "I'm a king of the lonely", "Wired and high", "And I still can't feel you", "Still can't feel you"] },
        { tag: "Verse 2", lines: ["You're a thumbnail in the corner of the screen", "Frozen laugh in a grainy freeze-frame", "I toast you with my energy drink", "Like communion for the wired and awake", "I've got friends in a comment storm", "They all cheer when I look reborn", "But the room stays hollow and plain", "Every drop", "Every hit", "Just circling the drain"] },
        { tag: "Chorus", lines: ["I live in a neon house of glass", "Where the echoes dance and the real ones pass", "I raise my hands to a pixel sky", "But I still can't feel you", "Still can't feel you", "I'm screaming your name through a fiber wire", "While the crowd goes wild in a slow-burn fire", "I'm a king of the lonely", "Wired and high", "And I still can't feel you", "Still can't feel you"] },
        { tag: "Bridge", lines: ["(Violin cuts through, raw and soaring)", "You hear that cry? (that's me)", "Inside the shine? (that's me)", "Bending every note till the circuits bleed", "I'm a halo glitching in the stream (that's me, that's me)", "Will you break this screen?", "Will you break this screen?"] },
        { tag: "Final Chorus", lines: ["I live in a neon house of glass", "Where the echoes dance and the real ones pass", "I raise my hands to a pixel sky", "But I still can't feel you", "Still can't feel you", "I'm screaming your name through a fiber wire", "While the crowd goes wild in a slow-burn fire", "I'm a king of the lonely", "Wired and high", "And I still can't feel you", "Still can't feel you"] },
      ],
    },
  },
  {
    title: "Beat Drop",
    slug: "beat-drop",
    artist: "Jowikroon",
    provider: "spotify",
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-05-28",
    duration: "2:44",
    cover: "https://i.scdn.co/image/ab67616d0000e1a3cbd4121e25004196fea34fbf",
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
        { label: "Released", value: "May 28, 2026" },
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
    title: "Loop in Control",
    slug: "loop-in-control",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-10-27",
    soundcloudTrackId: 2426601855,
    duration: "2:20",
    cover: "https://i1.sndcdn.com/artworks-Nhk0PzMrYl3UTyQb-59m3Yw-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/loop-in-control"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/loop-in-control",
    links: { soundcloud: "https://soundcloud.com/jowikroon/loop-in-control" },
    detail: conceptDetail({
      category: "Electronic · SoundCloud recording",
      uploaded: "Oct 27, 2026",
      length: "2:20",
      note: "I can stay inside a loop and still end up somewhere else. A familiar phrase returns, but each pass makes room for a new movement or a detail I missed before.",
    }),
  },
  {
    title: "Hanging On",
    slug: "hanging-on",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-10-14",
    soundcloudTrackId: 2419106913,
    duration: "7:59",
    cover: "https://i1.sndcdn.com/artworks-mneK4Z6GuPDAyWnk-tw6iuQ-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14",
    links: { soundcloud: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14" },
    detail: conceptDetail({
      category: "Electronic · NEON master recording",
      uploaded: "Oct 14, 2026",
      length: "7:59",
      version: "NEON master upload (labelled 96 kHz / 24-bit)",
      note: "The public NEON master upload of Hanging On, a longer recording from the evolving NEON: The Signal Between project. This is not a confirmation of a final album release.",
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
    soundcloudTrackId: 2417003193,
    duration: "2:38",
    cover: "https://i1.sndcdn.com/artworks-ZYuvKEXMylQVE2iH-r6JYIA-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/78-thz-texture"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/78-thz-texture",
    links: { soundcloud: "https://soundcloud.com/jowikroon/78-thz-texture" },
    detail: conceptDetail({
      category: "Electronic · Instrumental study",
      uploaded: "Oct 11, 2026",
      length: "2:38",
      note: "An instrumental electronic texture study outside the current NEON album narrative. The frequency in the title is a creative image, not a technical measurement of this recording.",
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
    soundcloudTrackId: 2408843010,
    duration: "2:44",
    cover: "https://i1.sndcdn.com/artworks-lRI2OW2Kb5R9qlVD-X2Mp9Q-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/2m44-beatdrop-original"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/2m44-beatdrop-original",
    links: { soundcloud: "https://soundcloud.com/jowikroon/2m44-beatdrop-original" },
    detail: conceptDetail({
      category: "Electronic · SoundCloud version",
      uploaded: "Sep 28, 2026",
      length: "2:44",
      version: "SoundCloud original mix",
      note: "This public SoundCloud upload is a version of Beat Drop. The official single was released on Spotify on May 28, 2026; this SoundCloud upload appeared later on September 28.",
    }),
  },
  {
    title: "With a Grin",
    slug: "with-a-grin",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2026-09-27",
    soundcloudTrackId: 2408431119,
    duration: "4:11",
    cover: "https://i1.sndcdn.com/artworks-000zz1GdKMtCxyBz-X02WMg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem",
    links: { soundcloud: "https://soundcloud.com/jowikroon/with-a-grin-stem-mix-1-stem" },
    detail: conceptDetail({
      category: "Electronic · SoundCloud recording",
      uploaded: "Sep 27, 2026",
      length: "4:11",
      version: "Stem-mix upload",
      note: "With a Grin, shared publicly in a stem-mix version. This upload documents one recording without presenting it as a definitive album master.",
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
    soundcloudTrackId: 2359045115,
    duration: "3:09",
    cover: "https://i1.sndcdn.com/artworks-LuCwVgVw9ENtQakh-Ds8W2g-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/pressure-remastered-x2-4"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4",
    links: { soundcloud: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4" },
    detail: conceptDetail({
      category: "Electronic · NEON recording",
      uploaded: "Jul 12, 2026",
      length: "3:09",
      note: "A small spark can be enough to feel movement again. This track leaves that first flicker room to breathe before turning it into a larger story.",
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
    soundcloudTrackId: 2338891766,
    duration: "4:26",
    cover: "https://i1.sndcdn.com/artworks-Lb2WRfIP4rmG3lAC-g6H5HA-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/beat-between-our-years"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/beat-between-our-years",
    links: { soundcloud: "https://soundcloud.com/jowikroon/beat-between-our-years" },
    detail: conceptDetail({
      category: "Electronic · SoundCloud recording",
      uploaded: "Jun 13, 2026",
      length: "4:26",
      note: "An early Jowikroon recording from the public SoundCloud timeline. This page documents the available version without assuming it is a finished album master.",
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

