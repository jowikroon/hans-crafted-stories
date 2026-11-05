/**
 * songNarrativeMeta.ts, the small eager half of the song story layer.
 *
 * The full narrative (paragraphs, listening cues, craft) lives in
 * songNarrative.ts and is loaded with the lazy SongStory chunk, so its text
 * never ships in the JavaScript that every page of the site downloads.
 * Only the handful of fields the page shell and the SEO head need are kept
 * here. songNarrative.test.ts guards that the two stay in step.
 */

export interface SongNarrativeMeta {
  /** Story heading, reused in the meta description. */
  heading: string;
  /** Hero plate, also the social sharing image. */
  artSrc: string;
  artAlt: string;
  /** Optional credit row under the release table. */
  credits?: string;
}

export const songNarrativeMeta: Record<string, SongNarrativeMeta> = {
  "neon-house-of-glass": {
    heading: "A stadium chorus about being alone in one",
    artSrc: "/images/music/songs/neon-house-of-glass.webp",
    artAlt: "Dark plate with a thin outline of a house and one small violet point of light inside it.",
    credits: "Words by Hans van Leeuwen.",
  },
  "beat-drop": {
    heading: "A song that never tells you what it does not also let you hear",
    artSrc: "/images/music/songs/beat-drop.webp",
    artAlt: "Dark plate with a field of violet sparks above a grid of amber dots.",
    credits: "Words by Hans van Leeuwen.",
  },
  "beat-drop-original": {
    heading: "The version before it was a single",
    artSrc: "/images/music/songs/beat-drop-original.webp",
    artAlt: "Dark plate with a bar study running from thin bars on the left to a tall amber block on the right.",
    credits: "Words by Hans van Leeuwen.",
  },
  "hanging-on": {
    heading: "A relationship that will not stop, told by a line that will not stop",
    artSrc: "/images/music/songs/hanging-on.webp",
    artAlt: "A coat still hanging on a door in a dark room, lit by a thin amber line of light from the gap.",
    credits: "Words by Hans van Leeuwen.",
  },
  "beat-between-our-years": {
    heading: "An escape song where the house is the opponent",
    artSrc: "/images/music/songs/beat-between-our-years.webp",
    artAlt: "A dark living room with an empty sofa, lit from a doorway in warm light.",
    credits: "Words by Hans van Leeuwen.",
  },
  "that-spark": {
    heading: "A hand on the chest, and a drum in the dark",
    artSrc: "/images/music/songs/that-spark.webp",
    artAlt: "A hand laid flat on a chest in dark green light, with a faint violet glow under the fingers.",
    credits: "Words by Hans van Leeuwen.",
  },
  "loop-in-control": {
    heading: "A loop is only a cage if nothing inside it moves",
    artSrc: "/images/music/songs/loop-in-control.webp",
    artAlt: "Dark plate with a ring of fine ticks closing on itself, one violet point of light at the seam.",
  },
  "78-thz-texture": {
    heading: "Texture before melody",
    artSrc: "/images/music/songs/78-thz-texture.webp",
    artAlt: "A translucent amber droplet shape in the dark with a thin violet thread running through it.",
  },
  "with-a-grin": {
    heading: "The smile that is holding something back",
    artSrc: "/images/music/songs/with-a-grin.webp",
    artAlt: "A figure walking away across a dark polished floor in a near empty room, lit by a single warm lamp.",
    credits: "Words by Hans van Leeuwen.",
  },
};

export function getSongNarrativeMeta(slug: string | undefined): SongNarrativeMeta | undefined {
  return slug ? songNarrativeMeta[slug] : undefined;
}
