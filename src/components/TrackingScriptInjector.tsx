import { useEffect, useState } from "react";
import { getTrackingScripts, TrackingScript } from "@/lib/api/trackingScripts";

/**
 * Injects active tracking scripts into the document head or body.
 * Runs once on mount; scripts persist for the session.
 */
const TrackingScriptInjector = () => {
  const [injected, setInjected] = useState(false);

  useEffect(() => {
    if (injected) return;

    const inject = async () => {
      try {
        const scripts = await getTrackingScripts(true);
        scripts.forEach((script) => {
          const container = script.position === "body" ? document.body : document.head;

          // Create a wrapper div, set innerHTML, then move child nodes into the container
          const wrapper = document.createElement("div");
          wrapper.innerHTML = script.code;

          // Process all child nodes (script tags need special handling to execute)
          Array.from(wrapper.childNodes).forEach((node) => {
            if (node instanceof HTMLScriptElement) {
              // Script tags inserted via innerHTML don't execute, so re-create them
              const newScript = document.createElement("script");
              // Copy attributes
              Array.from(node.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
              });
              newScript.textContent = node.textContent;
              container.appendChild(newScript);
            } else {
              container.appendChild(node.cloneNode(true));
            }
          });
        });
        setInjected(true);
      } catch (e) {
        console.error("Failed to load tracking scripts:", e);
      }
    };

    inject();
  }, [injected]);

  return null;
};

export default TrackingScriptInjector;
