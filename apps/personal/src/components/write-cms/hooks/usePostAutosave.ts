import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPostData } from "./useBlogPost";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface EditableFields {
  title: string;
  title_nl: string;
  content: string;
  content_nl: string;
}

export interface UsePostAutosaveReturn {
  fields: EditableFields;
  setField: (key: keyof EditableFields, value: string) => void;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  saveNow: () => Promise<void>;
  errorMessage: string | null;
}

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(" ").length;
}

const AUTOSAVE_DELAY = 1500;
const VERSION_THROTTLE = 60_000; // 1 version per 60s max

export function usePostAutosave(
  post: BlogPostData | null,
): UsePostAutosaveReturn {
  const [fields, setFields] = useState<EditableFields>({
    title: "",
    title_nl: "",
    content: "",
    content_nl: "",
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVersionRef = useRef<number>(0);
  const lastSavedContentRef = useRef<string>("");
  const postIdRef = useRef<string | null>(null);

  // Hydrate fields when post changes (new post loaded)
  useEffect(() => {
    if (!post) return;
    if (postIdRef.current === post.id) return; // already hydrated
    postIdRef.current = post.id;
    const initial: EditableFields = {
      title: post.title || "",
      title_nl: post.title_nl || "",
      content: post.content || "",
      content_nl: post.content_nl || "",
    };
    setFields(initial);
    setSaveStatus("idle");
    setLastSaved(null);
    setErrorMessage(null);
    lastSavedContentRef.current = JSON.stringify(initial);
    lastVersionRef.current = 0;
  }, [post]);

  const setField = useCallback((key: keyof EditableFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("dirty");
    setErrorMessage(null);
  }, []);

  const saveToSupabase = useCallback(
    async (currentFields: EditableFields, manual: boolean) => {
      if (!post) return;

      const serialized = JSON.stringify(currentFields);
      if (serialized === lastSavedContentRef.current && !manual) return; // no actual change

      setSaveStatus("saving");
      try {
        const wordCount =
          countWords(currentFields.content) +
          countWords(currentFields.content_nl);

        const { error } = await supabase
          .from("blog_posts")
          .update({
            title: currentFields.title,
            title_nl: currentFields.title_nl,
            content: currentFields.content,
            content_nl: currentFields.content_nl,
            word_count: wordCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        if (error) throw error;

        lastSavedContentRef.current = serialized;
        const now = new Date();
        setLastSaved(now);
        setSaveStatus("saved");

        // Version snapshot: on manual save always, on autosave throttled to 60s
        const sinceLastVersion = now.getTime() - lastVersionRef.current;
        if (manual || sinceLastVersion >= VERSION_THROTTLE) {
          await supabase.from("blog_post_versions").insert({
            post_id: post.id,
            title: currentFields.title,
            content: currentFields.content,
            excerpt: currentFields.content.replace(/<[^>]*>/g, "").slice(0, 200),
            changed_by: manual ? "manual" : "autosave",
            change_summary: manual ? "Manual save" : "Autosave",
          });
          lastVersionRef.current = now.getTime();
        }
      } catch (err) {
        setSaveStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Save failed");
      }
    },
    [post],
  );

  // Debounced autosave
  useEffect(() => {
    if (saveStatus !== "dirty") return;
    if (!post) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveToSupabase(fields, false);
    }, AUTOSAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fields, saveStatus, post, saveToSupabase]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await saveToSupabase(fields, true);
  }, [fields, saveToSupabase]);

  return { fields, setField, saveStatus, lastSaved, saveNow, errorMessage };
}
