/**
 * music.ts — typed Song data for the /music section.
 *
 * Ported 1:1 from the claude.ai/design handoff bundle:
 *   _redesign-handoff/project/Music.html  (songs grid + featured release)
 *   _redesign-handoff/project/song-template.html  (per-song detail body)
 *
 * The prototype shipped ONE filled-in detail template (Nightline) and three
 * stub cards. For v1 every track therefore reuses the Nightline production
 * notes / gear / lyrics as demo content, lightly varied per track. Real
 * per-song copy is expected to replace `detail` later — see TODO markers.
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
   * renderer injects via dangerouslySetInnerHTML — content is author-trusted,
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
  /** Concept / work-in-progress track (≈90%) — shown with a "Concept" badge. */
  concept?: boolean;
  /** Genre filter tags (first one is also the primary genre label source). */
  tags: GenreTag[];
  /** Human label shown in the meta row, e.g. "Lo-fi". */
  genre: string;
  /** ISO date (YYYY-MM-DD) — used for sort + display. */
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
  links?: { spotify?: string; soundcloud?: string; youtube?: string; appleMusic?: string };
  /** Optional YouTube watch link (official video) — shown as a "Watch on YouTube" card. */
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

/** Featured "Nightline — EP" release card, ported from Music.html. */
export const featuredRelease: Release = {
  kicker: "Latest release",
  title: "Beat Drop",
  sub: "My first official single, out now on Spotify — released as Jowikroon. The tracks below are concept versions (around 90% done) you can already hear on SoundCloud.",
  chips: ["2026", "Electronic", "Single"],
  embed: "https://open.spotify.com/embed/album/7gHaf9f1kcQaOtg9sMzPlo?utm_source=generator",
  embedHeight: 352,
};

/** Build a SoundCloud iframe embed URL from a track page URL. */
function scEmbed(trackUrl: string): string {
  const u = encodeURIComponent(trackUrl);
  return `https://w.soundcloud.com/player/?url=${u}&color=%231C6B45&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
}

/** Lighter detail for the concept tracks — honest, no fabricated studio specs. */
function conceptDetail(opts: { category: string; released: string; length: string; note: string }): SongDetail {
  return {
    category: opts.category,
    facts: [
      { label: "Released", value: opts.released },
      { label: "Length", value: opts.length },
      { label: "Status", value: "Concept · ~90%" },
      { label: "As", value: "Jowikroon" },
    ],
    session: [
      { label: "Status", value: "Concept (~90%)" },
      { label: "Host", value: "SoundCloud" },
      { label: "Artist", value: "Jowikroon" },
    ],
    gear: [],
    prose: [
      { type: "lead", text: opts.note },
      {
        type: "p",
        text: "This is a concept version — roughly 90% finished and already worth a listen. The mix, arrangement and a final master are still being polished before it goes to streaming platforms.",
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
      youtube: "https://youtube.com/shorts/dpOHLmNUpCE",
    },
    videoUrl: "https://youtube.com/shorts/dpOHLmNUpCE",
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
      ],
      gear: [],
      prose: [
        { type: "lead", text: "Beat Drop is my first official single, out now on Spotify under my artist name Jowikroon." },
        { type: "p", text: "An energetic electronic track with an official video. Press play above to listen, or open it on Spotify." },
        { type: "callout", kicker: "Out now", text: "Released as Jowikroon — the artist alias of Hans van Leeuwen." },
      ],
      lyrics: [],
    },
  },
  {
    title: "Teacher Leave (Remastered x2)",
    slug: "teacher-leave",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2025-12-01",
    duration: "—",
    cover: "https://i1.sndcdn.com/avatars-CRNs7sDBulfbcqSz-QEQetg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/teacher-leave-remastered-x2-2"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/teacher-leave-remastered-x2-2",
    links: { soundcloud: "https://soundcloud.com/jowikroon/teacher-leave-remastered-x2-2" },
    detail: conceptDetail({
      category: "Electronic · Concept",
      released: "Concept · 2025",
      length: "—",
      note: "Teacher Leave — a remastered concept version, already most of the way there.",
    }),
  },
  {
    title: "Hanging On (Remastered)",
    slug: "hanging-on",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic", "pop"],
    genre: "Electronic",
    date: "2025-11-01",
    duration: "—",
    cover: "https://i1.sndcdn.com/avatars-CRNs7sDBulfbcqSz-QEQetg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/hanging-on-remastered"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/hanging-on-remastered",
    links: { soundcloud: "https://soundcloud.com/jowikroon/hanging-on-remastered" },
    detail: conceptDetail({
      category: "Electronic · Concept",
      released: "Concept · 2025",
      length: "—",
      note: "Hanging On — a remastered concept, in the final stretch before release.",
    }),
  },
  {
    title: "Beat Between Our Years × Layer Cake Universe (Mashup)",
    slug: "beat-between-our-years",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Mashup",
    date: "2025-10-01",
    duration: "—",
    cover: "https://i1.sndcdn.com/avatars-CRNs7sDBulfbcqSz-QEQetg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/beat-between-our-years"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/beat-between-our-years",
    links: { soundcloud: "https://soundcloud.com/jowikroon/beat-between-our-years" },
    detail: conceptDetail({
      category: "Mashup · Concept",
      released: "Concept · 2025",
      length: "—",
      note: "A mashup concept — Beat Between Our Years (remastered) blended with Layer Cake Universe.",
    }),
  },
  {
    title: "New Level (Main Menu)",
    slug: "new-level",
    artist: "Jowikroon",
    provider: "soundcloud",
    concept: true,
    tags: ["electronic"],
    genre: "Electronic",
    date: "2025-09-01",
    duration: "—",
    cover: "https://i1.sndcdn.com/avatars-CRNs7sDBulfbcqSz-QEQetg-t500x500.jpg",
    embed: scEmbed("https://soundcloud.com/jowikroon/new-level-main-menu/s-GOSTK3LpU7S"),
    embedHeight: 166,
    listenUrl: "https://soundcloud.com/jowikroon/new-level-main-menu/s-GOSTK3LpU7S",
    links: { soundcloud: "https://soundcloud.com/jowikroon/new-level-main-menu/s-GOSTK3LpU7S" },
    detail: conceptDetail({
      category: "Electronic · Concept",
      released: "Concept · 2025",
      length: "—",
      note: "New Level (Main Menu) — a concept track, private SoundCloud share.",
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

