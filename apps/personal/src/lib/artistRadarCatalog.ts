/**
 * The verified *catalogue of selectable names* from the existing Artist Radar
 * Clean design. Inclusion is not evidence of a current show or ticket sale.
 * Current concert information must come from artist-radar-public-events.
 */
export interface RadarArtist {
  id: string;
  name: string;
  genre: string;
}

export const RADAR_ARTISTS: readonly RadarArtist[] = [
  { id: "fredagain", name: "Fred again..", genre: "Electronic" },
  { id: "50cent", name: "50 Cent", genre: "Hip-hop" },
  { id: "kendrick", name: "Kendrick Lamar", genre: "Hip-hop" },
  { id: "stromae", name: "Stromae", genre: "Pop" },
  { id: "angele", name: "Angèle", genre: "Pop" },
  { id: "cdw", name: "Charlotte de Witte", genre: "Techno" },
  { id: "amelie", name: "Amelie Lens", genre: "Techno" },
  { id: "froukje", name: "Froukje", genre: "Pop" },
  { id: "s10", name: "S10", genre: "Pop" },
  { id: "goldband", name: "Goldband", genre: "Pop" },
  { id: "antoon", name: "Antoon", genre: "Pop" },
  { id: "meau", name: "Meau", genre: "Pop" },
  { id: "chefspecial", name: "Chef'Special", genre: "Indie" },
  { id: "weeknd", name: "The Weeknd", genre: "R&B" },
  { id: "dualipa", name: "Dua Lipa", genre: "Pop" },
  { id: "tame", name: "Tame Impala", genre: "Indie" },
  { id: "bicep", name: "Bicep", genre: "Electronic" },
  { id: "overmono", name: "Overmono", genre: "Electronic" },
  { id: "arctic", name: "Arctic Monkeys", genre: "Rock" },
  { id: "sza", name: "SZA", genre: "R&B" },
  { id: "centralcee", name: "Central Cee", genre: "Hip-hop" },
  { id: "rosalia", name: "Rosalía", genre: "Pop" },
  { id: "badbunny", name: "Bad Bunny", genre: "Pop" },
  { id: "massive", name: "Massive Attack", genre: "Electronic" },
  { id: "eminem", name: "Eminem", genre: "Hip-hop" },
  { id: "drake", name: "Drake", genre: "Hip-hop" },
  { id: "billie", name: "Billie Eilish", genre: "Pop" },
  { id: "taylor", name: "Taylor Swift", genre: "Pop" },
  { id: "coldplay", name: "Coldplay", genre: "Rock" },
  { id: "beyonce", name: "Beyoncé", genre: "R&B" },
  { id: "adele", name: "Adele", genre: "Pop" },
  { id: "travis", name: "Travis Scott", genre: "Hip-hop" },
  { id: "harry", name: "Harry Styles", genre: "Pop" },
  { id: "postmalone", name: "Post Malone", genre: "Hip-hop" },
  { id: "dojacat", name: "Doja Cat", genre: "Pop" },
  { id: "tiesto", name: "Tiësto", genre: "Electronic" },
  { id: "garrix", name: "Martin Garrix", genre: "Electronic" },
  { id: "armin", name: "Armin van Buuren", genre: "Electronic" },
  { id: "lostfreq", name: "Lost Frequencies", genre: "Electronic" },
  { id: "snelle", name: "Snelle", genre: "Hip-hop" },
  { id: "suzanfreek", name: "Suzan & Freek", genre: "Pop" },
  { id: "ronnieflex", name: "Ronnie Flex", genre: "Hip-hop" },
  { id: "kensington", name: "Kensington", genre: "Rock" },
  { id: "direct", name: "DI-RECT", genre: "Rock" },
];

export function searchRadarArtists(query: string, artists: readonly RadarArtist[] = RADAR_ARTISTS, limit = 8): RadarArtist[] {
  const normalize = (input: string) => input.toLocaleLowerCase("nl-NL").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const needle = normalize(query);
  return artists.filter((artist) => !needle || normalize(artist.name).includes(needle) || normalize(artist.genre).includes(needle)).slice(0, limit);
}
