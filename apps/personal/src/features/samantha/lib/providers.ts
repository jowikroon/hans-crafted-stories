// ═══════════════════════════════════════════════════════
//  AI Provider routing — connects to Supabase Edge Functions
//  Extracted from SamanthaAI.tsx, cleaned up for modularity
// ═══════════════════════════════════════════════════════

import { supabase } from "@/integrations/supabase/client";
import type { ServiceHealthEntry } from "../types";

// ─── Auth + URL helpers ──────────────────────────────

const ANON_KEY = () => import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || ANON_KEY();
}

/** Standard headers for all Supabase Edge Function calls */
async function sbHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY(),
    Authorization: `Bearer ${token}`,
  };
}

const SB_URL = () => import.meta.env.VITE_SUPABASE_URL || "";

export type StreamCallback = (accumulated: string) => void;

// ─── SSE streaming parser ────────────────────────────

export async function streamSSE(res: Response, onChunk: StreamCallback): Promise<string> {
  if (!res.headers.get("content-type")?.includes("text/event-stream")) return "";
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const j = JSON.parse(line.slice(6));
        const delta = j.candidates?.[0]?.content?.parts?.[0]?.text || j.choices?.[0]?.delta?.content || "";
        if (delta) { full += delta; onChunk(full); }
      } catch { /* skip malformed SSE lines */ }
    }
  }
  return full;
}

// ─── Cloud providers (Gemini, GPT, Claude) ───────────

export async function callCloud(
  model: string,
  msgs: { role: string; content: string }[],
  systemPrompt: string,
  onChunk?: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  const url = SB_URL();
  if (!url) throw new Error("Backend not configured — set VITE_SUPABASE_URL.");
  const headers = await sbHeaders();

  const res = await fetch(`${url}/functions/v1/hansai-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...msgs] }),
    signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(
      res.status === 401 ? "Auth failed — try signing out and back in." :
      res.status === 429 ? "Rate limited — wait a moment and try again." :
      res.status >= 500 ? `Server error (${res.status}).` :
      `Error ${res.status}: ${err.slice(0, 120)}`
    );
  }

  if (onChunk) {
    const sse = await streamSSE(res, onChunk);
    if (sse) return sse;
  }

  const data = await res.json();
  return data?.reply || data?.choices?.[0]?.message?.content || data?.response || data?.text || "Empty response.";
}

// ─── Ollama (local LLMs on VPS) ─────────────────────

export async function callOllama(
  modelId: string,
  msgs: { role: string; content: string }[],
  systemPrompt: string,
  onChunk?: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  const model = modelId.replace("ollama/", "");
  const isVps1 = model.includes("llama3.2");
  const url = SB_URL();
  if (!url) throw new Error("Backend not configured.");
  const headers = await sbHeaders();

  const res = await fetch(`${url}/functions/v1/hansai-chat`, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...msgs],
      provider: "ollama",
      ollama_host: isVps1 ? "http://172.20.0.1:11434" : "http://187.124.2.66:11434",
    }),
  });

  if (!res.ok) {
    try {
      const host = isVps1 ? "http://187.124.1.75:11434" : "http://187.124.2.66:11434";
      const r2 = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...msgs], stream: false }),
      });
      if (r2.ok) { const d = await r2.json(); return d?.message?.content || "Empty."; }
    } catch { /* fallback failed */ }
    throw new Error(`Ollama (${model}) is unreachable.`);
  }

  if (onChunk) { const sse = await streamSSE(res, onChunk); if (sse) return sse; }
  const data = await res.json();
  return data?.reply || data?.choices?.[0]?.message?.content || data?.message?.content || "Empty.";
}

// ─── AnythingLLM (RAG) ──────────────────────────────

export async function callAnythingLLM(
  msgs: { role: string; content: string }[],
  systemPrompt: string
): Promise<string> {
  const url = SB_URL();
  const headers = await sbHeaders();

  const res = await fetch(`${url}/functions/v1/hansai-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: "anythingllm", messages: [{ role: "system", content: systemPrompt }, ...msgs], provider: "anythingllm" }),
  });

  if (res.ok) {
    const d = await res.json();
    return d?.reply || d?.textResponse || d?.text || "Empty.";
  }

  try {
    const r2 = await fetch("http://187.124.1.75:3001/api/v1/workspace/default/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msgs[msgs.length - 1]?.content || "", mode: "chat" }),
    });
    if (r2.ok) { const d = await r2.json(); return d?.textResponse || d?.text || "Empty."; }
  } catch { /* fallback failed */ }

  throw new Error("AnythingLLM is unreachable.");
}

// ─── Edge Function Agents ────────────────────────────

export async function callAgent(agentId: string, userMessage: string): Promise<{ text: string; healthData?: ServiceHealthEntry[] }> {
  const url = SB_URL();
  if (!url) throw new Error("Backend not configured.");
  const headers = await sbHeaders();

  const routes: Record<string, string> = {
    "agent/google": `${url}/functions/v1/google-agent`,
    "agent/health": `${url}/functions/v1/empire-health`,
    "agent/seo-audit": `${url}/functions/v1/site-audit`,
  };

  const endpoint = routes[agentId];
  if (!endpoint) throw new Error(`Unknown agent: ${agentId}`);

  const body = agentId === "agent/health" ? {}
    : agentId === "agent/seo-audit" ? { url: userMessage.trim().startsWith("http") ? userMessage.trim() : "https://hansvanleeuwen.com" }
    : { message: userMessage };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Agent returned ${res.status}.`);
  const data = await res.json();

  // Health agent returns structured data
  if (agentId === "agent/health" && data.services) {
    const entries = Object.entries(data.services) as [string, any][];
    const healthData: ServiceHealthEntry[] = entries.map(([name, v]) => ({
      name,
      ok: v.ok,
      latency: v.latency,
      error: v.error,
    }));
    const on = healthData.filter(s => s.ok).length;
    const text = `**Health check complete:** ${on}/${healthData.length} services online.\n\n${healthData.map(s => `${s.ok ? "✅" : "❌"} **${s.name}**${s.latency ? ` (${s.latency}ms)` : ""}`).join("\n")}`;
    return { text, healthData };
  }

  return { text: typeof data === "string" ? data : data?.reply || data?.response || data?.text || JSON.stringify(data).slice(0, 500) };
}

// ─── Health check (direct, for sidebar) ──────────────

export async function fetchHealthStatus(): Promise<ServiceHealthEntry[]> {
  const url = SB_URL();
  if (!url) return [];

  try {
    const headers = await sbHeaders();
    const res = await fetch(`${url}/functions/v1/empire-health`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.services) return [];

    return Object.entries(data.services).map(([name, v]: [string, any]) => ({
      name, ok: v.ok, latency: v.latency, error: v.error,
    }));
  } catch {
    return [];
  }
}

// ─── Unified send — routes to the right provider ────

export async function sendToModel(
  modelId: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onChunk?: StreamCallback,
  signal?: AbortSignal
): Promise<string> {
  if (modelId.startsWith("agent/")) {
    const result = await callAgent(modelId, messages[messages.length - 1]?.content || "");
    return result.text;
  }
  if (modelId.startsWith("ollama/")) {
    return callOllama(modelId, messages, systemPrompt, onChunk, signal);
  }
  if (modelId === "anythingllm") {
    return callAnythingLLM(messages, systemPrompt);
  }
  return callCloud(modelId, messages, systemPrompt, onChunk, signal);
}

// ─── System prompt builder ───────────────────────────

export function buildSystemPrompt(healthContext?: string): string {
  return `You are Samantha — Hans van Leeuwen's AI companion and the primary interface to his entire digital infrastructure.

Personality: warm, perceptive, slightly playful but always competent. Speak naturally — never robotic. Remember context within the conversation. Use markdown for formatting when helpful.

Infrastructure access:
- n8n workflows (AutoSEO, product feeds, campaigns, health checks, scrapers)
- Supabase (20+ tables, auth, edge functions)
- Cloudflare Pages (hansvanleeuwen.com) + Vercel (marketplacegrowth.nl)
- 2 VPS servers (orchestration + AI inference)
- Ollama local models, AnythingLLM (RAG), Qdrant (vectors)
- Claude Code CLI on VPS1

Slash commands available: /run, /task, /idea, /workflows, /health, /audit, /model, /clear

When asked to DO something: route to the right system. When they want to TALK: converse naturally.
Be concise. Be warm. Be useful.${healthContext ? `\n\nCurrent infrastructure status:\n${healthContext}` : ""}`;
}
