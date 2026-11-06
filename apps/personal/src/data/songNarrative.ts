/**
 * Public editorial interpretation for the nine existing Jowikroon song routes.
 *
 * I / You / It is a poetic point of view, not verified autobiography or a
 * transcription. Listening prompts invite attention; they are not DAW, stem,
 * instrument, tempo or mastering measurements. Those version-specific facts
 * belong to the independently sourced songProduction.ts records.
 *
 * Four triptychs below preserve the words already published on main by #507.
 * The five remaining triptychs adapt #493. The longer context and art direction
 * are carefully edited from #495, without its unsupported production claims.
 */

export interface SongNarrative {
  eyebrow: string;
  heading: string;
  emotion: string;
  subline: string;
  triptych: { i: string; you: string; it: string };
  paragraphs: [string, string];
  /** Interpretive, not verified listening or production observations. */
  listening: [string, string, string];
  art: { src: string; thumbnail: string; pulse: string; alt: string };
  /** Distinguishes a public single from an independent recording, not an LP slot. */
  world: "neon" | "standalone";
}

const art = (slug: string, alt: string) => ({
  src: `/images/music/songs/${slug}.webp`,
  thumbnail: `/images/music/songs/${slug}-320.webp`,
  pulse: `/images/music/songs/${slug}-pulse.webp`,
  alt,
});

export const songNarrative: Record<string, SongNarrative> = {
  "neon-house-of-glass": {
    eyebrow: "The NEON world",
    heading: "The distance behind the glow",
    emotion: "Being seen without feeling close",
    subline: "Everyone can see. Nobody knows.",
    triptych: {
      i: "I can see a thousand hearts. The room is still quiet.",
      you: "You are right there on the screen, and somehow out of reach.",
      it: "A house made of glass holds the light, but cannot bring us closer on its own.",
    },
    paragraphs: [
      "This story makes a crowd feel enormous and the distance to one person feel even bigger. The light is everywhere. The closeness it promises is harder to find.",
      "The question is left with the listener: when does being visible become being understood? The song does not solve that distance. It makes space to recognise it.",
    ],
    listening: [
      "Follow the contrast between the images of a crowd and the feeling of one quiet room.",
      "Notice how the question of connection survives each return to the chorus.",
      "Ask which person, rather than which screen, the ending makes you think of.",
    ],
    art: art("neon-house-of-glass", "Dark Jowikroon story plate with an outlined house and a small violet light."),
    world: "neon",
  },
  "beat-drop": {
    eyebrow: "The NEON world",
    heading: "Before the city moves",
    emotion: "The instant a private rhythm becomes shared",
    subline: "One second. Everyone together.",
    triptych: {
      i: "I wore one song out alone.",
      you: "You fall into a city moving as one.",
      it: "It arrives exactly when the count says.",
    },
    paragraphs: [
      "A beginning rarely announces how important it will become. Here it arrives as a clock, a flicker, a moment of anticipation and two words big enough to bring people together.",
      "There is room for the thrill of a dancefloor, but also for the smaller feeling beneath it: the decision to step forward when the next beat arrives.",
    ],
    listening: [
      "Listen for the images of time and movement in the opening words.",
      "Notice the moment anticipation turns into the directness of the title phrase.",
      "Think about whether the song feels more like an arrival or a departure.",
    ],
    art: art("beat-drop", "Dark Jowikroon story plate with a violet spark and a measured field of amber dots."),
    world: "neon",
  },
  "beat-drop-original": {
    eyebrow: "Another public version",
    heading: "The same turning point, another doorway",
    emotion: "Returning to a familiar beginning",
    subline: "Same pulse. Another way in.",
    triptych: {
      i: "I return to the same turning point.",
      you: "You enter a familiar rush by another door.",
      it: "It makes a familiar beginning feel undecided again.",
    },
    paragraphs: [
      "A song can have more than one public life. The Spotify single arrived in May 2026, and this SoundCloud version was uploaded in September. Those dates describe publication, not when either mix was recorded.",
      "Putting two versions side by side changes the listener as much as the listening. You remember what you expected the first time, then discover another way into the same idea.",
    ],
    listening: [
      "Start by listening to this version on its own, without ranking it against the single.",
      "Return to the title phrase and notice which detail catches your attention now.",
      "If you compare the public versions, treat audible differences as your own observations, not documented master measurements.",
    ],
    art: art("beat-drop-original", "Dark typographic Beat Drop study with thin lines growing into an amber bar."),
    world: "standalone",
  },
  "hanging-on": {
    eyebrow: "A recording in the NEON world",
    heading: "The space before letting go",
    emotion: "The cost of holding on",
    subline: "Not yet. Almost.",
    triptych: {
      i: "I say I cannot keep hanging on.",
      you: "You hear the words return before the decision can settle.",
      it: "The repetition holds the feeling a little longer than the sentence.",
    },
    paragraphs: [
      "Sometimes a sentence knows something before the person saying it does. The title becomes a thought you can return to, even when you are trying to leave it behind.",
      "There is no need to decide who or what the song is about. Its emotional space is familiar enough: the pause between knowing that something must change and finding the strength to move.",
    ],
    listening: [
      "Pay attention to how your reaction to the returning words changes over time.",
      "Notice which moments feel like waiting, and which feel like movement.",
      "Let the final repetition answer a different question than the first.",
    ],
    art: art("hanging-on", "A coat hanging beside a dark doorway edged by warm light."),
    world: "neon",
  },
  "beat-between-our-years": {
    eyebrow: "A public Jowikroon recording",
    heading: "What time cannot take away",
    emotion: "Connection across time",
    subline: "Years apart. Still in time.",
    triptych: {
      i: "I kept what time couldn't carry with me.",
      you: "You find a familiar feeling across the years.",
      it: "It lets time pass without breaking the connection.",
    },
    paragraphs: [
      "The title places two measures beside each other: the years that separate people and the beat that gives them something in common. Neither has to cancel the other.",
      "It can be heard as a story about distance, memory or the strange way a shared rhythm survives change. Its meaning stays with the listener, not a presumed biography.",
    ],
    listening: [
      "Hold the two meanings of 'between' in mind: separation and a place to meet.",
      "Notice whether the title feels more like looking back or stepping forward.",
      "Listen again with someone else in mind, and see whether the story changes.",
    ],
    art: art("beat-between-our-years", "An empty sofa in a dark room with warm light from an open doorway."),
    world: "standalone",
  },
  "that-spark": {
    eyebrow: "A recording in the NEON world",
    heading: "The smallest light",
    emotion: "The fragile return of possibility",
    subline: "The first yes is quiet.",
    triptych: {
      i: "I notice a flicker before I know what it means.",
      you: "You might see a signal where someone else sees a shadow.",
      it: "The light is small. The next step is still open.",
    },
    paragraphs: [
      "Not every turning point feels like a breakthrough. Sometimes it is only the smallest sign that you are still paying attention to what matters.",
      "The story does not insist that everything is suddenly right. It stays with the modest possibility of a next step, and lets that be enough for now.",
    ],
    listening: [
      "Think of the title as a very small beginning rather than a grand declaration.",
      "Notice the space between an uncertain feeling and the wish to name it.",
      "Ask what kind of signal you would recognise in an ordinary day.",
    ],
    art: art("that-spark", "A hand resting against a chest in shadow, with a faint violet glow."),
    world: "neon",
  },
  "loop-in-control": {
    eyebrow: "An independent study",
    heading: "A different way around",
    emotion: "Repetition becoming choice",
    subline: "Again. Not the same.",
    triptych: {
      i: "I mistook returning for standing still.",
      you: "You notice the change only when the same moment comes back.",
      it: "It circles until repetition becomes a choice.",
    },
    paragraphs: [
      "The loop is familiar, but a familiar shape need not hold the same meaning forever. Each return is another chance to notice what has shifted around it.",
      "That makes control less like an iron grip and more like the freedom to decide what happens the next time a moment comes around.",
    ],
    listening: [
      "Choose one detail to follow, then notice whether your attention moves elsewhere.",
      "Listen to the return of a familiar idea without expecting it to resolve.",
      "Ask what changes when you, rather than the loop, change perspective.",
    ],
    art: art("loop-in-control", "A ring of fine marks on a dark field with one violet point of light."),
    world: "standalone",
  },
  "78-thz-texture": {
    eyebrow: "An instrumental study",
    heading: "Texture before explanation",
    emotion: "Curiosity without an answer",
    subline: "A feeling without a label.",
    triptych: {
      i: "I listened for something I couldn't explain.",
      you: "You feel the shift before you find the words.",
      it: "It leaves room for a meaning you do not have to name.",
    },
    paragraphs: [
      "An instrumental piece can leave language at the door. Instead of telling a story with a lyric, this one invites a listener to pay attention to the surface of a feeling.",
      "The frequency in the title is a creative image, not a measurement or health claim. The point is not to identify a number, but to stay curious about a sound.",
    ],
    listening: [
      "Notice which quality you reach for first: movement, shape, colour or space.",
      "Try listening without deciding what the title ought to mean.",
      "See whether the piece leaves you with an image rather than a conclusion.",
    ],
    art: art("78-thz-texture", "A translucent amber shape in the dark with a thin violet thread."),
    world: "standalone",
  },
  "with-a-grin": {
    eyebrow: "A public working version",
    heading: "A smile with a second meaning",
    emotion: "Humour beside uncertainty",
    subline: "Not every smile explains itself.",
    triptych: {
      i: "I let a grin say what I couldn't.",
      you: "You wonder whether a smile means relief or disguise.",
      it: "It holds lightness and uncertainty in the same moment.",
    },
    paragraphs: [
      "A grin can be generous, nervous, defiant or all three. It offers the world a simple expression while leaving room for something more complicated underneath.",
      "The public upload is labelled a stem mix, a version name rather than proof that individual stems have been inspected. That openness suits the story: what you hear is part of a process, not a demand for a final answer.",
    ],
    listening: [
      "Begin with the expression in the title and imagine what it might conceal.",
      "Notice whether the mood feels lighter or more complicated on a second listen.",
      "Let the version label remind you that a work can remain open without being incomplete as an experience.",
    ],
    art: art("with-a-grin", "A solitary figure moving across a dark polished floor toward a warm lamp."),
    world: "standalone",
  },
};

export function getSongNarrative(slug: string | undefined): SongNarrative | undefined {
  return slug ? songNarrative[slug] : undefined;
}
