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
      "Daaronder liggen vijf woorden die ik ooit meekreeg. De verwondering van vroeger krijgt een plek in de muziek, in beweging en in het contact met anderen.",
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
    companion: "In IETS MOOIS krijgen diezelfde vragen Nederlandse woorden. Dichter bij de stem, met een eigen wereld van diep groen en warmte.",
  },
  "iets-moois": {
    intro: "Vijf woorden die ik meekreeg. In mijn eigen taal zoek ik naar wat ik voel, wat ik wil doorgeven en wat ik zelf kan maken.",
    signature: ["Maak er iets moois van.", "Ik ben ermee bezig."],
    essence: "Wat iemand achterlaat, kan verder leven in wat je maakt. Deze liedjes zijn mijn manier om iets terug te geven.",
    heading: "Niet als antwoord. Maar als spoor.",
    lead: "Van vijf laatste woorden via wat al langer binnenin zat, naar wat vandaag weer ruimte krijgt. IETS MOOIS geeft daar Nederlandse woorden aan.",
    paragraphs: [
      "Mijn opa gaf me vijf laatste woorden mee: maak er iets moois van. Vooral het woord maak bleef. Niet omdat ik alles kan bepalen, maar omdat ik zelf iets kan doen met wat er is.",
      "Het verdriet om hem opende ook gevoelens die er al langer waren. Niet alles hoeft tegelijk naar buiten. Ik zoek een tempo waarin ik niet verberg wat ik voel, en mezelf ook niet overspoel.",
      "In mijn eigen taal kom ik dichter bij wat ik bedoel. Soms met een gewone zin. Soms met een lach. Sommige nummers zijn woorden aan één persoon, zonder diegene voor iedereen aan te wijzen.",
      "Het verhaal komt terug bij vandaag. Naar mezelf luisteren. De kleinste dingen opmerken. Iets teruggeven. Ik ben nog bezig, en dat is precies wat ik wil vertellen.",
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
    companion: "NEON volgt het signaal door de nacht. Een andere wereld, verbonden door wat weer aangaat, kamer voor kamer.",
    trail: [
      { label: "De zekerheid", word: "toen.", title: "Ooit was weten genoeg.", text: "Er was een tijd waarin de wereld nog vanzelf leek te kloppen. Iemand wist het antwoord. Een hand was genoeg om verder te durven.", detail: "Wat van toen reist er nog met je mee?" },
      { label: "De stilte", word: "stilte.", title: "Wat weg is, klinkt soms door.", text: "Een lege plek kan veel aanwezig maken. Ik zoek woorden voor gemis, voor spijt en voor wat je achteraf nog had willen zeggen.", detail: "Sommige zinnen blijven, ook zonder antwoord." },
      { label: "De tegenstem", word: "twijfel.", title: "Ook twijfel heeft een stem.", text: "Soms klinkt er spot. Soms een vraag aan de hemel. Liefde en boosheid kunnen in dezelfde zin wonen. Ik laat die tegenspraak bestaan.", detail: "Er mag ook gelachen worden." },
      { label: "Wat blijft", word: "hier.", title: "Er brandt nog licht.", text: "Het verhaal komt terug bij vandaag. Bij iemand toelaten, de kleinste dingen opmerken en iets teruggeven. Ik zoek een eigen tempo om er iets moois van te maken.", detail: "Ik ben ermee bezig." },
    ],
    listeningNote: "Ik denk aan een kamer na sluitingstijd. Een stem dichtbij, ruimte tussen de woorden. Hier mag iets even blijven hangen. Ook de stilte.",
  },
};

export const albumBrandPath = (slug: string) => `${albumPath(slug)}/brand`;
export const albumBrandTitle = (album: MusicAlbumData) => `${album.title}: het verhaal en de beelden | Jowikroon`;
export const albumBrandDescription = (album: MusicAlbumData) => album.slug === "iets-moois"
  ? "Maak er iets moois van. Ontdek het visuele albumverhaal van Jowikroon, van de laatste woorden van zijn opa tot de verborgen verbinding met NEON."
  : `De wereld van ${albumTitle(album)} van Jowikroon. Ontdek het verhaal, de beelden en het kleine signaal dat de albums verbindt. Met ruimte voor wat jij erin hoort.`;
export function albumBrandJsonLd(album: MusicAlbumData) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: albumBrandTitle(album), description: albumBrandDescription(album), url: `https://hansvanleeuwen.com${albumBrandPath(album.slug)}`, inLanguage: "nl", about: { "@type": "MusicAlbum", "@id": `https://hansvanleeuwen.com${albumPath(album.slug)}#album`, name: albumTitle(album) } };
}
