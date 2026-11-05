/** A reading sequence, independent of the album's proposed track order. */
export const ietsMooisOpening = {
  id: "album-origin",
  label: "De belofte",
  title: ["Ik beloofde iets moois te maken.", "Van mijn leven."],
  subtitle: "Een verhaal in het Nederlands",
  imageId: "iets-dichterbij",
} as const;

export const ietsMooisScenes = [
  {
    id: "album-toen", label: "Toen", word: "verwondering", title: "Ooit was weten genoeg",
    text: "Er was een tijd waarin de wereld nog vanzelf leek te kloppen. De verwondering van toen reist met me mee, ook nu er meer vragen zijn.",
    imageIds: ["vooruitkijken"], layout: "image-first",
  },
  {
    id: "album-stilte", label: "De stilte", word: "wat ongezegd bleef", title: "Wat weg is, klinkt door",
    text: "Later kwamen de vragen, en bleef soms juist het ongezegde hangen. In mijn eigen taal zoek ik woorden voor gemis, spijt en schaamte.",
    imageIds: ["een-beetje-licht"], layout: "text-first",
  },
  {
    id: "album-tegenstem", label: "De tegenstem", word: "ruimte voor de lach", title: "Er mag iets dwarszitten",
    text: "Ik laat de twijfel meepraten, ook wanneer het over liefde gaat. Soms met een dwarse vraag, soms met een lach om iets dat net te groot uitvalt.",
    imageIds: ["een-beetje-te-veel"], layout: "image-first",
  },
  {
    id: "album-spiegeling", label: "De spiegeling", word: "toen in nu / nu in toen", title: "Toen kijkt mee",
    text: "In de spiegeling ontmoeten twee leeftijden elkaar. Wat ik meedraag, krijgt een andere betekenis wanneer ik er vandaag naar kijk.",
    imageIds: ["toen-in-nu", "nu-in-toen"], layout: "pair",
  },
  {
    id: "album-vandaag", label: "Vandaag", word: "wat blijft", title: "Van wat er nu is",
    text: "De belofte krijgt vorm in wat ik vandaag doe: iemand toelaten, blijven, iets teruggeven. In deze liedjes probeer ik te begrijpen wie ik nu ben.",
    imageIds: ["ruimte-om-te-blijven"], layout: "text-first",
  },
] as const;
