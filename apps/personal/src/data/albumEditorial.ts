import { albumPath, albumTitle, type MusicAlbumData } from "./albums";

/** Fan-facing interpretation of the supplied brandbooks. Private guides stay private. */
export interface AlbumEditorial {
  intro: string;
  signature: string[];
  essence: string;
  heading: string;
  lead: string;
  paragraphs: string[];
  imageCaption: string;
  imageAlt: string;
  frontImageAlt: string;
  worldHeading: string;
  feelings: Array<{ label: string; title: string; text: string; image: "front" | "back" }>;
  journey: Array<{ title: string; text: string }>;
  closing: string;
  companion: string;
}

export const albumEditorial: Record<string, AlbumEditorial> = {
  "neon-the-signal-between": {
    intro: "Tussen wie ik was en wat ik nu maak, loopt een signaal. Door de nacht, de druk en de beweging. Terug naar elkaar.",
    signature: ["Look what music", "made of me."],
    essence: "De verwondering van toen is nooit helemaal weggegaan. Ik volg haar nog steeds.",
    heading: "De nacht heeft een binnenkant.",
    lead: "Een hand reikt verder. Een licht blijft even hangen. NEON volgt de afstand tussen gezien willen worden en leren luisteren.",
    paragraphs: [
      "Ik wil naar buiten met wat ik maak. Iets laten horen. Tegelijk kan er afstand ontstaan tussen het beeld dat je neerzet en hoe je je vanbinnen voelt. Die spanning beweegt door dit album.",
      "Daaronder ligt een belofte: iets moois maken van mijn leven. De verwondering van vroeger krijgt een plek in de muziek, in beweging en in het contact met anderen.",
      "The Signal Between gaat over wat er tussen ons kan ontstaan als we luisteren. Een kleine verbinding. Het verhaal laat ruimte voor wat jij erin hoort.",
    ],
    imageCaption: "Een beetje licht is genoeg om iets te laten beginnen.",
    imageAlt: "Jowikroon in de schaduw, met een klein violet licht bij zijn hand",
    frontImageAlt: "Een jongere en een oudere hand reiken naar elkaar, met een violet signaal ertussen",
    worldHeading: "Licht krijgt ruimte in het donker.",
    feelings: [
      { label: "De schaduw", title: "Er blijft iets ongezegd.", text: "Een contour, een hand, een klein beetje licht. De schaduw laat ruimte voor de persoon achter het beeld. De rest mag je in de muziek vinden.", image: "back" },
      { label: "De handen", title: "Dezelfde mens. Jaren ertussen.", text: "Een jongere en een oudere hand reiken naar elkaar. Het zijn twee leeftijden van mij. Wat ik meedraag, beweegt met me mee.", image: "front" },
      { label: "Het signaal", title: "Even is de afstand kleiner.", text: "Violet verschijnt op de plek waar iets samenkomt. Een kort moment van contact, dat ook na het donker kan blijven hangen.", image: "front" },
    ],
    journey: [
      { title: "Verwondering", text: "Het verlangen om iets te laten horen. De eerste beweging naar buiten." },
      { title: "Onder de glans", text: "Beeld, druk en de ruimte tussen hoe je overkomt en hoe je je voelt." },
      { title: "Terug naar elkaar", text: "De aandacht verschuift. Er ontstaat ruimte om te luisteren en samen verder te bewegen." },
    ],
    closing: "Some of me stays in the shadows. The rest is in the songs.",
    companion: "In IETS MOOIS krijgt dezelfde belofte Nederlandse woorden. Dichter bij de stem, met een eigen wereld van diep groen en warmte.",
  },
  "iets-moois": {
    intro: "In mijn eigen taal zoek ik woorden voor wat ik met me meedraag. Gemis, spijt, liefde. En de ruimte om verder te gaan.",
    signature: ["Ik beloofde iets moois te maken.", "Van mijn leven."],
    essence: "Ik wil kunnen zeggen wat ik voel. Ook als ik daar nog geen antwoord op heb.",
    heading: "Sommige woorden komen dichterbij.",
    lead: "Een kamer. Een hand. Een zin die blijft. IETS MOOIS zoekt naar wat je meeneemt, ook als je verdergaat.",
    paragraphs: [
      "Deze plaat begint bij een belofte: iets moois maken van mijn leven. Een zin die ik meeneem in wat ik maak en in de keuzes van alledag.",
      "In het Nederlands kom ik soms iets dichter bij wat ik bedoel. Gemis en liefde, spijt en blijven mogen naast elkaar bestaan. Een lied hoeft niet alles op te lossen.",
      "Ik probeer te begrijpen wat ik voel en wie ik nu ben. Deze liedjes horen bij dat zoeken. Wat je erin hoort, mag van jou zijn.",
    ],
    imageCaption: "Even stilstaan bij wat je met je meedraagt.",
    imageAlt: "Jowikroon kijkt naar zijn bril in zijn hand, tegen een diep groene achtergrond",
    frontImageAlt: "Jowikroon kijkt recht in de camera, zijn bril in de hand, met diep groen en bordeaux",
    worldHeading: "Dichtbij. Met ruimte ertussen.",
    feelings: [
      { label: "De blik", title: "Aanwezig, zoals je bent.", text: "Een open blik, de bril in de hand. Je hoeft niet ieder antwoord te kennen om iemand dichtbij te laten komen.", image: "front" },
      { label: "De kleur", title: "Een plek om even te blijven.", text: "Diep groen, bordeaux en natuurlijk licht. De warmte van een gewone ruimte waarin ook stilte mag bestaan.", image: "back" },
      { label: "Het signaal", title: "Een kleine lijn tussen toen en nu.", text: "Violet keert terug als iets vertrouwds. Wat ik meedraag, krijgt hier woorden in mijn eigen taal.", image: "back" },
    ],
    journey: [
      { title: "Afstand", text: "Soms beweeg je al, terwijl de woorden nog ontbreken. Er zit iets achter de glimlach." },
      { title: "Herinnering", text: "Een gewone plek of een kleine handeling kan ineens veel dichterbij komen." },
      { title: "Blijven", text: "Iemand toelaten. Terugkomen. Iets teruggeven in de keuzes van vandaag." },
    ],
    closing: "Wat je erin hoort, mag van jou zijn.",
    companion: "NEON volgt het signaal door de nacht. Een andere wereld, met dezelfde verwondering en dezelfde belofte eronder.",
  },
};

export const albumBrandPath = (slug: string) => `${albumPath(slug)}/brand`;
export const albumBrandTitle = (album: MusicAlbumData) => `${album.title}: het verhaal en de beelden | Jowikroon`;
export const albumBrandDescription = (album: MusicAlbumData) => `De wereld van ${albumTitle(album)} van Jowikroon. Ontdek het verhaal, de beelden en het kleine signaal dat de albums verbindt. Met ruimte voor wat jij erin hoort.`;
export function albumBrandJsonLd(album: MusicAlbumData) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, inLanguage: "nl", about: { "@type": "MusicAlbum", "@id": `https://hansvanleeuwen.com${albumPath(album.slug)}#album`, name: albumTitle(album) } };
}
