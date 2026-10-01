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
    (key: string, fallback: string) => {
      return resolvePageContentValue(rows, key, lang, fallback);
    },
    [rows, lang]
  );

  return { rows, loading, getValue };
}
