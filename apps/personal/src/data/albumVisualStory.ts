/** Artwork supplied and selected by Jowikroon on 5 November 2026. */
export const ietsMooisVisualStory = [
  {
    id: "de-belofte",
    title: "De belofte",
    principle: "Het vertrekpunt",
    description: "Iets moois maken van wat je meedraagt. Een open blik geeft die belofte een gezicht.",
    alt: "IETS MOOIS: Jowikroon zit voor een diepgroene achtergrond, met zijn bril in de hand en een kleine paarse lijn onderin.",
  },
  {
    id: "de-beeldtaal",
    title: "De beeldtaal",
    principle: "Rust in kleur",
    description: "Diepgroen, bordeaux en warm licht houden het beeld dichtbij. Eén paarse lijn verbindt het met de wereld van NEON.",
    alt: "Portret van Jowikroon met een open blik, een bordeaux overhemd en een zwarte zonnebril in zijn hand.",
  },
  {
    id: "toen-en-nu",
    title: "Toen & nu",
    principle: "Ruimte voor betekenis",
    description: "Een jonge blik draagt het beeld van later in zich. De spiegeling laat ruimte voor je eigen verhaal.",
    alt: "Een kind met een zonnebril in warm tegenlicht; in één glas verschijnt het volwassen portret van Jowikroon.",
  },
  {
    id: "de-achterkant",
    title: "De achterkant",
    principle: "Een ontwerp in wording",
    description: "Ook de achterkant geeft woorden en beeld de ruimte. De volgorde op dit ontwerp is een voorstel.",
    alt: "Achterkant van IETS MOOIS, met een hand en zonnebril. Voorgestelde volgorde: N=1; Deel 2; Eentje eentje met god erin; Onder de brug met Spiegel Pietje; Tussen Alles In; Mijn opa weet alles; = ON.",
  },
] as const;

export function albumStoryImage(id: string, thumbnail = false) {
  return `/images/albums/iets-moois-story/${id}${thumbnail ? "-480" : ""}.webp`;
}
