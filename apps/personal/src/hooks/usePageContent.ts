import { useState, useEffect, useCallback } from "react";
import { getPageContent, PageContentRow } from "@/lib/api/pageContent";
import { useLang } from "@/hooks/useLang";
import { resolvePageContentValue } from "@/lib/pageContentLang";

export { resolvePageContentValue };

export function usePageContent(page: string) {
  const [rows, setRows] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    getPageContent(page)
      .then(setRows)
      .catch(() => { /* empty */ })
      .finally(() => setLoading(false));
  }, [page]);

  const getValue = useCallback(
    (key: string, fallback: string, opts?: { neutral?: boolean }) => {
      // opts.neutral: taalneutrale velden buiten LANGUAGE_NEUTRAL_KEYS (bv. een label dat
      // in beide talen gelijk is). Zelfde regel als die lijst: eerst de _nl-rij, dan de
      // gedeelde basisrij, anders de code-fallback.
      if (opts?.neutral && lang !== "en") {
        return resolvePageContentValue(rows, key, lang, "") || resolvePageContentValue(rows, key, "en", fallback);
      }
      return resolvePageContentValue(rows, key, lang, fallback);
    },
    [rows, lang]
  );

  return { rows, loading, getValue };
}
