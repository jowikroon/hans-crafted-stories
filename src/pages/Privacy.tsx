import { useSEO } from "@/hooks/useSEO";

const Privacy = () => {
  useSEO({
    title: "Privacybeleid | Hans van Leeuwen",
    description: "Lees het privacybeleid van hansvanleeuwen.com – hoe we omgaan met je gegevens, cookies en analytics.",
    url: "https://hansvanleeuwen.com/privacy",
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="mb-8 font-serif text-4xl font-semibold text-foreground">
        Privacybeleid
      </h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm text-muted-foreground/70">
          Laatst bijgewerkt: februari 2026
        </p>

        <h2 className="text-xl font-semibold text-foreground">1. Wie zijn wij?</h2>
        <p>
          Deze website wordt beheerd door Hans van Leeuwen, e-commerce manager gevestigd in Amersfoort, Nederland. 
          Voor vragen over dit privacybeleid kun je contact opnemen via{" "}
          <a href="mailto:hansvl3@gmail.com" className="text-primary underline">hansvl3@gmail.com</a>.
        </p>

        <h2 className="text-xl font-semibold text-foreground">2. Welke gegevens verzamelen wij?</h2>
        <p>
          Wij verzamelen uitsluitend anonieme analytische gegevens via Google Analytics 4 (GA4), 
          beheerd via Google Tag Manager. Dit omvat onder andere paginaweergaven, sessieduur 
          en apparaattype. Er worden geen persoonsgegevens zoals naam, e-mailadres of IP-adres 
          opgeslagen — IP-anonimisering is standaard ingeschakeld in GA4.
        </p>

        <h2 className="text-xl font-semibold text-foreground">3. Cookies</h2>
        <p>
          Wij gebruiken analytische cookies uitsluitend na jouw expliciete toestemming (opt-in). 
          Zonder toestemming worden er geen tracking-cookies geplaatst. Je kunt je toestemming 
          op elk moment intrekken door je browsergegevens te wissen.
        </p>

        <h2 className="text-xl font-semibold text-foreground">4. Google Consent Mode v2</h2>
        <p>
          Deze website maakt gebruik van Google Consent Mode v2. Dit betekent dat alle 
          opslagtypen (analytics, advertenties, personalisatie) standaard worden geweigerd 
          voor bezoekers uit de EER, totdat je actief toestemming geeft.
        </p>

        <h2 className="text-xl font-semibold text-foreground">5. Delen met derden</h2>
        <p>
          Wij delen geen persoonsgegevens met derden. Analytische data wordt uitsluitend 
          verwerkt door Google conform hun{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            privacybeleid
          </a>.
        </p>

        <h2 className="text-xl font-semibold text-foreground">6. Je rechten</h2>
        <p>
          Op grond van de AVG heb je recht op inzage, rectificatie en verwijdering van je 
          gegevens. Aangezien wij geen persoonsgegevens opslaan, is dit in de praktijk niet 
          van toepassing. Voor vragen kun je altijd contact opnemen.
        </p>

        <h2 className="text-xl font-semibold text-foreground">7. Wijzigingen</h2>
        <p>
          Dit privacybeleid kan worden bijgewerkt. De meest recente versie is altijd 
          beschikbaar op deze pagina.
        </p>
      </div>
    </section>
  );
};

export default Privacy;
