import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import MediaLibraryModal from "./MediaLibraryModal";

// ═══════════════════════════════════════════════════════════
//  MediaPickerContext
//
//  Provides a single, reusable media picker to the entire portal.
//  Any component can call:
//    const { pickImage } = useMediaPicker();
//    const url = await pickImage();   // opens modal, returns URL or null
//
//  The modal is rendered once at the provider level.
//  No prop drilling. No duplicate modals.
// ═══════════════════════════════════════════════════════════

interface MediaPickerContextValue {
  /** Opens the media library and returns the selected image URL, or null if cancelled. */
  pickImage: () => Promise<string | null>;
  /** Opens the media library in browse-only mode (no selection callback). */
  openLibrary: () => void;
}

const MediaPickerCtx = createContext<MediaPickerContextValue | null>(null);

export function useMediaPicker(): MediaPickerContextValue {
  const ctx = useContext(MediaPickerCtx);
  if (!ctx) throw new Error("useMediaPicker must be used within <MediaPickerProvider>");
  return ctx;
}

export function MediaPickerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"browse" | "pick">("browse");
  const resolverRef = useRef<((url: string | null) => void) | null>(null);

  const pickImage = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setMode("pick");
      setOpen(true);
    });
  }, []);

  const openLibrary = useCallback(() => {
    setMode("browse");
    setOpen(true);
  }, []);

  const handleSelect = useCallback((url: string) => {
    if (resolverRef.current) {
      resolverRef.current(url);
      resolverRef.current = null;
    }
    setOpen(false);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
  }, []);

  return (
    <MediaPickerCtx.Provider value={{ pickImage, openLibrary }}>
      {children}
      <MediaLibraryModal
        open={open}
        onOpenChange={handleOpenChange}
        onSelect={mode === "pick" ? handleSelect : undefined}
      />
    </MediaPickerCtx.Provider>
  );
}
