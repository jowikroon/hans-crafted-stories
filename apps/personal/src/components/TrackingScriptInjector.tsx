import { useEffect, useState, useCallback } from "react";
import { getTrackingScripts, TrackingScript } from "@/lib/api/trackingScripts";

const DEFER_TYPES = new Set(["hotjar", "linkedin", "meta_pixel", "custom"]);

/** GA4 is configured inside GTM; do not inject a separate gtag/GA4 script when GTM is already on the page. */
function isGtmAlreadyPresent(): boolean {
  return typeof document !== "undefined" && !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
}

const GTM_ID = "GTM-K22B6627";
/** Na hoeveel ms de GTM-container alsnog laadt als de bezoeker niets doet. */
const GTM_IDLE_TIMEOUT_MS = 3500;

/**
 * Laadt de GTM-container na LCP in plaats van synchroon in de <head>.
 * Stond tot okt 2026 in index.html; de container is 429 KB raw / 144 KB gz en
 * concurreerde daar met het app-bundle tijdens First Contentful Paint.
 * Consent Mode default blijft wel synchroon in index.html staan, zodat GTM
 * nog steeds met de juiste consent-state boot.
 */
function loadGtm() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __gtmLoaded?: boolean; dataLayer?: unknown[] };
  if (w.__gtmLoaded || isGtmAlreadyPresent()) return;
  w.__gtmLoaded = true;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

/**
 * GTM wordt sinds okt 2026 door deze component zelf geladen (post-LCP), dus de
 * container komt gegarandeerd op de pagina, ook als hij er op dit moment nog
 * niet staat. De GA4-dedupe hieronder moet daarom niet meer naar de DOM kijken:
 * deed hij dat wel, dan injecteerde hij in het venster voor de GTM-load alsnog
 * een losse GA4-tag en had je dubbele hits.
 */
function isGtmManaged(): boolean {
  return Boolean(GTM_ID);
}

function shouldSkipScript(script: TrackingScript): boolean {
  if (!isGtmManaged() && !isGtmAlreadyPresent()) return false;
  if (script.script_type === "ga4") return true;
  const code = (script.code || "").toLowerCase();
  if (code.includes("gtag/js") || code.includes("googletagmanager.com/gtag")) return true;
  return false;
}

function injectScript(script: TrackingScript) {
  const container = script.position === "body" ? document.body : document.head;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = script.code;

  Array.from(wrapper.childNodes).forEach((node) => {
    if (node instanceof HTMLScriptElement) {
      const newScript = document.createElement("script");
      Array.from(node.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = node.textContent;
      container.appendChild(newScript);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  });
}

/**
 * Injects active tracking scripts into the document.
 * Critical scripts (GTM, GA4) load on mount.
 * Non-essential scripts (Hotjar, etc.) defer until first user interaction.
 */
const TrackingScriptInjector = () => {
  const [injected, setInjected] = useState(false);

  const inject = useCallback(async () => {
    try {
      let scripts = await getTrackingScripts(true);
      scripts = scripts.filter((s) => !shouldSkipScript(s));
      const critical: TrackingScript[] = [];
      const deferred: TrackingScript[] = [];

      scripts.forEach((s) => {
        if (DEFER_TYPES.has(s.script_type)) {
          deferred.push(s);
        } else {
          critical.push(s);
        }
      });

      critical.forEach(injectScript);

      if (deferred.length > 0) {
        const loadDeferred = () => {
          deferred.forEach(injectScript);
          ["scroll", "click", "keydown", "touchstart"].forEach((e) =>
            document.removeEventListener(e, loadDeferred, { capture: true })
          );
        };
        ["scroll", "click", "keydown", "touchstart"].forEach((e) =>
          document.addEventListener(e, loadDeferred, { once: true, capture: true, passive: true } as AddEventListenerOptions)
        );
      }

      setInjected(true);
    } catch (e) {
      console.error("Failed to load tracking scripts:", e);
    }
  }, []);

  // GTM: na LCP of bij de eerste interactie, wat eerder komt.
  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    const fire = () => {
      loadGtm();
      events.forEach((e) => window.removeEventListener(e, fire));
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const handle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(fire, { timeout: GTM_IDLE_TIMEOUT_MS })
      : window.setTimeout(fire, GTM_IDLE_TIMEOUT_MS);
    events.forEach((e) => window.addEventListener(e, fire, { once: true, passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, fire));
      if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(handle as number);
      } else {
        window.clearTimeout(handle as number);
      }
    };
  }, []);

  // Overige tracking-scripts uit de CMS-tabel.
  useEffect(() => {
    if (!injected) inject();
  }, [injected, inject]);

  return null;
};

export default TrackingScriptInjector;
