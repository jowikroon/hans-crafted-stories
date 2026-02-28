import { useState, useEffect, useCallback } from "react";
import { getPageContent, PageContentRow } from "@/lib/api/pageContent";
import { useLang } from "@/hooks/useLang";

export function usePageContent(page: string) {
  const [rows, setRows] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    getPageContent(page)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const getValue = useCallback(
    (key: string, fallback: string) => {
      // Try lang-suffixed key first (e.g. hero_heading_nl)
      if (lang !== "en") {
        const langRow = rows.find((r) => r.content_key === `${key}_${lang}`);
        if (langRow?.content_value) return langRow.content_value;
      }
      // Fall back to base key (English default)
      const row = rows.find((r) => r.content_key === key);
      return row?.content_value || fallback;
    },
    [rows, lang]
  );

  return { rows, loading, getValue };
}
