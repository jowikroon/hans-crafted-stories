import type { Song } from "./music";

const SITE_ORIGIN = "https://hansvanleeuwen.com";

/** Editorial date for the shared studio template, separate from release dates. */
export const SONG_PAGE_UPDATED = "2026-11-04";

/** The client and static renderer use the same song metadata. */
export function songPageHead(song: Song) {
  return {
    title: `${song.title}: Song & Notes | Hans van Leeuwen`,
    description: song.slug === "hanging-on"
      ? "Hanging On by Jowikroon. Listen to the recording and follow the source comparison, peak space and frequency balance behind its next production step."
      : `${song.title} by Jowikroon. ${song.provider === "spotify" ? "Official single" : "Public recording"} (${song.duration}). Listen and explore the story and studio process.`,
    canonical: `${SITE_ORIGIN}/music/${song.slug}`,
    image: song.cover,
    ogImageAlt: `Cover artwork for ${song.title} by Jowikroon`,
  };
}

/** Music-specific structured data, shared by prerender and hydration. */
export function songPageJsonLd(song: Song) {
  const head = songPageHead(song);
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
        sameAs: song.listenUrl,
        image: song.cover,
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
