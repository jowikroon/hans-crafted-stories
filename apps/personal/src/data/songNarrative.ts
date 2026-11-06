/**
 * songNarrative.ts, the story layer for /music/:slug.
 *
 * Every song page carried production metadata but no narrative. This file adds
 * the missing part: why the song exists, what the writing does, where it sits
 * in the album world, and what to listen for.
 *
 * Sources: the artist's own per-song notes in the NEON Album working archive
 * ("Wat <titel> zo goed laat werken") and the album concept document. Private
 * biography stays out by design; the public level is felt, not told. No lyric
 * line is quoted here that is not already printed on the page itself.
 *
 * House rules honoured here:
 *  - no em dashes in any public string;
 *  - artwork credited to the artist's own plates;
 *  - the AI note stays a neutral credit row, never part of the story.
 */

export type SongWorld = "neon" | "outside";

export interface ListeningCue {
  /** Short label, e.g. "In the bridge". */
  at: string;
  /** What to listen for. */
  text: string;
}

export interface StudioInstrument {
  /** Instrument or sound source as it is credited on the page. */
  name: string;
  /** What it does in this track. */
  role: string;
}

/**
 * Where the track stands in the Ableton Live rebuild.
 *  planned      the rebuild has not started;
 *  in-progress  the session is open and parts are being replayed;
 *  rebuilt      the track now runs from the Ableton session.
 * Flip one field per song as each rebuild finishes. Nothing here claims a
 * rebuild that has not happened.
 */
export type StudioStatus = "planned" | "in-progress" | "rebuilt";

export interface SongStudio {
  status: StudioStatus;
  /** One line about the rebuild for this specific track. */
  note: string;
  /**
   * Instruments and sound sources, from the track's own documented build.
   * Left empty where the list has not been written yet: the page says so
   * rather than inventing a credit.
   */
  instruments: StudioInstrument[];
}

export interface SongNarrative {
  /** Small line above the story heading, e.g. "NEON: The Signal Between". */
  world: SongWorld;
  eyebrow: string;
  /** Where the song sits in the album world, one sentence. */
  place: string;
  heading: string;
  /** Two to four paragraphs. Plain text, no inline HTML. */
  paragraphs: string[];
  /** A line from the song, or from the artist's note about it. */
  pullQuote: string;
  /** Three things to listen for. */
  cues: ListeningCue[];
  /** How the record was built, one sentence of craft. */
  craft: string;
  /** Instruments and the state of the Ableton Live rebuild. */
  studio: SongStudio;
  /** Hero plate from the artist's own artwork archive. */
  art: {
    src: string;
    thumbnail: string;
    alt: string;
    caption: string;
  };
  /** The purple signal line that belongs to this song. */
  pulse: string;
  /** Album page this song belongs to, when it has one. */
  albumSlug?: string;
  /** Neutral credit line. Shown in the aside, never inside the story. */
  credits?: string;
}

const art = (slug: string) => `/images/music/songs/${slug}.webp`;
const thumb = (slug: string) => `/images/music/songs/${slug}-320.webp`;
const pulse = (slug: string) => `/images/music/songs/${slug}-pulse.webp`;

/**
 * Credit line for the songs that have words. The music-production credit is
 * carried in the release metadata, not on this page: the song template is
 * guarded against production-tool names (see MusicSong.test.tsx).
 */
const WRITTEN_BY_HANS = "Words by Hans van Leeuwen.";

export const songNarrative: Record<string, SongNarrative> = {
  "neon-house-of-glass": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "This is the crack in the album. Everything still shines, and the shine is glass.",
    heading: "A stadium chorus about being alone in one",
    paragraphs: [
      "A thousand hearts on a screen, and still nobody in the room. The song is built on that contradiction, and the contradiction is the point. The chorus is big enough for an arena. What it carries is the feeling of standing in one by yourself.",
      "The images stay small on purpose. An energy drink raised like communion. A laugh frozen in a thumbnail. A shadow on the kitchen wall lit by a call that never came. Nothing gets explained, so nothing turns into a lecture.",
      "In the bridge the violin takes over. It is the instrument allowed to break where the voice is not. And then comes the only real question in the song: will you break this screen. It is left open, because that is honest.",
    ],
    pullQuote: "I'm a king of the lonely, wired and high, and I still can't feel you.",
    cues: [
      { at: "First verse", text: "The filtered disco loop sits under the voice instead of carrying it. The room is already too big." },
      { at: "The bridge", text: "The violin enters raw and unquantised. For eight bars the song stops performing." },
      { at: "Final chorus", text: "The music grows while the words shrink to the same four. That gap is the song." },
    ],
    craft: "French touch house with filtered disco loops, rubber bass and four on the floor, a stadium rock vocal, and a raw violin solo.",
    art: {
      src: art("neon-house-of-glass"), thumbnail: thumb("neon-house-of-glass"),
      alt: "Dark plate with a thin outline of a house and one small violet point of light inside it.",
      caption: "One house, one point of light, and nobody in it. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "The rebuild starts with the filtered loop and the violin, the two parts that carry the contradiction.",
      instruments: [
        { name: "Filtered disco loop", role: "Swept under the verses so the floor keeps moving while the words stand still." },
        { name: "Rubber bass", role: "Short and elastic over the four on the floor. It holds the room instead of taking the melody." },
        { name: "Four on the floor kick", role: "The steady pulse everything else is measured against." },
        { name: "Lead vocal", role: "Sung at arena size, deliberately larger than the room the lyric describes." },
        { name: "Violin", role: "Takes the bridge. The only voice in the song allowed to break." },
      ],
    },
    pulse: pulse("neon-house-of-glass"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "beat-drop": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "Early in the album: the rush, the dancefloor, the city taking its first breath.",
    heading: "A song that never tells you what it does not also let you hear",
    paragraphs: [
      "The lines are short enough to tick. Clock ticks, time flies. The verse works like a second hand, and then the chorus lands in two words and takes the whole floor.",
      "What the words describe is exactly what the music does. Something builds, drops away, comes back bigger. Less is more, then more is more again is a lyric and a production method in the same breath.",
      "That is why it stays the opening single. It makes no promise it cannot keep inside two minutes and forty-four seconds.",
    ],
    pullQuote: "Less is more, then more is more again.",
    cues: [
      { at: "Intro", text: "The arpeggio arrives before the kick. The song is already moving before it starts." },
      { at: "Pre-chorus", text: "Everything thins out to one line of sub bass. That empty bar is deliberate." },
      { at: "Second verse", text: "A syncopated piano riff slips in behind the vocal and never leaves again." },
    ],
    craft: "Mellow minimal techno with warm funk house, around 124 BPM, tight kick, rubbery sub bass, arpeggio and a syncopated piano riff.",
    art: {
      src: art("beat-drop"), thumbnail: thumb("beat-drop"),
      alt: "Dark plate with a field of violet sparks above a grid of amber dots.",
      caption: "Sparks over a grid, the moment before the floor answers. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "The rebuild keeps the arrangement exactly as it is. The point of this track is what is left out.",
      instruments: [
        { name: "Kick", role: "Tight and dry at around 124 BPM. The clock the lyric ticks against." },
        { name: "Sub bass", role: "Rubbery and short, carrying the groove without filling the room." },
        { name: "Arpeggio", role: "Arrives before the kick, so the track is already moving when it starts." },
        { name: "Piano riff", role: "Syncopated, slipped in behind the vocal in the second verse and never taken out again." },
      ],
    },
    pulse: pulse("beat-drop"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "beat-drop-original": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "The same song, one room earlier. Kept public on purpose.",
    heading: "The version before it was a single",
    paragraphs: [
      "This upload is Beat Drop with the seams still showing. The official single went out on Spotify in May; this public recording appeared four months later, and it stays up because the difference is worth hearing.",
      "Nothing in the writing changed. What changed is level, polish and the decisions a release forces on you. Put the two next to each other and you can hear what mastering actually costs and actually buys.",
      "Keeping the earlier take in the open is part of how this catalogue works. The finished thing is not the only thing that happened.",
    ],
    pullQuote: "Everything changes. No more cages.",
    cues: [
      { at: "Against the single", text: "Start both and listen to the low end. The release sits tighter and lower." },
      { at: "The drop", text: "Here the transient is rawer. Less control, slightly more shock." },
      { at: "The tail", text: "The outro breathes longer before it lets go." },
    ],
    craft: "The same minimal techno and funk house frame as the single, in its earlier public mix.",
    art: {
      src: art("beat-drop-original"), thumbnail: thumb("beat-drop-original"),
      alt: "Dark plate with a bar study running from thin bars on the left to a tall amber block on the right.",
      caption: "Less is more, then more is more again, drawn out as a measurement. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "Same parts as the single, rebuilt from this earlier mix so the two versions can be compared part by part.",
      instruments: [
        { name: "Kick", role: "Rawer here than on the release. The transient is less controlled." },
        { name: "Sub bass", role: "Sits higher and looser than in the mastered version." },
        { name: "Arpeggio", role: "The same figure that opens the single." },
        { name: "Piano riff", role: "Syncopated, behind the vocal from the second verse on." },
      ],
    },
    pulse: pulse("beat-drop-original"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "hanging-on": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "The long one. Almost eight minutes of not being able to let go.",
    heading: "A relationship that will not stop, told by a line that will not stop",
    paragraphs: [
      "The lyric is tiny. One verse, one chorus. After that, a single sentence repeats dozens of times: I just can't keep hanging on.",
      "That is not laziness, it is the form. The repetition is the hanging on. The long build is the part of you that knows and stays anyway. By minute six the sentence has stopped being a complaint and become a place you live.",
      "There is exactly one moment where the narrator looks at himself instead of at her. I don't wanna be a ball and chain. It sits right before the build, and then the build swallows it.",
    ],
    pullQuote: "I just can't keep hanging on.",
    cues: [
      { at: "First two minutes", text: "Almost nothing happens. That patience is the whole design." },
      { at: "Around the halfway mark", text: "The line about the ball and chain. Last clear thought before the climb." },
      { at: "The build", text: "Layers arrive one at a time and none of them leave. Nothing here is released." },
    ],
    craft: "Clean minimal techno and progressive house in the Kalkbrenner tradition, built around one very long rise.",
    art: {
      src: art("hanging-on"), thumbnail: thumb("hanging-on"),
      alt: "A coat still hanging on a door in a dark room, lit by a thin amber line of light from the gap.",
      caption: "A coat nobody took off the hook, and a door nobody closed. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "A track that is almost eight minutes of one rise is the clearest test of the rebuild: every layer has to earn its entry.",
      instruments: [],
    },
    pulse: pulse("hanging-on"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "beat-between-our-years": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "The escape song. The engine of the album sits in here.",
    heading: "An escape song where the house is the opponent",
    paragraphs: [
      "The details are domestic and exact. The same station playing since morning. Blue television light on a face that is already angry. Nothing is explained, and that is what makes it land.",
      "The chorus works two ways at once. You can dance on the beat between our years, and you can scream that you want out on the same beat. That tension between dancing and escaping runs through the entire record.",
      "The throat singing turns it into a ritual instead of a complaint. A lament asks for pity. This asks for a door.",
    ],
    pullQuote: "Dance on the beat between our years.",
    cues: [
      { at: "Opening", text: "Listen to how small the room sounds before the low end arrives." },
      { at: "The chant", text: "Mongolian throat singing underneath the 808s. Older than the machine it sits on." },
      { at: "Part four", text: "The track is built in five sections. The fourth is the one that stops asking politely." },
    ],
    craft: "Phonk at 144 BPM with Mongolian throat singing, very low bass, Memphis 808 cowbells, distorted 808 slides, lo-fi snare, and a build in five parts.",
    art: {
      src: art("beat-between-our-years"), thumbnail: thumb("beat-between-our-years"),
      alt: "A dark living room with an empty sofa, lit from a doorway in warm light.",
      caption: "The room you are trying to get out of, photographed from inside it. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "The rebuild has to keep the throat singing and the machines in the same room without either one winning.",
      instruments: [
        { name: "Throat singing", role: "Mongolian overtone singing under the low end. Older than the machines it sits on." },
        { name: "808 sub bass", role: "Very low and distorted, sliding between notes instead of stepping." },
        { name: "Memphis cowbell", role: "The 808 cowbell that gives the track its phonk accent." },
        { name: "Lo-fi snare", role: "Dry and small, so the room stays closed in." },
      ],
    },
    pulse: pulse("beat-between-our-years"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "that-spark": {
    world: "neon",
    eyebrow: "NEON: The Signal Between",
    place: "The quietest statement on the record, and maybe the clearest.",
    heading: "A hand on the chest, and a drum in the dark",
    paragraphs: [
      "This is the simplest song in the set. Where the Pressure family sings about the weight, this one turns inward and checks whether anything is still beating.",
      "I feel my own beat is the whole album in four words. The bridge does not reach for a metaphor: if I break, I still move, if I fall, I still ring, I can hear myself now, that's the whole thing.",
      "It is not a victory song. Nothing is fixed at the end of it. It is the smaller, truer claim that you can hear yourself again, and that this is enough to keep moving.",
    ],
    pullQuote: "I can hear myself now, that's the whole thing.",
    cues: [
      { at: "Opening", text: "One pulse, almost dry. The song starts at the level of a heartbeat." },
      { at: "The bridge", text: "Four short clauses, no image. The plainest writing on the record." },
      { at: "Last chorus", text: "Nothing is added. The repetition is the point, not a build." },
    ],
    craft: "House, from a style brief of exactly one word.",
    art: {
      src: art("that-spark"), thumbnail: thumb("that-spark"),
      alt: "A hand laid flat on a chest in dark green light, with a faint violet glow under the fingers.",
      caption: "Checking for your own beat with your own hand. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "The brief for this track was one word, house. The rebuild keeps it that plain.",
      instruments: [],
    },
    pulse: pulse("that-spark"),
    albumSlug: "neon-the-signal-between",
    credits: WRITTEN_BY_HANS,
  },

  "loop-in-control": {
    world: "neon",
    eyebrow: "NEON world, outside the album sequence",
    place: "Not on the tracklist. It is the album's central idea, examined on its own.",
    heading: "A loop is only a cage if nothing inside it moves",
    paragraphs: [
      "NEON is built as one night that keeps starting again. This recording takes that idea out of the story and holds it up by itself: the same phrase returns, and each pass leaves room for something that was not there before.",
      "The title carries both halves. There is the loop, and there is the hand on it. Neither one wins, which is why the track can end without resolving anything.",
      "It stays outside the sequence on purpose. Some ideas work better as a study than as a chapter.",
    ],
    pullQuote: "One pass returns. Not the same one.",
    cues: [
      { at: "First pass", text: "Learn the phrase. It will not be stated this plainly again." },
      { at: "Middle", text: "One element is added and one is quietly removed every time around." },
      { at: "The end", text: "It stops rather than resolves. The loop could simply continue." },
    ],
    craft: "An instrumental loop study, mastered at 192 kHz in the NEON chain in October 2026.",
    art: {
      src: art("loop-in-control"), thumbnail: thumb("loop-in-control"),
      alt: "Dark plate with a ring of fine ticks closing on itself, one violet point of light at the seam.",
      caption: "A ring of marks meeting its own beginning, with one lit point at the seam.",
    },
    studio: {
      status: "planned",
      note: "A loop study is the natural first rebuild: one phrase, then everything that happens to it.",
      instruments: [],
    },
    pulse: pulse("loop-in-control"),
  },

  "78-thz-texture": {
    world: "outside",
    eyebrow: "Outside the album story",
    place: "An instrumental study with no place in the NEON narrative, and that is deliberate.",
    heading: "Texture before melody",
    paragraphs: [
      "This one has no story to carry. It is an instrumental piece about surface: what a sound is made of before it becomes a tune.",
      "The cover studies were named Folded resonance, Suspended texture and Dark water resonance, and those three words describe the music better than any lyric could.",
      "The frequency in the title is a working image, not a measurement and not a health claim. It is there because it sounds like what the track feels like.",
    ],
    pullQuote: "A sound, examined before it becomes a song.",
    cues: [
      { at: "Opening", text: "No downbeat announces itself. The texture arrives before the rhythm." },
      { at: "Middle", text: "Mid and side move apart. Width is doing the work a melody usually does." },
      { at: "End", text: "The piece thins out rather than closing. Listen to what is left." },
    ],
    craft: "An instrumental electronic texture study, restored and kept at 96 kHz.",
    art: {
      src: art("78-thz-texture"), thumbnail: thumb("78-thz-texture"),
      alt: "A translucent amber droplet shape in the dark with a thin violet thread running through it.",
      caption: "Folded resonance: the release candidate cover for this study.",
    },
    studio: {
      status: "planned",
      note: "Here the rebuild is about the surface itself, so the sound design matters more than the arrangement.",
      instruments: [],
    },
    pulse: pulse("78-thz-texture"),
  },

  "with-a-grin": {
    world: "neon",
    eyebrow: "NEON world, shared as a stem mix",
    place: "A working version, kept public with its seams visible.",
    heading: "The smile that is holding something back",
    paragraphs: [
      "The three cover studies for this track were called The smile held in shadow, Beautiful imperfection, and The old rhythm remains. Taken together they are the song: a grin doing work that the face underneath it is not ready to do.",
      "It is shared as a stem mix rather than a finished master. The separation is still audible, the balance is not final, and that is the honest version of where the track is.",
      "What stays is the rhythm. Whatever the grin is covering, the body has already decided to keep moving.",
    ],
    pullQuote: "The old rhythm remains.",
    cues: [
      { at: "Throughout", text: "Hear the stems sitting next to each other rather than fused. That is the stage it is in." },
      { at: "Middle", text: "The groove holds steady while everything above it keeps changing its mind." },
      { at: "Outro", text: "It walks off rather than ending. The grin is the last thing to go." },
    ],
    craft: "A stem mix, kept public as a working version rather than an album master.",
    art: {
      src: art("with-a-grin"), thumbnail: thumb("with-a-grin"),
      alt: "A figure walking away across a dark polished floor in a near empty room, lit by a single warm lamp.",
      caption: "The old rhythm remains: walking it off on an empty floor. Plate from the NEON artwork archive.",
    },
    studio: {
      status: "planned",
      note: "This one exists as a stem mix, so the rebuild starts from parts that are already separate.",
      instruments: [],
    },
    pulse: pulse("with-a-grin"),
    credits: WRITTEN_BY_HANS,
  },
};

export function getSongNarrative(slug: string | undefined): SongNarrative | undefined {
  return slug ? songNarrative[slug] : undefined;
}
