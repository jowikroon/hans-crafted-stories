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
  /** An editorial reading, not a lyric transcription or a finished LP running order. */
  storyTriptych?: { title: string; i: string; you: string; it: string };
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
  /** Factual visual description, checked against this specific recording's artwork. */
  coverAlt?: string;
  /** Embed src for the inline lazy player (Spotify or SoundCloud iframe). */
  embed: string;
  /** Height of the inline embed iframe. */
  embedHeight: number;
  /** Direct listen link on the host platform (Spotify or SoundCloud). */
  listenUrl: string;
  /** Optional extra platform links for the song page. */
  links?: { spotify?: string; soundcloud?: string; youtube?: string; appleMusic?: string };
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
    cover: "/images/music/neon-house-of-glass-cover.jpg",
    coverAlt: "Neon House of Glass cover: a lone figure in a violet-lit glass room on a dark shoreline, reflected in water.",
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
        { label: "Label", value: "Jowikroon (self-released)" },
      ],
      gear: [],
      prose: [
        { type: "lead", text: "Neon House of Glass is my second official single, out now on Spotify under my artist name Jowikroon." },
        { type: "p", text: "A thousand hearts on the screen. Still nobody in the room. Faces, messages and a frozen laugh in a thumbnail gather around a voice reaching for someone on the other side." },
        { type: "h2", id: "about", text: "When the room goes quiet" },
        { type: "p", text: "The music reaches outward while the words keep returning to the same distance. Beneath the glow sits a question: what does it take to feel someone near?" },
        { type: "p", text: "You might hear the thrill of being seen, the weight of an image, or a moment you recognise. The song leaves room for what you bring to it." },
      ],
      storyTriptych: {
        title: "The distance behind the glow",
        i: "I can see a thousand hearts. The room is still quiet.",
        you: "You are right there on the screen, and somehow out of reach.",
        it: "A house made of glass holds the light, but cannot bring us closer on its own.",
      },
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
    cover: "/images/music/beat-drop-cover.jpg",
    coverAlt: "Beat Drop cover: a finger touches a dark key, releasing a tiny violet spark beside the song title.",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    listenUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    links: {
      spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
      youtube: "https://youtube.com/shorts/95_c0K98HCY",
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
      ],
      gear: [],
      prose: [
        { type: "lead", text: "Beat Drop is my first official single, out now on Spotify under my artist name Jowikroon." },
        { type: "p", text: "A clock ticks, the city lights flicker, and a new rhythm takes hold. The song stays close to that charged moment before something begins." },
        { type: "h2", id: "about", text: "Something is starting" },
        { type: "p", text: "Old ghosts and new lines move through the same night. There is a pull toward the dancefloor, and the feeling that a familiar world might open into something else." },
        { type: "p", text: "A beginning can feel like excitement, release, or a little uncertainty. Listen for the moment that stays with you." },
      ],
      storyTriptych: {
        title: "Before the city moves",
        i: "I wore one song out alone.",
        you: "You fall into a city moving as one.",
        it: "It arrives exactly when the count says.",
      },
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
    coverAlt: "NEON album artwork used for Hanging On: a younger and older hand reach toward a small violet signal on black.",
    embed: scEmbed("https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14",
    links: { soundcloud: "https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14" },
    detail: {
      ...conceptDetail({
        category: "Electronic · NEON recording",
        uploaded: "Oct 14, 2026",
        length: "7:59",
        version: "Existing public master",
        note: "Hanging On keeps returning to a thought it cannot quite leave behind. A long recording from NEON: The Signal Between, with the voice and the build carrying that tension together.",
      }),
      prose: [
        { type: "lead", text: "Hanging On keeps returning to a thought it cannot quite leave behind. A long recording from NEON: The Signal Between, with the voice and the build carrying that tension together." },
        { type: "h2", id: "the-line-that-stays", text: "The line that stays" },
        { type: "p", text: "The hook returns to the same words: “I just can't keep hanging on.” The line wants to let go. The repetition keeps it close. Across almost eight minutes, that tension becomes the shape of the song." },
      ],
      storyTriptych: {
        title: "The space before letting go",
        i: "I say I cannot keep hanging on.",
        you: "You hear the words return before the decision can settle.",
        it: "The repetition holds the feeling a little longer than the sentence.",
      },
    },
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
    coverAlt: "That Spark cover: a cropped figure holds a hand to the chest, with a small violet glow beneath the fingers.",
    embed: scEmbed("https://soundcloud.com/jowikroon/pressure-remastered-x2-4"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4",
    links: { soundcloud: "https://soundcloud.com/jowikroon/pressure-remastered-x2-4" },
    detail: {
      ...conceptDetail({
        category: "Electronic · NEON recording",
        uploaded: "Jul 12, 2026",
        length: "3:09",
        note: "A small spark can be enough to feel movement again. This track leaves that first flicker room to breathe before turning it into a larger story.",
      }),
      storyTriptych: {
        title: "The smallest light",
        i: "I notice a flicker before I know what it means.",
        you: "You might see a signal where someone else sees a shadow.",
        it: "The light is small. The next step is still open.",
      },
    },
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

