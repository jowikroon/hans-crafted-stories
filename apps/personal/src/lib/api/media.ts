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
    .from("media_library" as unknown)
    .select("*")
    .order("created_at", { ascending: false });
  if (folder && folder !== "all") query = query.eq("folder", folder);
  const { data, error } = await query;
  if (error) {
    if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
      throw new Error("Cannot load media — check that your account has the right permissions.");
    }
    throw new Error(`Failed to load media: ${error.message}`);
  }
  return (data ?? []) as unknown as MediaItem[];
}

export async function uploadMedia(
  file: File | Blob,
  fileName: string,
  folder: string = "general",
  altText: string = ""
): Promise<MediaItem> {
  // Verify session before attempting upload
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to upload files.");

  const ext = file.type.split("/")[1] || "jpg";
  const path = `${folder}/${fileName}-${Date.now()}.${ext}`;

  // Step 1: Upload to storage
  const { error: uploadError } = await supabase.storage.from("bucket").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) {
    if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")) {
      throw new Error("Upload denied — your account doesn't have admin permissions.");
    }
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
  const publicUrl = urlData?.publicUrl || "";

  // Step 2: Save metadata row
  const item = {
    file_name: fileName,
    storage_path: path,
    public_url: publicUrl,
    mime_type: file.type,
    file_size: file instanceof File ? file.size : 0,
    alt_text: altText,
    folder,
    uploaded_by: user.id,
  };

  const { data, error } = await supabase
    .from("media_library" as unknown)
    .insert(item as unknown)
    .select()
    .single();

  if (error) {
    // Clean up orphaned storage file if DB insert failed
    await supabase.storage.from("bucket").remove([path]).catch(() => { /* empty */ });
    if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
      throw new Error("Metadata save denied — your account doesn't have admin permissions.");
    }
    throw new Error(`Failed to save file metadata: ${error.message}`);
  }

  return data as unknown as MediaItem;
}

export async function deleteMedia(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage.from("bucket").remove([storagePath]);
  if (storageError) console.warn("Storage delete warning:", storageError.message);

  const { error } = await supabase.from("media_library" as unknown).delete().eq("id", id);
  if (error) {
    if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
      throw new Error("Delete denied — admin permissions required.");
    }
    throw new Error(`Failed to delete: ${error.message}`);
  }
}

export async function updateMediaAlt(id: string, altText: string): Promise<void> {
  const { error } = await supabase
    .from("media_library" as unknown)
    .update({ alt_text: altText } as unknown)
    .eq("id", id);
  if (error) {
    if (error.message?.includes("row-level security") || error.message?.includes("policy")) {
      throw new Error("Update denied — admin permissions required.");
    }
    throw new Error(`Failed to update: ${error.message}`);
  }
}
