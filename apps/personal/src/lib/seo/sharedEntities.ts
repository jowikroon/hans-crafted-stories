export const PERSON_ENTITY = {
  "@type": "Person",
  "@id": "https://hansvanleeuwen.com/#person",
  name: "Hans van Leeuwen",
  url: "https://hansvanleeuwen.com/about",
  jobTitle: "Freelance E-commerce Manager",
  sameAs: [
    "https://www.linkedin.com/in/hansvl3",
    "https://github.com/jowikroon",
    "https://www.youtube.com/@jowikroon1990",
    "https://soundcloud.com/jowikroon",
  ],
} as const;

export const PROFESSIONAL_SERVICE_ENTITY = {
  "@type": ["Organization", "ProfessionalService"],
  "@id": "https://hansvanleeuwen.com/#organization",
  name: "Hans van Leeuwen – Freelance E-commerce Management",
  url: "https://hansvanleeuwen.com/",
  founder: { "@id": "https://hansvanleeuwen.com/#person" },
  areaServed: [
    { "@type": "Country", name: "Netherlands" },
    { "@type": "Place", name: "European Union" },
  ],
} as const;
