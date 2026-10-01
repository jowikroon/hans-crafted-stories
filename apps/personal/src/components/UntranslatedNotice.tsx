import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { parseUntranslatedNotice, type UntranslatedNotice as Notice } from "@/lib/i18n/untranslated";

/**
 * Eén regel boven de pagina wanneer de taalschakelaar hierheen terugviel omdat
 * de vorige pagina geen vertaling heeft (zie lib/i18n/untranslated.ts).
 * Rendert pas na mount: de prerender kent de query niet, zo blijft de hydratie
 * gelijk aan de server-HTML.
 */
const COPY: Record<Notice, { text: string; back: string; lang: "nl" | "en" }> = {
  "only-nl": {
    text: "This page is only available in Dutch, so you are now on the English version of the site.",
    back: "Read the Dutch version",
    lang: "en",
  },
  "only-en": {
    text: "Deze pagina is alleen in het Engels beschikbaar, daarom zie je nu de Nederlandse versie van de site.",
    back: "Lees de Engelse versie",
    lang: "nl",
  },
};

const UntranslatedNotice = () => {
  const location = useLocation();
  const [state, setState] = useState<ReturnType<typeof parseUntranslatedNotice>>(null);

  useEffect(() => {
    setState(parseUntranslatedNotice(location.search));
  }, [location.search]);

  if (!state) return null;
  const copy = COPY[state.notice];
  return (
    <div className="section-container pt-4" lang={copy.lang}>
      <p
        role="status"
        data-i18n-notice={state.notice}
        className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
      >
        {copy.text}{" "}
        <RouterLink to={state.from} hrefLang={copy.lang === "en" ? "nl" : "en"} className="font-semibold text-foreground underline underline-offset-2">
          {copy.back}
        </RouterLink>
      </p>
    </div>
  );
};

export default UntranslatedNotice;
