// ═══════════════════════════════════════════════════════
//  Samantha Zustand Store — 5 slices, single bound store
// ═══════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message, Stage, Emotion, PanelId, TaskRecord, ToolExecStatus } from "../types";
import { AI_MODELS, MODEL_KEY, TASKS_KEY } from "../lib/models";

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Chat Slice ──────────────────────────────────────

interface ChatSlice {
  messages: Message[];
  stage: Stage;
  emotion: Emotion;
  streamingId: string | null;
  append: (msg: Omit<Message, "id" | "timestamp">) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setStage: (s: Stage) => void;
  setEmotion: (e: Emotion) => void;
  setStreamingId: (id: string | null) => void;
  clearMessages: () => void;
}

// ─── Model Slice ─────────────────────────────────────

interface ModelSlice {
  selectedModel: string;
  setModel: (id: string) => void;
}

// ─── UI Slice ────────────────────────────────────────

interface UISlice {
  panel: PanelId;
  setPanel: (p: PanelId) => void;
  slashOpen: boolean;
  setSlashOpen: (v: boolean) => void;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  globalOpen: boolean;
  setGlobalOpen: (v: boolean) => void;
}

// ─── Voice Slice ─────────────────────────────────────

interface VoiceSlice {
  voiceEnabled: boolean;
  listening: boolean;
  speaking: boolean;
  toggleVoice: () => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
}

// ─── Tool Slice ──────────────────────────────────────

interface ToolSlice {
  tasks: TaskRecord[];
  addTask: (text: string, type: "task" | "idea") => TaskRecord;
  toggleTask: (id: string) => void;
  clearTasks: () => void;
}

// ─── Combined Store ──────────────────────────────────

export type SamanthaStore = ChatSlice & ModelSlice & UISlice & VoiceSlice & ToolSlice;

export const useSamanthaStore = create<SamanthaStore>()(
  persist(
    (set, get) => ({
      // ── Chat ──
      messages: [],
      stage: "idle",
      emotion: "calm",
      streamingId: null,

      append: (msg) => {
        const m: Message = { ...msg, id: uid(), timestamp: Date.now() };
        set((s) => ({ messages: [...s.messages, m] }));
        return m;
      },
      updateMessage: (id, updates) => {
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)) }));
      },
      setStage: (stage) => set({ stage }),
      setEmotion: (emotion) => set({ emotion }),
      setStreamingId: (streamingId) => set({ streamingId }),
      clearMessages: () => set({ messages: [], streamingId: null }),

      // ── Model ──
      selectedModel: AI_MODELS[0].id,
      setModel: (selectedModel) => set({ selectedModel }),

      // ── UI ──
      panel: null,
      setPanel: (panel) => set({ panel }),
      slashOpen: false,
      setSlashOpen: (slashOpen) => set({ slashOpen }),
      pickerOpen: false,
      setPickerOpen: (pickerOpen) => set({ pickerOpen }),
      globalOpen: false,
      setGlobalOpen: (globalOpen) => set({ globalOpen }),

      // ── Voice ──
      voiceEnabled: false,
      listening: false,
      speaking: false,
      toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
      setListening: (listening) => set({ listening }),
      setSpeaking: (speaking) => set({ speaking }),

      // ── Tasks ──
      tasks: [],
      addTask: (text, type) => {
        const t: TaskRecord = { id: uid(), text, type, created_at: Date.now() };
        set((s) => ({ tasks: [...s.tasks, t] }));
        return t;
      },
      toggleTask: (id) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
      },
      clearTasks: () => set({ tasks: [] }),
    }),
    {
      name: "samantha-store",
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        voiceEnabled: state.voiceEnabled,
        tasks: state.tasks,
        messages: state.messages.filter((m) => !m.streaming).slice(-60),
      }),
    }
  )
);
