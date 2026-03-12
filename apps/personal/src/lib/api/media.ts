import { supabase } from "@/integrations/supabase/client";

export interface MediaItem {
  id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  alt_text: string;
  folder: string;
  uploaded_by: string | null;
  created_at: string;
}

export async function getMediaItems(folder?: string): Promise<MediaItem[]> {
  let query = supabase
    .from("media_library" as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (folder && folder !== "all") query = query.eq("folder", folder);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MediaItem[];
}

export async function uploadMedia(
  file: File | Blob,
  fileName: string,
  folder: string = "general",
  altText: string = ""
): Promise<MediaItem> {
  const path = `${folder}/${fileName}-${Date.now()}.${file.type.split("/")[1] || "jpg"}`;

  const { error: uploadError } = await supabase.storage.from("bucket").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || "";

  const item = {
    file_name: fileName,
    storage_path: path,
    public_url: publicUrl,
    mime_type: file.type,
    file_size: file instanceof File ? file.size : 0,
    alt_text: altText,
    folder,
  };

  const { data, error } = await supabase
    .from("media_library" as any)
    .insert(item as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MediaItem;
}

export async function deleteMedia(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("bucket").remove([storagePath]);
  const { error } = await supabase.from("media_library" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function updateMediaAlt(id: string, altText: string): Promise<void> {
  const { error } = await supabase
    .from("media_library" as any)
    .update({ alt_text: altText } as any)
    .eq("id", id);
  if (error) throw error;
}
