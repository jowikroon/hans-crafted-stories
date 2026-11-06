/** Public-facing editorial scenes, not a proposed or confirmed album track order. */
export interface NeonScene {
  id: string;
  label: string;
  marker: string;
  title: string;
  paragraphs: readonly string[];
  visual: "pulse" | "glass" | "pressure" | "doors" | "slit" | "then" | "between";
  visualAlt: string;
  musicalEcho?: string;
}

export const neonScenes: readonly NeonScene[] = [
  {
    id: "neon-scene-1", label: "Signaal", marker: "N / een eerste beweging", title: "Het begint klein.",
    paragraphs: [
      "Er was altijd al iets in mij dat wilde maken, ontdekken, proberen. De verwondering van vroeger verdween niet toen ik ouder werd. Soms hoorde ik haar alleen minder goed.",
      "Dan kan een klein signaal genoeg zijn. Niet de hele stad hoeft te veranderen. Eén punt licht kan je blik een andere richting geven.",
    ],
    visual: "pulse", visualAlt: "Drie dunne lichtkringen met één klein violet punt", musicalEcho: "New Level",
  },
  {
    id: "neon-scene-2", label: "Glas", marker: "Schijn en spiegeling", title: "Achter het glas.",
    paragraphs: [
      "Je kunt veel laten zien en toch iets voor jezelf houden. Muziek maken, dingen delen, druk zijn met wat er aan de buitenkant gebeurt. Dat is niet hetzelfde als vertellen hoe het echt met je gaat.",
      "Gezien worden is niet hetzelfde als gekend worden. Die afstand krijgt in NEON een eigen wereld van spiegelingen en licht.",
    ],
    visual: "glass", visualAlt: "Donkere transparante vlakken doorsneden door een dunne violette lichtlijn", musicalEcho: "Neon House of Glass",
  },
  {
    id: "neon-scene-3", label: "Druk", marker: "E / de spanning", title: "Druk heeft ook een ritme.",
    paragraphs: [
      "Er is altijd nog iets te doen. Nog een idee, een plan, een probleem dat eerst opgelost kan worden. Soms helpt die energie me vooruit.",
      "En soms is ze een uitvlucht. Dan overstemt het tempo wat ik eigenlijk voel. De muziek mag hard gaan, maar ik wil mezelf er niet opnieuw in kwijtraken.",
    ],
    visual: "pressure", visualAlt: "Een rij onregelmatige ritmebalken, met één violette puls", musicalEcho: "Pressure",
  },
  {
    id: "neon-scene-4", label: "Deuren", marker: "Wat er al was", title: "Niet één deur. Allemaal.",
    paragraphs: [
      "Toen mijn opa overleed, ging er meer open dan verdriet om hem. Het was alsof alle deuren naar gevoelens die er al jaren waren, tegelijk opengingen.",
      "Dat moment heeft die gevoelens niet veroorzaakt. Het maakte het onmogelijk om aan ze voorbij te blijven lopen. Er was te veel om er niets meer mee te doen.",
    ],
    visual: "doors", visualAlt: "Zeven deuren in het donker; één ervan laat voorzichtig warm licht binnen",
  },
  {
    id: "neon-scene-5", label: "Tempo", marker: "De ruimte ertussen", title: "Niet verbergen. Niet alles tegelijk.",
    paragraphs: [
      "Ik verstopte mijn gevoelens vroeger vaak. Dat wil ik niet meer. Maar als ik alles in één keer toelaat, raak ik overweldigd.",
      "Daarom kies ik mijn eigen tempo. Eén gedachte. Eén herinnering. Eén nummer. De kamer die vandaag donker blijft, hoeft niet voorgoed gesloten te zijn.",
      "Ik kan niet alle emoties besturen. Wel hoe ik probeer ernaar te luisteren.",
    ],
    visual: "slit", visualAlt: "Een stille donkere ruimte met een enkele smalle, warme lichtopening",
  },
  {
    id: "neon-scene-6", label: "Toen / nu", marker: "Twee levensfasen", title: "Die jongen is er nog.",
    paragraphs: [
      "Op de bestaande albumbeelden reiken mijn jongere en mijn huidige hand naar elkaar. Er zitten jaren tussen, maar het is dezelfde mens.",
      "Niet alles van vroeger hoef ik achter te laten. De verwondering mag mee. Net als wat ik inmiddels anders wil doen.",
    ],
    visual: "then", visualAlt: "De woorden TOEN en NU verbinden zich via een zachte violette lijn",
  },
  {
    id: "neon-scene-7", label: "Verbinding", marker: "ON / naar de ander", title: "Het signaal is niet alleen van mij.",
    paragraphs: [
      "Een beat kan mensen die elkaar niet kennen even samen laten bewegen. Niet omdat muziek alles oplost, maar omdat de afstand een moment kleiner wordt.",
      "Een lied begint soms als iets wat ik tegen één iemand wil zeggen, zonder naam. Een ander kan er toch iets van zichzelf in horen. Wat me raakt, is aandacht: iemand die luistert, iemand die om een ander geeft.",
    ],
    visual: "between", visualAlt: "Twee lichtpunten, op afstand verbonden door één dunne lijn", musicalEcho: "Beat Drop",
  },
] as const;

export const neonEpilogue = {
  id: "neon-scene-8",
  label: "Ochtend",
  marker: "Zonder sluitend antwoord",
  title: "De ochtend wist de nacht niet uit.",
  paragraphs: [
    "Er komt weer licht op mijn gezicht. Niet omdat alles weg is of omdat er nooit meer iets moeilijks komt. De stad is er nog. Ik ook.",
    "Ik hoef de nacht niet uit te wissen om de ochtend weer te herkennen.",
  ],
} as const;

export const neonCipher = { id: "neon-scene-9", label: "De code", title: "Het licht gaat aan." } as const;
