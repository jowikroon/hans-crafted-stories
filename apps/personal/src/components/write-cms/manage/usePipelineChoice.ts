import { useState } from "react";

/**
 * Pipeline choice for the Ghost-write button: classic (the 4-stage modal /
 * memory-verify flow) vs auto (POST straight to the Auto-pipeline webhook —
 * Opus + gates + kwaliteitspoort, dry-run).
 *
 * Persisted in localStorage so Hans's choice survives reloads. SSR-safe.
 */
export type Pipeline = "classic" | "auto";

const KEY = "hvl_cms_pipeline";

function read(): Pipeline {
  if (typeof window === "undefined") return "classic";
  const v = window.localStorage.getItem(KEY);
  return v === "auto" ? "auto" : "classic";
}

export function usePipelineChoice() {
  const [pipeline, setPipelineState] = useState<Pipeline>(read);

  const setPipeline = (p: Pipeline) => {
    setPipelineState(p);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(KEY, p);
      } catch {
        /* storage may be unavailable (private mode); choice still lives in state */
      }
    }
  };

  return { pipeline, setPipeline };
}
