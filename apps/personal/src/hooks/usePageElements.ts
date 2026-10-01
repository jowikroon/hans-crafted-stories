import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageElement {
  id: string;
  page: string;
  element_key: string;
  element_label: string;
  element_group: string;
  is_visible: boolean;
  sort_order: number;
}

/*
 * Elke hook-instantie krijgt een eigen kanaalnaam. Bij een taalwissel (/nl/about ->
 * /about) houdt AnimatePresence de vertrekkende pagina nog even gemount; met een
 * vaste naam gaf supabase.channel() het al geabonneerde kanaal terug en gooide
 * .on() "cannot add postgres_changes callbacks ... after subscribe()", waarna de
 * route-error-boundary "This page could not be displayed." toonde
 * (i18n-audit 2026-10-01, reproduceerbaar op productie).
 */
let channelSeq = 0;

export function usePageElements(page: string) {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchElements = useCallback(() => {
    supabase
      .from("page_elements")
      .select("*")
      .eq("page", page)
      .order("sort_order")
      .then(({ data }) => {
        const list = (data as PageElement[]) || [];
        setElements(list);
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    fetchElements();

    const channel = supabase
      .channel(`page_elements_${page}_${++channelSeq}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_elements", filter: `page=eq.${page}` },
        () => fetchElements()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [page, fetchElements]);

  const isVisible = useCallback(
    (key: string) => {
      const el = elements.find((e) => e.element_key === key);
      return el ? el.is_visible : true; // default visible if not found
    },
    [elements]
  );

  return { elements, loading, isVisible };
}

export function useAllPageElements() {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("page_elements")
      .select("*")
      .order("page")
      .order("sort_order");
    setElements((data as PageElement[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleVisibility = async (id: string, visible: boolean) => {
    await supabase.from("page_elements").update({ is_visible: visible }).eq("id", id);
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_visible: visible } : e))
    );
  };

  return { elements, loading, refetch: fetch, toggleVisibility };
}
