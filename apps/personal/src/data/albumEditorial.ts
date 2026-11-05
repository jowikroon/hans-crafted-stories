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
  trail?: Array<{ label: string; word: string; title: string; text: string; detail: string }>;
  listeningNote?: string;
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
    intro: "Van de zekerheid van toen naar wat vandaag blijft. In mijn eigen taal zoek ik woorden voor gemis, twijfel en liefde. En voor wat ik terug wil geven.",
    signature: ["Ik beloofde iets moois te maken.", "Van mijn leven."],
    essence: "Wat iemand achterlaat, kan verder leven in wat je maakt. Deze liedjes zijn mijn manier om iets terug te geven.",
    heading: "Niet als antwoord. Maar als spoor.",
    lead: "Van de zekerheid van een kind, door stilte en tegenspraak, naar wat blijft. IETS MOOIS geeft daar Nederlandse woorden aan. De betekenis mag open blijven.",
    paragraphs: [
      "Deze plaat begint bij een belofte: iets moois maken van mijn leven. Die zin neem ik mee in wat ik maak en in de keuzes van alledag. Muziek is een manier om iets terug te geven.",
      "Als kind kan de wereld nog vanzelf kloppen. Later komen de vragen. Gemis, spijt en schaamte krijgen een stem, naast de liefde en de lach die er ook nog zijn. Ik laat ze naast elkaar bestaan.",
      "In mijn eigen taal kom ik dichter bij wat ik bedoel. Soms met een gewone zin. Soms door iets even stil te laten. Een lied hoeft niet alles uit te leggen.",
      "Het verhaal komt terug bij vandaag. Iemand toelaten. De kleinste dingen opmerken. Blijven. Ik probeer te begrijpen wie ik nu ben en wat ik daarmee wil maken. Wat je erin hoort, mag van jou zijn.",
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
    trail: [
      { label: "De zekerheid", word: "toen.", title: "Ooit was weten genoeg.", text: "Er was een tijd waarin de wereld nog vanzelf leek te kloppen. Iemand wist het antwoord. Een hand was genoeg om verder te durven.", detail: "Wat van toen reist er nog met je mee?" },
      { label: "De stilte", word: "stilte.", title: "Wat weg is, klinkt soms door.", text: "Een lege plek kan veel aanwezig maken. Ik zoek woorden voor gemis, voor spijt en voor wat je achteraf nog had willen zeggen.", detail: "Sommige zinnen blijven, ook zonder antwoord." },
      { label: "De tegenstem", word: "twijfel.", title: "Ook twijfel heeft een stem.", text: "Soms klinkt er spot. Soms een vraag aan de hemel. Liefde en boosheid kunnen in dezelfde zin wonen. Ik laat die tegenspraak bestaan.", detail: "Er mag ook gelachen worden." },
      { label: "Wat blijft", word: "hier.", title: "Er brandt nog licht.", text: "Het verhaal komt terug bij vandaag. Bij iemand toelaten, de kleinste dingen opmerken en iets teruggeven. De belofte krijgt vorm in wat ik doe.", detail: "Iets moois maken. Van wat er nu is." },
    ],
    listeningNote: "Ik denk aan een kamer na sluitingstijd. Een stem dichtbij, ruimte tussen de woorden. Hier mag iets even blijven hangen. Ook de stilte.",
  },
};

export const albumBrandPath = (slug: string) => `${albumPath(slug)}/brand`;
export const albumBrandTitle = (album: MusicAlbumData) => `${album.title}: het verhaal en de beelden | Jowikroon`;
export const albumBrandDescription = (album: MusicAlbumData) => album.slug === "iets-moois"
  ? "Een belofte krijgt een stem in IETS MOOIS van Jowikroon. Volg het visuele verhaal van verwondering en gemis naar de keuzes van vandaag, in het Nederlands."
  : `De wereld van ${albumTitle(album)} van Jowikroon. Ontdek het verhaal, de beelden en het kleine signaal dat de albums verbindt. Met ruimte voor wat jij erin hoort.`;
export function albumBrandJsonLd(album: MusicAlbumData) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, inLanguage: "nl", about: { "@type": "MusicAlbum", "@id": `https://hansvanleeuwen.com${albumPath(album.slug)}#album`, name: albumTitle(album) } };
}
