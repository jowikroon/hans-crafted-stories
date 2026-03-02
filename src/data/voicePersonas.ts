/**
 * Voice personas: per-name AI style (tone, how to act) for Command Center terminal.
 * Stored in localStorage; active voice is not persisted (resets on page leave).
 */

const STORAGE_KEY = "hansai_voice_personas";

export type PromptLanguage = "" | "en" | "nl" | "zh";

export interface VoicePersona {
  id: string;
  name: string;
  style: string;
  /** Default variables/context for this voice (e.g. "language is chinese"). Only admin can edit. */
  standard?: string;
  /** Prompt/response language override ("en" | "nl" | "zh" | "" for none). */
  promptLanguage?: PromptLanguage;
  createdAt?: number;
  updatedAt?: number;
}

function nameToId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function loadPersonas(): VoicePersona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is VoicePersona =>
        p &&
        typeof p === "object" &&
        typeof (p as VoicePersona).id === "string" &&
        typeof (p as VoicePersona).name === "string" &&
        typeof (p as VoicePersona).style === "string"
    );
  } catch {
    return [];
  }
}

function savePersonas(personas: VoicePersona[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
  } catch {
    // quota or disabled
  }
}

export function getVoicePersonas(): VoicePersona[] {
  return loadPersonas();
}

export function getVoicePersonaByName(name: string): VoicePersona | null {
  const id = nameToId(name);
  return loadPersonas().find((p) => p.id === id || p.name.toLowerCase() === name.toLowerCase().trim()) ?? null;
}

export function saveVoicePersona(persona: VoicePersona): void {
  const list = loadPersonas();
  const id = persona.id || nameToId(persona.name);
  const idx = list.findIndex((p) => p.id === id || p.name.toLowerCase() === persona.name.trim().toLowerCase());
  const now = Date.now();
  const existingStandard = idx >= 0 ? list[idx].standard : undefined;
  const existingPromptLang = idx >= 0 ? list[idx].promptLanguage : undefined;
  const withMeta: VoicePersona = {
    ...persona,
    id,
    name: persona.name.trim(),
    style: persona.style.trim(),
    standard: persona.standard !== undefined ? (typeof persona.standard === "string" ? persona.standard.trim() : undefined) : existingStandard,
    promptLanguage: persona.promptLanguage !== undefined ? persona.promptLanguage : existingPromptLang,
    updatedAt: now,
    createdAt: persona.createdAt ?? now,
  };
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...withMeta };
  } else {
    list.push(withMeta);
  }
  savePersonas(list);
}

export function deleteVoicePersona(id: string): void {
  const list = loadPersonas().filter((p) => p.id !== id);
  savePersonas(list);
}

/** Create a new persona placeholder (e.g. for /voices/michelle/edit when michelle does not exist yet). */
export function createPlaceholderPersona(name: string): VoicePersona {
  const trimmed = name.trim();
  const id = nameToId(trimmed);
  return {
    id,
    name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase(),
    style: "",
    standard: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
