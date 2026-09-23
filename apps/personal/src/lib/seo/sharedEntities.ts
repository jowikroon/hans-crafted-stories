import { IDENTITY } from "@/lib/seo/identity";

export const PERSON_ENTITY = {
  "@type": "Person",
  "@id": "https://hansvanleeuwen.com/#person",
  name: "Hans van Leeuwen",
  url: "https://hansvanleeuwen.com/about",
  jobTitle: IDENTITY.jobTitle.en,
  sameAs: [
    "https://www.linkedin.com/in/hansvl3",
    "https://github.com/jowikroon",
    "https://www.youtube.com/@jowikroon1990",
    "https://soundcloud.com/jowikroon",
  ],
} as const;

/** Person-entity in de paginataal (jobTitle NL op NL-pagina's; twin van personEntity in prerender.mjs). */
export const personEntityFor = (lang: "en" | "nl") =>
  lang === "nl" ? { ...PERSON_ENTITY, jobTitle: IDENTITY.jobTitle.nl, description: IDENTITY.personDescription.nl } : { ...PERSON_ENTITY, description: IDENTITY.personDescription.en };

export const PROFESSIONAL_SERVICE_ENTITY = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": "https://hansvanleeuwen.com/#organization",
  name: IDENTITY.organizationName,
  url: "https://hansvanleeuwen.com/",
  founder: { "@id": "https://hansvanleeuwen.com/#person" },
  areaServed: [
    { "@type": "Country", name: "Netherlands" },
    { "@type": "Place", name: "European Union" },
  ],
} as const;
