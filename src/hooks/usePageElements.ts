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
      .channel(`page_elements_${page}`)
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
