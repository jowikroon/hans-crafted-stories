import type { Song } from "./music";
import { albumPath, albumTitle, publicAlbumForSong } from "./albums";

const SITE_ORIGIN = "https://hansvanleeuwen.com";

/** Editorial date for the shared studio template, separate from release dates. */
export const SONG_PAGE_UPDATED = "2026-11-06";

const neonStoryMeta: Record<string, { title: string; description: string }> = {
  "beat-drop": {
    title: "Beat Drop: The First Signal | Jowikroon · NEON",
    description: "Beat Drop by Jowikroon. A ticking clock, a cassette before dawn and a city moving as one. Listen to the official single and the first NEON signal.",
  },
  "neon-house-of-glass": {
    title: "Neon House of Glass: Behind the Glow | Jowikroon",
    description: "Neon House of Glass by Jowikroon. A thousand hearts on a screen, yet an empty room. Listen to the official single and explore the distance behind the glow.",
  },
  "hanging-on": {
    title: "Hanging On: A NEON Recording | Jowikroon",
    description: "Hanging On by Jowikroon. A NEON recording that returns to one difficult sentence. Listen to the tension between holding on and letting go.",
  },
  "that-spark": {
    title: "That Spark: A NEON Recording | Jowikroon",
    description: "That Spark by Jowikroon. A small violet glow, a first flicker and the possibility of movement. Listen to the public NEON SoundCloud recording.",
  },
  "beat-drop-original": {
    title: "Beat Drop (original): Another Public Version | Jowikroon",
    description: "Beat Drop (original) by Jowikroon. Explore the public SoundCloud version alongside the official single, without confusing upload dates with recording dates.",
  },
  "beat-between-our-years": {
    title: "Beat Between Our Years: Across Time | Jowikroon",
    description: "Beat Between Our Years by Jowikroon. A public SoundCloud recording about the space where years and shared feeling meet. Listen and explore its story.",
  },
  "loop-in-control": {
    title: "Loop in Control: Another Way Around | Jowikroon",
    description: "Loop in Control by Jowikroon. A public electronic recording that treats repetition as a place for change, with listening prompts and version-specific studio notes.",
  },
  "78-thz-texture": {
    title: "78 THz Texture: An Instrumental Study | Jowikroon",
    description: "78 THz Texture by Jowikroon. Explore an instrumental study of sound and feeling. The title is a creative image, not a measured frequency claim.",
  },
  "with-a-grin": {
    title: "With a Grin: A Public Working Version | Jowikroon",
    description: "With a Grin by Jowikroon. A public SoundCloud stem-mix-labelled recording, pairing humour with uncertainty. Hear the version and explore its story.",
  },
};

/** The client and static renderer use the same song metadata. */
export function songPageHead(song: Song) {
  const storyMeta = neonStoryMeta[song.slug];
  return {
    title: storyMeta?.title ?? `${song.title}: Song & Notes | Hans van Leeuwen`,
    description: storyMeta?.description ?? `${song.title} by Jowikroon. ${song.provider === "spotify" ? "Official single" : "Public recording"} (${song.duration}). Listen and explore the story and studio process.`,
    canonical: `${SITE_ORIGIN}/music/${song.slug}`,
    image: song.cover.startsWith("/") ? `${SITE_ORIGIN}${song.cover}` : song.cover,
    ogImageAlt: song.coverAlt ?? `Cover artwork for ${song.title} by Jowikroon`,
  };
}

/** Music-specific structured data, shared by prerender and hydration. */
export function songPageJsonLd(song: Song) {
  const head = songPageHead(song);
  const announcedAlbum = publicAlbumForSong(song.slug);
  const [minutes, seconds] = song.duration.split(":").map(Number);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${head.canonical}#webpage`,
        url: head.canonical,
        name: head.title,
        description: head.description,
        dateModified: SONG_PAGE_UPDATED,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        mainEntity: { "@id": `${head.canonical}#recording` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Music", item: `${SITE_ORIGIN}/music` },
          { "@type": "ListItem", position: 3, name: song.title, item: head.canonical },
        ],
      },
      {
        "@type": "MusicRecording",
        "@id": `${head.canonical}#recording`,
        name: song.title,
        url: head.canonical,
        genre: song.genre,
        duration: `PT${minutes}M${seconds}S`,
        datePublished: song.date,
        byArtist: { "@type": "MusicGroup", name: song.artist, "@id": `${SITE_ORIGIN}/music#artist` },
        sameAs: song.links?.spotify ?? song.listenUrl,
        image: head.image,
        ...(announcedAlbum ? { inAlbum: { "@type": "MusicAlbum", "@id": `${SITE_ORIGIN}${albumPath(announcedAlbum.slug)}#album`, name: albumTitle(announcedAlbum) } } : {}),
        recordingOf: {
          "@type": "MusicComposition",
          name: song.title,
          composer: { "@type": "Person", "@id": `${SITE_ORIGIN}/#person`, name: "Hans van Leeuwen" },
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_ORIGIN}/#website`,
        name: "Hans van Leeuwen",
        url: `${SITE_ORIGIN}/`,
        inLanguage: ["en", "nl"],
        publisher: { "@id": `${SITE_ORIGIN}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_ORIGIN}/#person`,
        name: "Hans van Leeuwen",
        alternateName: "Jowikroon",
        url: `${SITE_ORIGIN}/music`,
        description: "Hans van Leeuwen makes and releases music as Jowikroon.",
      },
    ],
  };
}
