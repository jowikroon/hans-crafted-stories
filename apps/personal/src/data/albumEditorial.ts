import { albumPath, albumTitle, type MusicAlbumData } from "./albums";

/** Public editorial interpretation, kept separate from full private brandguides. */
export interface AlbumEditorial {
  intro: string;
  essence: string;
  heading: string;
  lead: string;
  paragraphs: string[];
  imageCaption: string;
  feelings: Array<{ title: string; text: string }>;
  process: Array<{ title: string; text: string }>;
  closing: string;
}

export const albumEditorial: Record<string, AlbumEditorial> = {
  "neon-the-signal-between": {
    intro: "Ik wil gehoord worden. En mezelf blijven herkennen in wat ik maak. NEON volgt die zoektocht, door beeld en druk, terug naar contact.",
    essence: "Ik heb mijn opa beloofd iets moois van mijn leven te maken. Deze muziek hoort bij die belofte.",
    heading: "Er zit een mens achter het beeld.",
    lead: "Soms lukt bewegen eerder dan zeggen wat je voelt. Daar begint NEON voor mij.",
    paragraphs: [
      "Ik wil naar buiten met wat ik maak. Iets laten horen. Tegelijk kan er afstand ontstaan tussen het beeld dat je neerzet en hoe je je vanbinnen voelt. Die spanning neem ik mee in dit album.",
      "De belofte aan mijn opa blijft daaronder aanwezig: iets moois maken van mijn leven. Ik zoek naar een manier om die belofte mee te nemen in mijn keuzes, in de muziek en in het contact met anderen.",
      "The Signal Between gaat over wat er tussen ons kan ontstaan als we luisteren. Een kleine verbinding. Genoeg om dichterbij te komen."
    ],
    imageCaption: "De stilte achter de beweging. Het kleine licht blijft.",
    feelings: [
      { title: "Afstand", text: "De donkere ruimte laat voelen hoeveel er soms tussen mensen in kan zitten." },
      { title: "Herkenning", text: "De handen laten twee leeftijden van mij zien. Wat ik meedraag, beweegt met me mee." },
      { title: "Contact", text: "Een kleine paarse lichtverbinding brengt de handen bij elkaar. Daar zit de hoop van deze plaat." }
    ],
    process: [
      { title: "Naar buiten", text: "Ik begin bij de behoefte om gehoord te worden. De beat mag die beweging dragen, met ruimte voor wat er onder de energie zit." },
      { title: "Achter het beeld", text: "Ik zoek naar woorden voor de druk en de afstand. De stem moet herkenbaar blijven als de muziek groter wordt." },
      { title: "Samen verder", text: "Ik werk toe naar luisteren en verbinding. Een volgorde waarin elk nummer iets toevoegt aan de weg terug naar elkaar." }
    ],
    closing: "De belofte blijft. In wat ik maak, en in hoe ik verderga."
  },
  "iets-moois": {
    intro: "In mijn eigen taal zoek ik woorden voor wat ik met me meedraag. Gemis, spijt, liefde. En de belofte om iets moois van mijn leven te maken.",
    essence: "Ik wil kunnen zeggen wat ik voel. Ook als ik daar nog geen antwoord op heb.",
    heading: "Dichtbij begint bij iets durven zeggen.",
    lead: "Ik heb mijn opa beloofd iets moois van mijn leven te maken. Die belofte draag ik nog steeds met me mee.",
    paragraphs: [
      "IETS MOOIS gaat over de mensen die ik mis, over spijt en schaamte, over liefde en blijven. Ik probeer te begrijpen wat ik voel en wie ik nu ben.",
      "Ik zing in het Nederlands, mijn eigen taal. Daarin wil ik de woorden vinden die ik ook tegen iemand zou kunnen zeggen. Soms zoekend. Soms met meer vragen dan antwoorden.",
      "De belofte aan mijn opa klinkt daarin door. In wat ik maak, in de keuzes die ik maak, in de vraag hoe ik vandaag iets terug kan geven. Deze liedjes horen bij dat zoeken."
    ],
    imageCaption: "Even stilstaan. De blik naar binnen, de muziek dichtbij.",
    feelings: [
      { title: "Nabijheid", text: "Het portret mag dichtbij komen. Je ziet een mens, met ruimte voor wat nog moeilijk uit te spreken is." },
      { title: "Warmte", text: "Diep groen, warme huid en zacht licht geven het verhaal rust. Er mag iets kwetsbaars blijven staan." },
      { title: "Doorgaan", text: "De kleine paarse lijn verbindt deze wereld met NEON. Dezelfde belofte krijgt hier woorden in mijn eigen taal." }
    ],
    process: [
      { title: "Woorden zoeken", text: "Ik zoek naar taal voor gemis, schaamte en liefde. Een zin moet iets zeggen wat ik zelf ook kan dragen." },
      { title: "Dichtbij blijven", text: "De woorden bepalen wat een lied nodig heeft. Ik wil horen wat iemand voelt, met genoeg ruimte om het binnen te laten komen." },
      { title: "Een plek geven", text: "Ik bouw aan een volgorde van afstand naar herinnering en het heden. Wat ik meedraag, krijgt een plek in hoe ik verderga." }
    ],
    closing: "Ik ben nog aan het zoeken. En ik ben begonnen."
  }
};

export const albumBrandPath = (slug: string) => `${albumPath(slug)}/brand`;
export const albumBrandTitle = (album: MusicAlbumData) => `${album.title}: het verhaal en proces | Jowikroon`;
export const albumBrandDescription = (album: MusicAlbumData) => `Het verhaal achter ${albumTitle(album)} van Jowikroon. Over de belofte, de beelden en het maakproces: van een persoonlijk gevoel naar muziek die verbindt.`;
export function albumBrandJsonLd(album: MusicAlbumData) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, inLanguage: "nl", about: { "@type": "MusicAlbum", "@id": `https://hansvanleeuwen.com${albumPath(album.slug)}#album`, name: albumTitle(album) } };
}
