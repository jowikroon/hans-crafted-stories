import { useEffect, useState, useCallback } from "react";
import { getTrackingScripts, TrackingScript } from "@/lib/api/trackingScripts";

const DEFER_TYPES = new Set(["hotjar", "linkedin", "meta_pixel", "custom"]);

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
      const scripts = await getTrackingScripts(true);
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

  useEffect(() => {
    if (!injected) inject();
  }, [injected, inject]);

  return null;
};

export default TrackingScriptInjector;
