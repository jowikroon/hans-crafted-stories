import { useState, useEffect, useCallback } from "react";
import { getPageContent, PageContentRow } from "@/lib/api/pageContent";
import { useLang } from "@/hooks/useLang";
import { stripEmDash } from "@/lib/noEmDash";

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
      // Niet-Engels: alleen een taal-specifieke CMS-rij (bv. about_h1_nl) mag de
      // (gelokaliseerde) code-fallback vervangen. De basis-rij is Engels; die viel
      // eerder vóór de NL-fallback, waardoor /nl/about een Engelse H1 toonde (F2.10).
      if (lang !== "en" && !opts?.neutral) {
        const langRow = rows.find((r) => r.content_key === `${key}_${lang}`);
        return langRow?.content_value ? stripEmDash(langRow.content_value) : fallback;
      }
      const row = rows.find((r) => r.content_key === key);
      return row?.content_value ? stripEmDash(row.content_value) : fallback;
    },
    [rows, lang]
  );

  return { rows, loading, getValue };
}
