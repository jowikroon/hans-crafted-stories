/**
 * Cloudflare Turnstile — alleen geladen op het productiedomein en pas bij de eerste interactie met het
 * contactformulier (geen third-party request op previews, localhost of voor bezoekers die het formulier
 * niet gebruiken). De server (Edge Function contact-submit) verifieert het token; dit is geen
 * clientside-beveiliging.
 */
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | null = null;

export function loadTurnstile(doc: Document = document): Promise<TurnstileApi> {
  if (typeof window !== "undefined" && window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const s = doc.createElement("script");
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    s.onerror = () => {
      loading = null;
      reject(new Error("turnstile load failed"));
    };
    doc.head.appendChild(s);
  });
  return loading;
}

export const turnstileSiteKey = (): string => (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();
