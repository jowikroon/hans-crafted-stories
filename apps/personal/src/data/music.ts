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

import coverNightline from "@/assets/music/cover-nightline.png";
import coverSlowStatic from "@/assets/music/cover-slow-static.png";
import coverPaperCranes from "@/assets/music/cover-paper-cranes.png";
import coverAmber from "@/assets/music/cover-amber.png";

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

export interface Song {
  title: string;
  slug: string;
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
  /** Spotify embed src for the inline lazy player (from data-embed). */
  embed: string;
  /** Height of the inline embed iframe (data-height in the prototype). */
  embedHeight: number;
  /** Direct Spotify track link (for the "Listen on" platform buttons). */
  spotifyUrl: string;
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
  title: "Nightline — EP",
  sub: "Four tracks recorded between late-night sessions over one winter. Warm tape, soft synths, and a lot of re-takes. Full notes on each song below.",
  chips: ["2026", "Lo-fi · Electronic", "4 tracks"],
  embed: "https://open.spotify.com/embed/album/7gHaf9f1kcQaOtg9sMzPlo?utm_source=generator",
  embedHeight: 352,
};

/* ── Shared demo detail content ──────────────────────────────────────────
   The prototype only fleshed out Nightline. We reuse it as the body for
   every track for v1. TODO: replace per-song with real production notes,
   gear and lyrics.
   ----------------------------------------------------------------------- */

const demoProse: ProseBlock[] = [
  {
    type: "lead",
    text: '"Nightline" started as a two-bar loop I almost deleted. Here\'s how a throwaway idea became the opener of the EP — and everything I changed along the way.',
  },
  { type: "h2", id: "spark", text: "The spark" },
  {
    type: "p",
    text: "It was past midnight and I was noodling on a borrowed Juno. I recorded one pad chord, slowed it down, and the wobble in the tape made it feel like the room was breathing. That texture became the whole mood of the track. I built everything else around keeping that feeling intact.",
  },
  {
    type: "p",
    text: "The lesson I keep relearning: <strong>protect the accident.</strong> The thing that made me sit up was an imperfection, and the temptation is always to clean it up until it's dead.",
  },
  {
    type: "callout",
    kicker: "One thing that worked",
    text: 'I committed to the tape wobble early by printing it to audio instead of keeping it as a plugin. Once it was "real", I stopped second-guessing it and the arrangement came together in an evening.',
  },
  { type: "h2", id: "arrangement", text: "Building the arrangement" },
  {
    type: "p",
    text: "Drums came last, not first. I wanted the song to feel like it was floating before the beat anchored it, so the first chorus has no kick at all — just brushed percussion and the bass implying the pulse. When the full kit lands in the second verse it actually feels like an event.",
  },
  {
    type: "p",
    text: "The bassline is a single overdub played on a cheap short-scale bass, compressed hard so the dynamics flatten into something hypnotic. Sometimes the budget gear is the sound.",
  },
  { type: "h2", id: "mix", text: "Mixing & the mistakes" },
  {
    type: "p",
    text: "I over-compressed the master on the first three bounces. It sounded loud and impressive on my headphones and completely lifeless in the car. I pulled the limiter back by 3 dB, let the chorus breathe, and the song finally felt three-dimensional.",
  },
  {
    type: "p",
    text: "If you take one thing from these notes: <strong>reference on the worst speakers you own.</strong> The phone speaker told me more truth than my monitors did.",
  },
  {
    type: "pull",
    text: "A song isn't finished when there's nothing left to add — it's finished when removing one more thing would break it.",
  },
  { type: "h2", id: "release", text: "Putting it out" },
  {
    type: "p",
    text: 'I sat on this for two months because it felt too simple. That was fear, not taste. The simplest tracks are usually the ones people actually keep. I released it, and "Nightline" is now the most-played thing I\'ve made.',
  },
];

const demoGear: GearItem[] = [
  { name: "Roland Juno-106", note: "main pad & the tape-wobble chord" },
  { name: "Short-scale bass", note: "single compressed overdub" },
  { name: "Cassette 4-track", note: "printed warmth & saturation" },
  { name: "Valhalla VintageVerb", note: "the big chorus space" },
  { name: "SM57", note: "brushed percussion & room" },
];

const demoLyrics: LyricSection[] = [
  {
    tag: "Verse 1",
    lines: [
      "Streetlights bleed across the ceiling",
      "Half a thought I can't hold on",
      "The city hums a frequency",
      "And I'm awake when everyone's gone",
    ],
  },
  {
    tag: "Chorus",
    lines: [
      "So I'm on the nightline",
      "Talking to the quiet",
      "Every wire in the dark",
      "Carries something I can't say in the light",
    ],
  },
  {
    tag: "Verse 2",
    lines: [
      "You said the morning fixes everything",
      "But I trust the smaller hours more",
      "They don't ask me to pretend",
      "That I know what I'm reaching for",
    ],
  },
  {
    tag: "Bridge",
    lines: ["If you're up too", "Leave the line open", "We don't have to fill it", "Just don't hang up"],
  },
];

const LYRICS_PLACEHOLDER = "Placeholder lyrics — swap with the real words for this track.";

/**
 * Builds a demo SongDetail. TODO: replace with real per-song content.
 * `from` is the EP/single line; `category` is the kicker above the title.
 */
function demoDetail(opts: {
  category: string;
  released: string;
  length: string;
  keyBpm: string;
  from: string;
}): SongDetail {
  return {
    category: opts.category,
    facts: [
      { label: "Released", value: opts.released },
      { label: "Length", value: opts.length },
      { label: "Key · BPM", value: opts.keyBpm },
      { label: "From", value: opts.from },
    ],
    session: [
      { label: "DAW", value: "Ableton Live 12" },
      { label: "Tempo", value: opts.keyBpm.split("·")[1]?.trim() ?? "84 BPM" },
      { label: "Key", value: opts.keyBpm.split("·")[0]?.trim() ?? "A minor" },
      { label: "Tracks", value: "18" },
      { label: "Recorded", value: "Home studio, Amersfoort" },
    ],
    gear: demoGear,
    prose: demoProse,
    lyrics: demoLyrics,
    lyricsNote: LYRICS_PLACEHOLDER,
  };
}

/** The 4 demo songs, ported exactly from Music.html (order = newest first). */
export const songs: Song[] = [
  {
    title: "Nightline",
    slug: "nightline",
    tags: ["lofi", "electronic"],
    genre: "Lo-fi",
    date: "2026-02-14",
    duration: "3:42",
    cover: coverNightline,
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    spotifyUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    detail: demoDetail({
      category: "Lo-fi · Single",
      released: "14 Feb 2026",
      length: "3:42",
      keyBpm: "A minor · 84",
      from: "Nightline EP",
    }),
  },
  {
    title: "Slow Static",
    slug: "slow-static",
    tags: ["ambient", "electronic"],
    genre: "Ambient",
    date: "2026-01-30",
    duration: "4:18",
    cover: coverSlowStatic,
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    spotifyUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    detail: demoDetail({
      category: "Ambient · Single",
      released: "30 Jan 2026",
      length: "4:18",
      keyBpm: "D minor · 72",
      from: "Nightline EP",
    }),
  },
  {
    title: "Paper Cranes",
    slug: "paper-cranes",
    tags: ["pop", "lofi"],
    genre: "Pop",
    date: "2026-01-12",
    duration: "3:05",
    cover: coverPaperCranes,
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    spotifyUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    detail: demoDetail({
      category: "Pop · Single",
      released: "12 Jan 2026",
      length: "3:05",
      keyBpm: "C major · 96",
      from: "Nightline EP",
    }),
  },
  {
    title: "Amber",
    slug: "amber",
    tags: ["ambient"],
    genre: "Ambient",
    date: "2025-12-20",
    duration: "5:01",
    cover: coverAmber,
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    embedHeight: 152,
    spotifyUrl: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    detail: demoDetail({
      category: "Ambient · Single",
      released: "20 Dec 2025",
      length: "5:01",
      keyBpm: "G minor · 68",
      from: "Nightline EP",
    }),
  },
];

/** Genre filter pills, ported from the prototype toolbar. */
export const GENRE_FILTERS: { tag: "all" | GenreTag; label: string }[] = [
  { tag: "all", label: "All" },
  { tag: "lofi", label: "Lo-fi" },
  { tag: "electronic", label: "Electronic" },
  { tag: "ambient", label: "Ambient" },
  { tag: "pop", label: "Pop" },
];

export function getSongBySlug(slug: string | undefined): Song | undefined {
  if (!slug) return undefined;
  return songs.find((s) => s.slug === slug);
}

