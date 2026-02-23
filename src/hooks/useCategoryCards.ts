import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryCardRow {
  id: string;
  page: string;
  label: string;
  value: string;
  icon: string;
  description: string;
  color_from: string;
  color_to: string;
  text_color: string;
  border_color: string;
  active_color_from: string;
  active_color_to: string;
  active_border_color: string;
  sort_order: number;
  is_visible: boolean;
}

export function useCategoryCards(page: string) {
  const [cards, setCards] = useState<CategoryCardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("category_cards")
      .select("*")
      .eq("page", page)
      .eq("is_visible", true)
      .order("sort_order")
      .then(({ data }) => {
        setCards((data as CategoryCardRow[]) ?? []);
        setLoading(false);
      });
  }, [page]);

  return { cards, loading };
}
