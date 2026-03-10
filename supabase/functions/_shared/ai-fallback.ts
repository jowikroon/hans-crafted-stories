/**
 * AI Provider Fallback — cascading provider chain.
 *
 * Order: Gemini Direct → Lovable Gateway → Anthropic Direct
 *
 * Each provider is tried in order. On failure (network, 5xx, 429),
 * the next provider is attempted. On 4xx (bad request), we fail immediately
 * since retrying with a different provider won't fix a malformed request.
 *
 * For streaming endpoints: returns the first successful Response (caller handles SSE).
 * For non-streaming (intent classification): returns parsed JSON.
 */

// ─── Types ───────────────────────────────────────────

export interface CompletionRequest {
  system: string;
  messages: { role: string; content: string }[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface ProviderResult {
  ok: boolean;
  response?: Response;
  text?: string;
  error?: string;
  provider: string;
}

// ─── Gemini Direct ───────────────────────────────────

async function tryGemini(req: CompletionRequest): Promise<ProviderResult> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return { ok: false, error: "GEMINI_API_KEY not set", provider: "gemini" };

  const modelRaw = req.model?.replace(/^google\//, "") || "gemini-2.5-flash";
  const model = modelRaw.startsWith("gemini-") ? modelRaw : "gemini-2.5-flash";

  const contents = req.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: typeof m.content === "string" ? m.content : "" }],
    }));

  const endpoint = req.stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${encodeURIComponent(key)}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: contents.length ? contents : [{ role: "user", parts: [{ text: "" }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 8192,
          ...(req.temperature != null ? { temperature: req.temperature } : {}),
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[fallback] Gemini ${res.status}: ${errText.slice(0, 200)}`);
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { ok: false, error: `Gemini client error ${res.status}`, provider: "gemini" };
      }
      return { ok: false, error: `Gemini ${res.status}`, provider: "gemini" };
    }

    if (req.stream) {
      return { ok: true, response: res, provider: "gemini" };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { ok: true, text, provider: "gemini" };
  } catch (e) {
    console.warn("[fallback] Gemini network error:", (e as Error).message);
    return { ok: false, error: (e as Error).message, provider: "gemini" };
  }
}

// ─── Lovable Gateway ─────────────────────────────────

async function tryLovable(req: CompletionRequest): Promise<ProviderResult> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: false, error: "LOVABLE_API_KEY not set", provider: "lovable" };

  const model = req.model || "google/gemini-2.5-flash";

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: req.system }, ...req.messages],
        max_tokens: req.maxTokens ?? 8192,
        ...(req.temperature != null ? { temperature: req.temperature } : {}),
        stream: req.stream ?? false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[fallback] Lovable ${res.status}: ${errText.slice(0, 200)}`);
      return { ok: false, error: `Lovable ${res.status}`, provider: "lovable" };
    }

    if (req.stream) {
      return { ok: true, response: res, provider: "lovable" };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { ok: true, text, provider: "lovable" };
  } catch (e) {
    console.warn("[fallback] Lovable network error:", (e as Error).message);
    return { ok: false, error: (e as Error).message, provider: "lovable" };
  }
}

// ─── Anthropic Direct ────────────────────────────────

async function tryAnthropic(req: CompletionRequest): Promise<ProviderResult> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return { ok: false, error: "ANTHROPIC_API_KEY not set", provider: "anthropic" };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: req.maxTokens ?? 4096,
        system: req.system,
        messages: req.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        ...(req.stream ? { stream: true } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[fallback] Anthropic ${res.status}: ${errText.slice(0, 200)}`);
      return { ok: false, error: `Anthropic ${res.status}`, provider: "anthropic" };
    }

    if (req.stream) {
      return { ok: true, response: res, provider: "anthropic" };
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    return { ok: true, text, provider: "anthropic" };
  } catch (e) {
    console.warn("[fallback] Anthropic network error:", (e as Error).message);
    return { ok: false, error: (e as Error).message, provider: "anthropic" };
  }
}

// ─── Public API ──────────────────────────────────────

/**
 * Try providers in order: Gemini → Lovable → Anthropic.
 * Returns the first successful result.
 * For streaming, the caller must handle the raw Response.
 */
export async function completionWithFallback(req: CompletionRequest): Promise<ProviderResult> {
  const chain = [tryGemini, tryLovable, tryAnthropic];
  const errors: string[] = [];

  for (const tryProvider of chain) {
    const result = await tryProvider(req);
    if (result.ok) {
      if (errors.length > 0) {
        console.log(`[fallback] Succeeded with ${result.provider} after ${errors.length} failure(s): ${errors.join(", ")}`);
      }
      return result;
    }
    errors.push(`${result.provider}: ${result.error}`);
  }

  return {
    ok: false,
    error: `All providers failed: ${errors.join(" | ")}`,
    provider: "none",
  };
}

/**
 * Non-streaming completion — returns plain text.
 * Convenience wrapper around completionWithFallback.
 */
export async function textCompletion(req: Omit<CompletionRequest, "stream">): Promise<{ text: string; provider: string; error?: string }> {
  const result = await completionWithFallback({ ...req, stream: false });
  if (!result.ok) {
    return { text: "", provider: "none", error: result.error };
  }
  return { text: result.text ?? "", provider: result.provider };
}
