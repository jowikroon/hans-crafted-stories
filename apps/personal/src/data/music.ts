/* Music catalogue — static source of truth for the /music routes.
   Mirrors the design prototype: an overview with a featured release embed,
   filterable song cards, and per-song production-notes pages (notes, specs,
   gear, lyrics). Self-produced tracks by Hans van Leeuwen. */

export type SongBlock =
  | { t: "lead"; text: string }
  | { t: "p"; text: string }
  | { t: "h2"; id: string; text: string }
  | { t: "pull"; text: string }
  | { t: "callout"; k: string; text: string };

export interface Song {
  slug: string;
  title: string;
  tags: string[];
  tag: string;
  date: string;
  dateLabel: string;
  dur: string;
  cover: string;
  embed: string;
  spotify: string;
  catLine: string;
  facts: [string, string][];
  specs: [string, string][];
  gear: string[];
  blocks: SongBlock[];
  lyrics: [string, string][];
}

export interface Release {
  kicker: string;
  title: string;
  sub: string;
  chips: string[];
  embed: string;
  height: number;
}

export const release: Release = {
  kicker: "Latest release",
  title: "Nightline — EP",
  sub: "Four tracks recorded between late-night sessions over one winter. Warm tape, soft synths, and a lot of re-takes. Full notes on each song below.",
  chips: ["2026", "Lo-fi · Electronic", "4 tracks"],
  embed: "https://open.spotify.com/embed/album/7gHaf9f1kcQaOtg9sMzPlo?utm_source=generator",
  height: 352,
};

export const genres = [
  { tag: "all", label: "All" },
  { tag: "lofi", label: "Lo-fi" },
  { tag: "electronic", label: "Electronic" },
  { tag: "ambient", label: "Ambient" },
  { tag: "pop", label: "Pop" },
];

export const songs: Song[] = [
  {
    slug: "nightline",
    title: "Nightline",
    tags: ["lofi", "electronic"],
    tag: "Lo-fi",
    date: "2026-02-14",
    dateLabel: "Feb 14, 2026",
    dur: "3:42",
    cover: "/music/cover-nightline.png",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    catLine: "Lo-fi · Single",
    facts: [["Released", "14 Feb 2026"], ["Length", "3:42"], ["Key · BPM", "A minor · 84"], ["From", "Nightline EP"]],
    specs: [["DAW", "Ableton Live 12"], ["Tempo", "84 BPM"], ["Key", "A minor"], ["Tracks", "18"], ["Recorded", "Home studio, Amersfoort"]],
    gear: [
      "<strong>Roland Juno-106</strong> — main pad &amp; the tape-wobble chord",
      "<strong>Short-scale bass</strong> — single compressed overdub",
      "<strong>Cassette 4-track</strong> — printed warmth &amp; saturation",
      "<strong>Valhalla VintageVerb</strong> — the big chorus space",
      "<strong>SM57</strong> — brushed percussion &amp; room",
    ],
    blocks: [
      { t: "lead", text: "“Nightline” started as a two-bar loop I almost deleted. Here’s how a throwaway idea became the opener of the EP — and everything I changed along the way." },
      { t: "h2", id: "spark", text: "The spark" },
      { t: "p", text: "It was past midnight and I was noodling on a borrowed Juno. I recorded one pad chord, slowed it down, and the wobble in the tape made it feel like the room was breathing. That texture became the whole mood of the track. I built everything else around keeping that feeling intact." },
      { t: "p", text: "The lesson I keep relearning: <strong>protect the accident.</strong> The thing that made me sit up was an imperfection, and the temptation is always to clean it up until it’s dead." },
      { t: "callout", k: "One thing that worked", text: "I committed to the tape wobble early by printing it to audio instead of keeping it as a plugin. Once it was “real”, I stopped second-guessing it and the arrangement came together in an evening." },
      { t: "h2", id: "arrangement", text: "Building the arrangement" },
      { t: "p", text: "Drums came last, not first. I wanted the song to feel like it was floating before the beat anchored it, so the first chorus has no kick at all — just brushed percussion and the bass implying the pulse. When the full kit lands in the second verse it actually feels like an event." },
      { t: "p", text: "The bassline is a single overdub played on a cheap short-scale bass, compressed hard so the dynamics flatten into something hypnotic. Sometimes the budget gear is the sound." },
      { t: "h2", id: "mix", text: "Mixing &amp; the mistakes" },
      { t: "p", text: "I over-compressed the master on the first three bounces. It sounded loud and impressive on my headphones and completely lifeless in the car. I pulled the limiter back by 3 dB, let the chorus breathe, and the song finally felt three-dimensional." },
      { t: "p", text: "If you take one thing from these notes: <strong>reference on the worst speakers you own.</strong> The phone speaker told me more truth than my monitors did." },
      { t: "pull", text: "A song isn’t finished when there’s nothing left to add — it’s finished when removing one more thing would break it." },
      { t: "h2", id: "release", text: "Putting it out" },
      { t: "p", text: "I sat on this for two months because it felt too simple. That was fear, not taste. The simplest tracks are usually the ones people actually keep. I released it, and “Nightline” is now the most-played thing I’ve made." },
    ],
    lyrics: [
      ["Verse 1", "Streetlights bleed across the ceiling<br/>Half a thought I can’t hold on<br/>The city hums a frequency<br/>And I’m awake when everyone’s gone"],
      ["Chorus", "So I’m on the nightline<br/>Talking to the quiet<br/>Every wire in the dark<br/>Carries something I can’t say in the light"],
      ["Verse 2", "You said the morning fixes everything<br/>But I trust the smaller hours more<br/>They don’t ask me to pretend<br/>That I know what I’m reaching for"],
      ["Bridge", "If you’re up too<br/>Leave the line open<br/>We don’t have to fill it<br/>Just don’t hang up"],
    ],
  },
  {
    slug: "slow-static",
    title: "Slow Static",
    tags: ["ambient", "electronic"],
    tag: "Ambient",
    date: "2026-01-30",
    dateLabel: "Jan 30, 2026",
    dur: "4:18",
    cover: "/music/cover-slow-static.png",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    catLine: "Ambient · Single",
    facts: [["Released", "30 Jan 2026"], ["Length", "4:18"], ["Key · BPM", "D minor · 72"], ["From", "Nightline EP"]],
    specs: [["DAW", "Ableton Live 12"], ["Tempo", "72 BPM"], ["Key", "D minor"], ["Tracks", "12"], ["Recorded", "Home studio, Amersfoort"]],
    gear: [
      "<strong>Granular pad</strong> — frozen field recording, stretched 8x",
      "<strong>Tape delay</strong> — the slow wash that names the track",
      "<strong>Modular noise</strong> — the “static” bed under everything",
      "<strong>Upright piano</strong> — single felted motif, recorded close",
    ],
    blocks: [
      { t: "lead", text: "“Slow Static” is barely a song — it’s a texture I kept living in until it became one. Notes on letting a track stay almost-empty." },
      { t: "h2", id: "origin", text: "Where it came from" },
      { t: "p", text: "I recorded ten minutes of rain on a balcony, pulled one second of it into a granular sampler, and stretched it until it became a chord. Everything you hear grew out of that single frozen moment." },
      { t: "callout", k: "One thing that worked", text: "Resisting the urge to add drums. The track only works because nothing competes with the air in it." },
      { t: "h2", id: "space", text: "Composing with space" },
      { t: "p", text: "The hardest part of ambient is knowing when a track is doing enough. I muted elements one by one and kept only the ones whose absence I missed. Four passes later there were three sounds left, and it finally felt complete." },
      { t: "pull", text: "Silence is an instrument. Most mixes are just too crowded to hear it play." },
      { t: "h2", id: "mix", text: "The mix" },
      { t: "p", text: "No compression on the master at all — just gentle tape saturation for glue. I wanted the dynamics to stay wide so the quiet parts are genuinely quiet and the swell at 2:40 actually lifts." },
    ],
    lyrics: [
      ["Note", "Instrumental — no lyrics. The “words” are in the field recording: rain, a distant train, and a door that never quite closes."],
    ],
  },
  {
    slug: "paper-cranes",
    title: "Paper Cranes",
    tags: ["pop", "lofi"],
    tag: "Pop",
    date: "2026-01-12",
    dateLabel: "Jan 12, 2026",
    dur: "3:05",
    cover: "/music/cover-paper-cranes.png",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    catLine: "Pop · Single",
    facts: [["Released", "12 Jan 2026"], ["Length", "3:05"], ["Key · BPM", "C major · 96"], ["From", "Nightline EP"]],
    specs: [["DAW", "Ableton Live 12"], ["Tempo", "96 BPM"], ["Key", "C major"], ["Tracks", "24"], ["Recorded", "Home studio, Amersfoort"]],
    gear: [
      "<strong>Acoustic guitar</strong> — capo 3, the whole skeleton of the song",
      "<strong>Stacked vocal harmonies</strong> — six takes, panned wide",
      "<strong>Tape-flutter Rhodes</strong> — the warble in the choruses",
      "<strong>Brushes on a snare</strong> — the only “real” drum",
    ],
    blocks: [
      { t: "lead", text: "The one upbeat track on the EP. “Paper Cranes” is the closest I get to pop — here’s how a folk sketch turned into the brightest thing I’ve recorded." },
      { t: "h2", id: "sketch", text: "From sketch to song" },
      { t: "p", text: "It began as a voice memo on a train: one guitar line and a hummed melody. I almost never finish the happy ones, but this hook wouldn’t leave, so I forced myself to track it the same week before the energy faded." },
      { t: "callout", k: "One thing that worked", text: "Recording the vocal harmonies fast and slightly imperfect. The tiny timing differences are what make the stack feel human instead of auto-tuned." },
      { t: "h2", id: "hook", text: "Earning the hook" },
      { t: "p", text: "A pop chorus has to feel inevitable. I held the title line back until the very end of the first chorus so it lands as a release rather than a setup. Small structural choice, big difference in how sticky it feels." },
      { t: "pull", text: "Joy is harder to record than melancholy — it shows every seam." },
      { t: "h2", id: "mix", text: "Keeping it bright" },
      { t: "p", text: "I mixed this one louder and brighter than the rest of the EP on purpose. It’s the daylight track. A little more top end, a little more compression, and a wide stereo image so it feels open rather than intimate." },
    ],
    lyrics: [
      ["Verse 1", "Folded all my worries into wings<br/>Lined them up along the windowsill<br/>Some of them will never learn to fly<br/>But I keep folding still"],
      ["Chorus", "Paper cranes on a kitchen string<br/>Catching morning like it means a thing<br/>Nothing here is built to last<br/>And that’s the most alive I’ve been"],
      ["Bridge", "If they tear, I’ll fold another<br/>Out of every yesterday<br/>A thousand of them by the summer<br/>And I’ll let the wind decide which stay"],
    ],
  },
  {
    slug: "amber",
    title: "Amber",
    tags: ["ambient"],
    tag: "Ambient",
    date: "2025-12-20",
    dateLabel: "Dec 20, 2025",
    dur: "5:01",
    cover: "/music/cover-amber.png",
    embed: "https://open.spotify.com/embed/track/5e5vN1pm3NUY0OQdM7uqSl?utm_source=generator",
    spotify: "https://open.spotify.com/track/5e5vN1pm3NUY0OQdM7uqSl",
    catLine: "Ambient · Single",
    facts: [["Released", "20 Dec 2025"], ["Length", "5:01"], ["Key · BPM", "E♭ major · 60"], ["From", "Nightline EP"]],
    specs: [["DAW", "Ableton Live 12"], ["Tempo", "60 BPM"], ["Key", "E♭ major"], ["Tracks", "9"], ["Recorded", "Home studio, Amersfoort"]],
    gear: [
      "<strong>Felt piano</strong> — the recurring four-note figure",
      "<strong>Bowed guitar</strong> — the long amber-coloured swells",
      "<strong>Convolution reverb</strong> — sampled from an empty church",
      "<strong>Sub drone</strong> — felt more than heard",
    ],
    blocks: [
      { t: "lead", text: "The longest, slowest thing on the EP. “Amber” is five minutes of one idea breathing. Notes on patience, warmth, and resisting the edit." },
      { t: "h2", id: "warmth", text: "Chasing warmth" },
      { t: "p", text: "I wanted a track that felt like late-afternoon light through a window — that specific amber colour. Everything I added had to make the room feel warmer, or it came back out. The felted piano set the temperature and the rest followed." },
      { t: "callout", k: "One thing that worked", text: "Recording the church reverb impulse myself instead of using a preset. The real space has irregularities a preset never gives you, and it’s the whole reason the track sounds alive." },
      { t: "h2", id: "patience", text: "A study in patience" },
      { t: "p", text: "Nothing in “Amber” happens quickly. The swell takes ninety seconds to arrive. I had to fight every instinct to make something happen sooner, but the payoff only works because the wait is real." },
      { t: "pull", text: "Some songs you write. This one I mostly just stayed out of the way of." },
      { t: "h2", id: "close", text: "Letting it end" },
      { t: "p", text: "It fades for almost forty seconds. I let the last bowed note ring until the noise floor swallowed it, because the disappearing is the point. It’s the quietest goodbye I could record." },
    ],
    lyrics: [
      ["Note", "Instrumental. If it had words they’d only get in the way of the light."],
    ],
  },
];

export const getSong = (slug?: string): Song | undefined =>
  songs.find((s) => s.slug === slug);
