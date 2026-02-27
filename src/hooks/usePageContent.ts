import { useState, useEffect, useCallback } from "react";
import { getPageContent, PageContentRow } from "@/lib/api/pageContent";

export function usePageContent(page: string) {
  const [rows, setRows] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPageContent(page)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const getValue = useCallback(
    (key: string, fallback: string) => {
      const row = rows.find((r) => r.content_key === key);
      return row?.content_value || fallback;
    },
    [rows]
  );

  return { rows, loading, getValue };
}
