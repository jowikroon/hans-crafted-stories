/**
 * Client helpers for creating n8n workflows via the n8n-create-workflow edge function.
 * Extracts workflow JSON from AI reply (e.g. markdown code blocks) and POSTs to the backend.
 */

const CREATE_WORKFLOW_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-create-workflow`;

export interface CreateWorkflowResult {
  success: boolean;
  id?: string | null;
  name?: string;
  url?: string;
  error?: string;
}

/** Minimal n8n workflow shape for validation */
export interface N8nWorkflowPayload {
  name?: string;
  nodes?: unknown[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Extract the first valid n8n workflow-like JSON from markdown text.
 * Looks for ```json ... ``` or ``` ... ``` and parses; validates nodes array or name.
 */
export function extractWorkflowJsonFromMarkdown(text: string): N8nWorkflowPayload | null {
  if (!text || typeof text !== "string") return null;

  // Match ```json ... ``` or ``` ... ``` (with optional language tag)
  const blocks = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);
  for (const [, code] of blocks) {
    const trimmed = code.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed === null || typeof parsed !== "object") continue;
      const obj = parsed as Record<string, unknown>;
      // n8n workflow: at least nodes (array) or name (string)
      if (Array.isArray(obj.nodes) || (typeof obj.name === "string" && obj.name.length > 0)) {
        return obj as N8nWorkflowPayload;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Create a workflow in n8n via the edge function.
 * Uses N8N_API_KEY and N8N_BASE_URL on the server only.
 */
export async function createWorkflowInN8n(
  payload: N8nWorkflowPayload,
  accessToken: string,
): Promise<CreateWorkflowResult> {
  try {
    const res = await fetch(CREATE_WORKFLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data.error || res.statusText || `HTTP ${res.status}`,
      };
    }

    return {
      success: data.success === true,
      id: data.id ?? null,
      name: data.name,
      url: data.url,
      error: data.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}
