import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Link2 } from "lucide-react";
import type { AlbumVisualStoryImage } from "@/data/albumVisualStory";

type CopyState = "idle" | "copying" | "copied" | "manual";

/** Keep shared URLs public and specific, without copying unrelated query data. */
export default function AlbumArtworkActions({ image }: { image: AlbumVisualStoryImage }) {
  const imageLink = `https://hansvanleeuwen.com/music/albums/iets-moois/brand?beeld=${encodeURIComponent(image.id)}#album-world`;
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const request = useRef(0);
  const copying = useRef(false);
  const copyButton = useRef<HTMLButtonElement>(null);
  const manualLink = useRef<HTMLInputElement>(null);
  const focusManualLink = useRef(false);
  const inputId = useId();

  // A late clipboard result must not update a different image or a closed dialog.
  useEffect(() => () => { request.current += 1; }, []);
  useEffect(() => {
    if (copyState === "manual" && focusManualLink.current && document.activeElement === copyButton.current) {
      manualLink.current?.focus();
      manualLink.current?.select();
    }
    focusManualLink.current = false;
  }, [copyState]);

  async function copyImageLink() {
    if (copying.current) return;
    copying.current = true;
    const attempt = ++request.current;
    setCopyState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(imageLink);
      if (attempt === request.current) setCopyState("copied");
    } catch {
      if (attempt === request.current) {
        focusManualLink.current = document.activeElement === copyButton.current;
        setCopyState("manual");
      }
    } finally {
      if (attempt === request.current) copying.current = false;
    }
  }

  return <div className="avs-artwork-actions">
    <div className="avs-artwork-actions__buttons">
      <a className="avs-artwork-action" href={image.src} target="_blank" rel="noopener noreferrer" aria-label={`Bekijk groot: ${image.title} (nieuw tabblad)`}>
        <span>Bekijk groot</span><ArrowUpRight size={17} aria-hidden="true" />
      </a>
      <button ref={copyButton} type="button" className="avs-artwork-action" aria-disabled={copyState === "copying"} onClick={copyImageLink}>
        <Link2 size={16} aria-hidden="true" /><span>Kopieer beeldlink</span>
      </button>
    </div>
    <p className="avs-artwork-actions__status" role="status" aria-live="polite" aria-atomic="true">
      {copyState === "copying" ? "Beeldlink kopiëren…" : copyState === "copied" ? "Link gekopieerd." : copyState === "manual" ? "Selecteer en kopieer de beeldlink." : ""}
    </p>
    {copyState === "manual" && <div className="avs-artwork-actions__manual">
      <label htmlFor={inputId}>Beeldlink</label>
      <input id={inputId} ref={manualLink} type="url" value={imageLink} readOnly onFocus={(event) => event.currentTarget.select()} />
    </div>}
  </div>;
}
