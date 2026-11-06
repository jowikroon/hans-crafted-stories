import { songs } from "./music";

/** Public announcements only. Unreleased titles and guides are NEVER bundled. */
export interface MusicAlbumData {
  slug: string;
  title: string;
  subtitle: string;
  theme: "neon" | "warm";
  cover: string;
  backCover: string;
  description: string;
  trackCount: number;
  releaseYear: number;
  publicTracks: Array<{ position: number; songSlug: string }>;
}

export const albums: MusicAlbumData[] = [
  {
    slug: "neon-the-signal-between", title: "NEON", subtitle: "The Signal Between",
    theme: "neon", cover: "/images/albums/neon-front.webp", backCover: "/images/albums/neon-back.webp",
    description: "Van afstand naar connectie. Ontdek NEON: The Signal Between van Jowikroon en luister naar Beat Drop en Neon House of Glass. Album in ontwikkeling voor 2027.",
    trackCount: 9, releaseYear: 2027,
    publicTracks: [{ position: 2, songSlug: "beat-drop" }, { position: 4, songSlug: "neon-house-of-glass" }],
  },
  {
    slug: "iets-moois", title: "IETS MOOIS", subtitle: "",
    theme: "warm", cover: "/images/albums/iets-moois-front.webp", backCover: "/images/albums/iets-moois-back.webp",
    description: "IETS MOOIS, het tweede album van Jowikroon. Twaalf geplande nummers, waarvan de eerste vier als voorproefje hier te beluisteren zijn. Nederlandse woorden voor gemis, spijt, liefde en de belofte iets moois te maken.",
    trackCount: 12, releaseYear: 2027, publicTracks: [],
  },
];

export const albumPath = (slug: string) => `/music/albums/${slug}`;
export const getAlbum = (slug: string | undefined) => albums.find((album) => album.slug === slug);
/** Publicly disclosed song-to-album association; never infer it from playlist order. */
export const publicAlbumForSong = (songSlug: string) => albums.find((album) => album.publicTracks.some((track) => track.songSlug === songSlug));
export const albumTitle = (album: MusicAlbumData) => album.subtitle ? `${album.title}: ${album.subtitle}` : album.title;
export const albumSeoTitle = (album: MusicAlbumData) => `${albumTitle(album)} | Jowikroon`;
export const musicAlbumsTitle = "NEON & IETS MOOIS: Jowikroon | Hans van Leeuwen";
export const musicAlbumsDescription = "Ontdek de albums NEON: The Signal Between en IETS MOOIS van Jowikroon. Luister naar Beat Drop en Neon House of Glass. Meer muziek in 2027.";

export function albumJsonLd(album: MusicAlbumData) {
  const url = `https://hansvanleeuwen.com${albumPath(album.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    "@id": `${url}#album`, name: albumTitle(album), url,
    description: album.description,
    image: `https://hansvanleeuwen.com${album.cover}`,
    byArtist: { "@type": "MusicGroup", name: "Jowikroon", "@id": "https://hansvanleeuwen.com/music#artist" },
    // The development slot count is not a confirmed final released track count.
    track: album.publicTracks.flatMap(({ songSlug }) => {
      const song = songs.find((item) => item.slug === songSlug);
      return song ? [{ "@type": "MusicRecording", "@id": `https://hansvanleeuwen.com/music/${song.slug}#recording`, name: song.title, url: `https://hansvanleeuwen.com/music/${song.slug}`, sameAs: song.links?.spotify ?? song.listenUrl }] : [];
    }),
  };
}
