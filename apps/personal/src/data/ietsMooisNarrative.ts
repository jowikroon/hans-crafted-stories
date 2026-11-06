/** The story's symbolic sequence is independent of the album's proposed track order. */
export const ietsMooisOpening = {
  id: "album-origin",
  label: "Vijf woorden",
  title: ["IETS", "MOOIS"],
  quote: "Maak er iets moois van.",
  attribution: "Vijf woorden. Zijn laatste woorden. Het begin van mijn verhaal.",
  subtitle: "Van vijf woorden naar twee albums. Eén mens erachter.",
  imageId: "iets-dichterbij",
} as const;

export const ietsMooisScenes = [
  {
    id: "album-toen", label: "Maak", word: "wat ik ermee doe", title: "MAAK.",
    paragraphs: [
      "Mijn opa kende me. Hij wist hoe ik me druk kon maken om dingen die uiteindelijk niet zo belangrijk waren. Hoe druk zijn soms ook een manier was om ergens anders niet bij stil te hoeven staan.",
      "Als je nog één boodschap kunt meegeven, denk ik niet dat je die woorden zomaar kiest. Vooral dat eerste woord bleef hangen.",
      "Maak betekent voor mij niet dat ik alles kan bepalen wat me overkomt. Wel dat ik kan kiezen wat ik met mijn leven doe, waar ik aandacht aan geef en of ik eindelijk naar mezelf luister.",
    ],
    imageIds: ["vooruitkijken"], layout: "text-first",
  },
  {
    id: "album-tegenstem", label: "De uitvlucht", word: "ruimte voor zelfspot", title: "Druk met alles.",
    paragraphs: [
      "Er is altijd wel een probleem om op te lossen, een plan om beter te maken of een zijweg die ineens heel interessant lijkt. Dat kan een kracht zijn.",
      "Maar ik herken ook wanneer afleiding een uitvlucht wordt. Wanneer ik maar bezig blijf, zodat ik niet hoef te luisteren naar wat ik voel.",
      "Gelukkig mag er onderweg ook gelachen worden. Soms is zelfs een veel te grote kop koffie een prima excuus om het serieuze leven even uit te stellen.",
    ],
    imageIds: ["een-beetje-te-veel"], layout: "image-first",
  },
  {
    id: "album-stilte", label: "Alle deuren", word: "wat er al was", title: "Alle deuren.",
    paragraphs: [
      "Toen mijn opa overleed, gebeurde er iets wat ik niet had zien aankomen. Het verdriet om hem bleef niet op zichzelf staan.",
      "Het was alsof zijn overlijden alle deuren opende naar gevoelens die daar allang zaten. Wat ik jarenlang had weggestopt, stond opeens tegelijkertijd voor me.",
      "Te veel om in één keer toe te laten. En ik kon niet meer doen alsof de kamers daarachter niet bestonden.",
    ],
    imageIds: ["een-beetje-licht"], layout: "text-first",
  },
  {
    id: "album-tempo", label: "Mijn tempo", word: "kamer voor kamer", title: "Niet verbergen. Niet alles tegelijk.",
    paragraphs: [
      "Ik wil de gevoelens niet opnieuw verbergen, zoals ik vroeger deed. Maar ik raak overweldigd als ik alles tegelijk toelaat.",
      "Dus zoek ik iets ertussenin. Soms één deur. Eén gedachte. Eén herinnering. Eén nummer. Een deur die vandaag dicht blijft, hoeft niet voor altijd op slot.",
    ],
    imageIds: [], layout: "quiet",
  },
  {
    id: "album-spiegeling", label: "Toen en nu", word: "dezelfde verwondering", title: "Die jongen is er nog.",
    paragraphs: [
      "De jongen die ik ooit was, is niet verdwenen omdat ik ouder ben geworden. In de beelden kijken we elkaar soms aan, via dezelfde zonnebril.",
      "De verwondering van toen is er nog. De liefde voor muziek ook. Net als de neiging om veel te veel na te denken. En gelukkig de ruimte om mezelf niet altijd serieus te nemen.",
    ],
    imageIds: ["toen-in-nu", "nu-in-toen"], layout: "pair",
  },
  {
    id: "album-vandaag", label: "Brieven zonder naam", word: "voor iemand", title: "Niet iedere naam hoeft genoemd.",
    paragraphs: [
      "Sommige nummers op beide albums zijn eigenlijk woorden aan één iemand. Meestal zonder een naam te noemen. In één nummer laat ik die naam wel klinken.",
      "De luisteraar hoeft niet te weten voor wie een lied oorspronkelijk bedoeld was. Wat persoonlijk begint, mag iets zijn waar een ander zichzelf in herkent.",
    ],
    imageIds: ["ruimte-om-te-blijven"], layout: "image-first",
  },
] as const;

export const ietsMooisCode = {
  id: "album-code",
  label: "De verbinding",
  title: "Het licht gaat aan.",
  note: "Dit is een verhalende code, geen definitieve volgorde van de nummers.",
  explanation: "ON betekent voor mij dat alles weer aangaat, ook wat ik lang heb weggestopt. Maar een huis hoeft niet ineens overal fel verlicht te zijn. Het licht mag kamer voor kamer aan.",
} as const;
