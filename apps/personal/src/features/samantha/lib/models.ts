import type { AIModel } from "../types";

export const AI_MODELS: AIModel[] = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tag: "Fast", kind: "cloud", color: "text-white/80", description: "Fast, balanced — default",
    suggestions: ["Summarize this for me", "Help me write an email", "Explain how SEO works", "Generate product descriptions"] },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tag: "Powerful", kind: "cloud", color: "text-white/80", description: "Stronger reasoning",
    suggestions: ["Analyze my business strategy", "Compare Amazon vs Bol.com approach", "Design a content pipeline", "Review my architecture"] },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google", tag: "Preview", kind: "cloud", color: "text-white/70", description: "Latest preview",
    suggestions: ["Test the latest model", "How are you different from 2.5?", "Solve a complex problem", "Analyze this data"] },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tag: "Compact", kind: "cloud", color: "text-white/80", description: "Fast OpenAI model",
    suggestions: ["Quick translation to Dutch", "Format this as JSON", "Fix this code snippet", "Write a short ad copy"] },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tag: "Smart", kind: "cloud", color: "text-white/80", description: "Strong all-rounder",
    suggestions: ["Debug this workflow logic", "Write a technical spec", "Analyze competitor strategy", "Create a marketing plan"] },
  { id: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", tag: "Premium", kind: "cloud", color: "text-white/90", description: "Excellent reasoning",
    suggestions: ["Review my code architecture", "Write documentation", "Analyze a complex problem", "Help me think through this"] },
  { id: "ollama/qwen2.5:7b", label: "Qwen 2.5 7B", provider: "Ollama VPS2", tag: "Local", kind: "local", color: "text-white/70", description: "7B — fast, no API cost",
    suggestions: ["Quick classification task", "Summarize this text", "What models are loaded?", "Test local inference speed"] },
  { id: "ollama/qwen2.5:14b", label: "Qwen 2.5 14B", provider: "Ollama VPS2", tag: "Local", kind: "local", color: "text-white/70", description: "14B — better reasoning",
    suggestions: ["Reason through this problem", "Generate a detailed analysis", "Compare two approaches", "Write a complex prompt"] },
  { id: "ollama/llama3.2:1b", label: "Llama 3.2 1B", provider: "Ollama VPS1", tag: "Tiny", kind: "local", color: "text-white/60", description: "1B — ultra-fast",
    suggestions: ["Classify this text", "Extract keywords", "Simple yes/no question", "Quick sentiment check"] },
  { id: "anythingllm", label: "AnythingLLM", provider: "VPS1 RAG", tag: "RAG", kind: "local", color: "text-white/70", description: "Grounded in your docs",
    suggestions: ["Search my documents", "What do my docs say about X?", "Find relevant information", "Answer from my knowledge base"] },
  { id: "agent/google", label: "Google Agent", provider: "Edge Function", tag: "Agent", kind: "agent", color: "text-white/70", description: "Gmail, Sheets, Drive",
    suggestions: ["Summarize my latest emails", "What's in my inbox?", "Add a row to my sheet", "List my Drive files"] },
  { id: "agent/health", label: "Health Check", provider: "Edge Function", tag: "Agent", kind: "agent", color: "text-white/70", description: "Infrastructure status",
    suggestions: ["Check all services", "Is everything online?", "System status report", "Any issues?"] },
  { id: "agent/seo-audit", label: "SEO Audit", provider: "Edge Function", tag: "Agent", kind: "agent", color: "text-white/70", description: "On-page SEO analysis",
    suggestions: ["Audit hansvanleeuwen.com", "Check my SEO score", "Find SEO issues", "Audit https://example.com"] },
];

export const MODEL_KEY = "samantha_model";
export const HISTORY_KEY = "samantha_conversation";
export const VOICE_KEY = "samantha_voice_enabled";
export const TASKS_KEY = "samantha_tasks";
