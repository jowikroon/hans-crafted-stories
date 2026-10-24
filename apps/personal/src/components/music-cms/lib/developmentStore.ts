import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { DevelopmentPage } from "./developmentLibrary";

const db = supabase as unknown as SupabaseClient;
export async function listDevelopmentPages(): Promise<DevelopmentPage[]> {
  const { data: admin, error: accessError } = await db.rpc("is_admin");
  if (accessError || !admin) throw new Error("De developmentbibliotheek is alleen beschikbaar voor het admin-account.");
  const result: DevelopmentPage[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("music_development_pages").select("*").order("source_modified", { ascending: false }).order("id").range(offset, offset + 499);
    if (error?.code === "42P01" || error?.code === "PGRST205") throw new Error("De developmentbibliotheek is nog niet ingericht. De Beeldbank blijft hieronder beschikbaar.");
    if (error) throw new Error("De developmentpagina’s konden niet worden geladen. Probeer opnieuw.");
    result.push(...(data as DevelopmentPage[]));
    if (data.length < 500) return result;
  }
}
