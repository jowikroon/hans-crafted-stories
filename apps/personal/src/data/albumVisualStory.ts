/** Supplied IETS MOOIS artwork studies, grouped for an optional visual story. */
export type AlbumVisualChapterId = "blik" | "toen-nu" | "speelruimte" | "volgorde";

export interface AlbumVisualChapter {
  id: AlbumVisualChapterId;
  title: string;
  intro: string;
  coverId: string;
}

export interface AlbumVisualStoryImage {
  id: string;
  src: string;
  thumbnail: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
  chapter: AlbumVisualChapterId;
  status?: "Beeldstudie" | "Volgordestudie";
}

export const albumVisualChapters: readonly AlbumVisualChapter[] = [
  { id: "blik", title: "De blik", intro: "Een open blik, warm licht en ruimte om even te blijven.", coverId: "een-open-blik" },
  { id: "toen-nu", title: "Toen en nu", intro: "Twee leeftijden vinden elkaar in een kleine spiegeling.", coverId: "toen-in-nu" },
  { id: "speelruimte", title: "Speelruimte", intro: "Naast de ernst mag ook iets onverwachts bestaan.", coverId: "een-beetje-te-veel" },
  { id: "volgorde", title: "De volgorde", intro: "Schetsen van de hoes, met voorgestelde trackvolgordes.", coverId: "volgordestudie-01" },
];

/** Preserve links from the earlier four-image story without changing their history entry. */
export const albumVisualStoryAliases = {
  "de-belofte": "iets-dichterbij",
  "de-beeldtaal": "de-bril-in-de-hand",
  "toen-en-nu": "vooruitkijken",
  "de-achterkant": "volgordestudie-02",
} as const;

export function resolveAlbumVisualStoryId(id: string | null): string | null {
  if (id === null) return null;
  return Object.prototype.hasOwnProperty.call(albumVisualStoryAliases, id)
    ? albumVisualStoryAliases[id as keyof typeof albumVisualStoryAliases]
    : id;
}

const asset = (id: string) => `/images/music/iets-moois-story/${id}.webp`;
const thumbnail = (id: string) => `/images/music/iets-moois-story/${id}-320.webp`;

export const albumVisualStory: readonly AlbumVisualStoryImage[] = [
  {
    id: "een-open-blik", src: asset("een-open-blik"), thumbnail: thumbnail("een-open-blik"), width: 1254, height: 1254,
    alt: "Jowikroon houdt een zonnebril met violet licht vast tegen een diepgroene achtergrond.",
    title: "Een open blik",
    caption: "Een open blik is het vertrekpunt. Diep groen en bordeaux geven de stem een rustige plek.",
    chapter: "blik", status: "Beeldstudie",
  },
  {
    id: "ruimte-om-te-blijven", src: asset("ruimte-om-te-blijven"), thumbnail: thumbnail("ruimte-om-te-blijven"), width: 1254, height: 1254,
    alt: "Jowikroon zit in een houten stoel, met een zonnebril op zijn schoot en veel groen om hem heen.",
    title: "Ruimte om te blijven",
    caption: "De stoel, de stof en de losse houding houden het beeld alledaags. Er hoeft even niets.",
    chapter: "blik", status: "Beeldstudie",
  },
  {
    id: "een-beetje-licht", src: asset("een-beetje-licht"), thumbnail: thumbnail("een-beetje-licht"), width: 1254, height: 1254,
    alt: "Portret van Jowikroon in een zwart shirt, met warm licht langs zijn gezicht en een donkere achtergrond.",
    title: "Een beetje licht",
    caption: "Warm licht raakt één kant van het gezicht. De schaduw laat iets open.",
    chapter: "blik", status: "Beeldstudie",
  },
  {
    id: "iets-dichterbij", src: asset("iets-dichterbij"), thumbnail: thumbnail("iets-dichterbij"), width: 1254, height: 1254,
    alt: "Jowikroon leunt naar voren met de zonnebril in zijn hand, tegen een groene achtergrond.",
    title: "Iets dichterbij",
    caption: "Een kleine beweging naar voren maakt de afstand kleiner. Het beeld zoekt contact zonder alles uit te leggen.",
    chapter: "blik", status: "Beeldstudie",
  },
  {
    id: "de-bril-in-de-hand", src: asset("de-bril-in-de-hand"), thumbnail: thumbnail("de-bril-in-de-hand"), width: 1254, height: 1254,
    alt: "Jowikroon kijkt recht vooruit en houdt zijn zonnebril horizontaal voor zijn borst.",
    title: "De bril in de hand",
    caption: "De bril zakt, de blik blijft. Het violet verschijnt alleen als klein spoor.",
    chapter: "blik", status: "Beeldstudie",
  },
  {
    id: "toen-in-nu", src: asset("toen-in-nu"), thumbnail: thumbnail("toen-in-nu"), width: 1254, height: 1254,
    alt: "Jowikroon kijkt over zijn zonnebril; in één glas verschijnt het gezicht van een kind.",
    title: "Toen in nu",
    caption: "In de bril verschijnt een jongere blik. Wat je meedraagt, blijft soms onverwacht dichtbij.",
    chapter: "toen-nu", status: "Beeldstudie",
  },
  {
    id: "nu-in-toen", src: asset("nu-in-toen"), thumbnail: thumbnail("nu-in-toen"), width: 1254, height: 1254,
    alt: "Een jongen in een groen jasje kijkt over zijn zonnebril, met een volwassen gezicht in de lens.",
    title: "Nu in toen",
    caption: "De spiegeling draait om: het kind kijkt terug, de volwassene reist mee. Twee leeftijden delen één beeld.",
    chapter: "toen-nu", status: "Beeldstudie",
  },
  {
    id: "wat-meereist", src: asset("wat-meereist"), thumbnail: thumbnail("wat-meereist"), width: 1254, height: 1254,
    alt: "Jowikroon draagt een zonnebril waarin een kind wordt weerspiegeld, met warm tegenlicht in zijn haar.",
    title: "Wat meereist",
    caption: "Eén lens bewaart een glimp van vroeger. Het warme licht houdt de twee tijden bij elkaar.",
    chapter: "toen-nu", status: "Beeldstudie",
  },
  {
    id: "vooruitkijken", src: asset("vooruitkijken"), thumbnail: thumbnail("vooruitkijken"), width: 1254, height: 1254,
    alt: "Een jongen in een grijze coltrui kijkt omhoog; zijn zonnebril weerspiegelt een volwassen portret.",
    title: "Vooruitkijken",
    caption: "Een kind kijkt voorbij de rand van het beeld. In het glas is de toekomst al even aanwezig.",
    chapter: "toen-nu", status: "Beeldstudie",
  },
  {
    id: "dezelfde-glimlach", src: asset("dezelfde-glimlach"), thumbnail: thumbnail("dezelfde-glimlach"), width: 1254, height: 1254,
    alt: "Een jongen in een bordeaux jasje tilt zijn zonnebril op, met een volwassen versie van hetzelfde gebaar in het glas.",
    title: "Dezelfde glimlach",
    caption: "Het gebaar keert terug, met jaren ertussen. Een kleine glimlach mag het verhaal openbreken.",
    chapter: "toen-nu", status: "Beeldstudie",
  },
  {
    id: "een-beetje-te-veel", src: asset("een-beetje-te-veel"), thumbnail: thumbnail("een-beetje-te-veel"), width: 1254, height: 1254,
    alt: "Jowikroon houdt een buitengewoon grote koffiekop vast, met een dun violet lijntje in het keramiek.",
    title: "Een beetje te veel",
    caption: "Een vertrouwde koffiekop krijgt een onmogelijke maat. Het kleine violette spoor blijft.",
    chapter: "speelruimte", status: "Beeldstudie",
  },
  {
    id: "een-lichte-tegenstem", src: asset("een-lichte-tegenstem"), thumbnail: thumbnail("een-lichte-tegenstem"), width: 1254, height: 1254,
    alt: "Jowikroon heeft een grote paarse veer op zijn bordeaux jasje en houdt een zonnebril vast.",
    title: "Een lichte tegenstem",
    caption: "Een paarse veer doorbreekt de rustige lijnen. Er mag iets onverwachts naast de ernst bestaan.",
    chapter: "speelruimte", status: "Beeldstudie",
  },
  {
    id: "volgordestudie-01", src: asset("volgordestudie-01"), thumbnail: thumbnail("volgordestudie-01"), width: 1254, height: 1254,
    alt: "Hoesstudie met vijf genummerde liedtitels naast Jowikroon, die naar zijn bril kijkt; gemarkeerd als voorgestelde volgorde.",
    title: "Volgordestudie · 01",
    caption: "Een schets van hoe de liedjes elkaar kunnen opvolgen. De afgebeelde volgorde is een voorstel.",
    chapter: "volgorde", status: "Volgordestudie",
  },
  {
    id: "volgordestudie-02", src: asset("volgordestudie-02"), thumbnail: thumbnail("volgordestudie-02"), width: 1254, height: 1254,
    alt: "Hoesstudie met zeven liedtitels zonder nummers, naast een hand met zonnebril; gemarkeerd als voorgestelde volgorde.",
    title: "Volgordestudie · 02",
    caption: "Meer titels krijgen ruimte naast een alledaags gebaar. Ook deze volgorde is een ontwerpstudie.",
    chapter: "volgorde", status: "Volgordestudie",
  },
  {
    id: "volgordestudie-03", src: asset("volgordestudie-03"), thumbnail: thumbnail("volgordestudie-03"), width: 1254, height: 1254,
    alt: "Hoesstudie met zes genummerde liedtitels, een hand en een zonnebril op schoot; gemarkeerd als voorgestelde volgorde.",
    title: "Volgordestudie · 03",
    caption: "Hand, bril en veel groen geven de titels adem. De afgebeelde tracklijst is nog een voorstel.",
    chapter: "volgorde", status: "Volgordestudie",
  },
];
