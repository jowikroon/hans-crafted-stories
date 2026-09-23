/**
 * Homepage-FAQ: één bron voor de zichtbare FAQ (HomeFAQ.tsx) én de FAQPage-JSON-LD die de
 * prerender per taal in / en /nl zet (scripts/prerender.mjs). Zichtbare en gemarkeerde tekst
 * zijn zo altijd gelijk (rich-result-eis; vroeger stond een Engelse kopie in index.html).
 *
 * Redactie 2026-09-24: primaire positionering marketplace manager (Amazon en bol primair,
 * eBay aanvullend en recent). Geen verzonnen resultaten, certificeringen of ervaringsduur.
 */
export type HomeFaqItem = { question: string; answer: string };

export const HOME_FAQ: Record<"en" | "nl", HomeFaqItem[]> = {
  en: [
    {
      question: "What does Hans van Leeuwen do?",
      answer:
        "Hans is a freelance and interim marketplace manager. He helps brands and retailers with strategy and day-to-day operations on Amazon and bol: product content, advertising, assortment and coordination with logistics and customer service. More recently he has also worked with eBay.",
    },
    {
      question: "Who hires a marketplace manager like Hans?",
      answer:
        "Brands and retailers that sell on Amazon (NL and DE) or bol, or are about to start, and teams that need temporary marketplace capacity. Typical questions are a launch, a vendor or seller choice, listing and advertising structure, or covering day-to-day marketplace work during a gap.",
    },
    {
      question: "How do I get in touch?",
      answer:
        "Use the contact form on the About page or email Hans directly; LinkedIn works too. Hans is based in Amersfoort and works for companies across the Netherlands and the EU. A short intake call is free and without obligation.",
    },
    {
      question: "What does a freelance marketplace manager cost?",
      answer:
        "Engagements are priced per model: a retainer for ongoing Amazon and bol management, project pricing for defined scopes such as an audit or launch, and a daily rate for interim work. The actual amount depends on scope and channel mix; a 30-minute intake usually leads to a written quote within one working day.",
    },
    {
      question: "How long until I see results on Amazon or bol?",
      answer:
        "Listing and A+ content fixes tend to shift conversion within 2 to 4 weeks. Restructuring Sponsored Products or advertising on bol usually shows a clear change in advertising cost within one advertising cycle (4 to 6 weeks). Structural improvements in share and stock availability take 3 to 6 months.",
    },
    {
      question: "Does Hans also work on Amazon DE?",
      answer:
        "Yes. Besides Amazon NL and bol, the work also covers Amazon DE for brands that expand in the EU, with the same approach per marketplace: listing quality, advertising, pricing, catalogue and reporting.",
    },
  ],
  nl: [
    {
      question: "Wat doet Hans van Leeuwen?",
      answer:
        "Hans is freelance en interim marketplace manager. Hij helpt merken en retailers met strategie en dagelijkse uitvoering op Amazon en bol: productcontent, advertenties, assortiment en afstemming met logistiek en klantenservice. Recent werkt hij ook met eBay.",
    },
    {
      question: "Wie schakelt een marketplace manager zoals Hans in?",
      answer:
        "Merken en retailers die op Amazon (NL en DE) of bol verkopen of daarmee gaan starten, en teams die tijdelijk marketplace-capaciteit nodig hebben. Typische vragen zijn een lancering, de keuze tussen vendor en seller, de opzet van listings en advertenties, of het dagelijkse marketplace-werk overnemen tijdens een gat in het team.",
    },
    {
      question: "Hoe neem ik contact op?",
      answer:
        "Via het contactformulier op de Over-pagina of rechtstreeks per e-mail; LinkedIn kan ook. Hans zit in Amersfoort en werkt voor bedrijven in heel Nederland en de EU. Een kort kennismakingsgesprek is gratis en vrijblijvend.",
    },
    {
      question: "Wat kost een freelance marketplace manager?",
      answer:
        "Opdrachten worden per model geprijsd: een retainer voor doorlopend Amazon- en bol-beheer, een projectprijs voor afgebakende opdrachten zoals een audit of lancering, en een dagtarief voor interimwerk. Het exacte bedrag hangt af van scope en kanaalmix; een intake van 30 minuten levert meestal binnen één werkdag een schriftelijke offerte op.",
    },
    {
      question: "Hoe lang duurt het voordat ik resultaat zie op Amazon of bol?",
      answer:
        "Verbeteringen in listings en A+-content bewegen de conversie meestal binnen 2 tot 4 weken. Een herstructurering van Sponsored Products of adverteren op bol laat doorgaans binnen één advertentiecyclus (4 tot 6 weken) een duidelijk verschil in advertentiekosten zien. Structurele verbeteringen in marktaandeel en voorraadbeschikbaarheid duren 3 tot 6 maanden.",
    },
    {
      question: "Werkt Hans ook op Amazon DE?",
      answer:
        "Ja. Naast Amazon NL en bol gaat het werk ook over Amazon DE voor merken die in de EU uitbreiden, met dezelfde aanpak per marketplace: listingkwaliteit, advertenties, prijzen, catalogus en rapportage.",
    },
  ],
};

/** FAQPage-JSON-LD uit dezelfde bron als de zichtbare FAQ. */
export const homeFaqJsonLd = (lang: "en" | "nl") => ({
  "@type": "FAQPage",
  "@id": `https://hansvanleeuwen.com/${lang === "nl" ? "nl" : ""}#faq`,
  inLanguage: lang,
  mainEntity: HOME_FAQ[lang].map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});
