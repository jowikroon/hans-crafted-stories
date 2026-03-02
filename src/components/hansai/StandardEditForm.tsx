import { useState, useEffect } from "react";
import { getVoicePersonaByName, saveVoicePersona, type PromptLanguage } from "@/data/voicePersonas";

const PROMPT_LANGUAGES: { value: PromptLanguage; label: string }[] = [
  { value: "", label: "None" },
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "zh", label: "Chinese" },
];

interface StandardEditFormProps {
  personaName: string;
  initialStandard?: string;
  onSave: (name: string, standard: string) => void;
  onCancel: () => void;
}

export default function StandardEditForm({ personaName, initialStandard, onSave, onCancel }: StandardEditFormProps) {
  const [standard, setStandard] = useState(initialStandard ?? "");
  const [promptLanguage, setPromptLanguage] = useState<PromptLanguage>("");

  useEffect(() => {
    const existing = getVoicePersonaByName(personaName);
    setStandard(existing?.standard ?? initialStandard ?? "");
    setPromptLanguage(existing?.promptLanguage ?? "");
  }, [personaName, initialStandard]);

  const handleSave = () => {
    const name = personaName.trim();
    if (!name) return;
    const persona = getVoicePersonaByName(name);
    if (persona) {
      saveVoicePersona({ ...persona, standard: standard.trim(), promptLanguage });
    }
    onSave(name, standard.trim());
  };

  return (
    <div className="my-3 rounded-lg border p-4" style={{ background: "#111111", borderColor: "#00ff8830" }}>
      <div className="mb-3 text-xs font-semibold" style={{ color: "#00ff88" }}>
        Standard (default variables) bewerken — {personaName}
      </div>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>
            Prompt language
          </label>
          <select
            value={promptLanguage}
            onChange={(e) => setPromptLanguage(e.target.value as PromptLanguage)}
            className="w-full rounded border bg-transparent px-2 py-1.5 text-xs outline-none"
            style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}
          >
            {PROMPT_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>
            Standaardvariabelen / default context (wordt altijd meegestuurd met deze voice)
          </label>
          <textarea
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            placeholder="Bijv.: extra context, variabelen, regels"
            rows={4}
            className="w-full resize-y rounded border bg-transparent px-2 py-1.5 text-xs outline-none placeholder:opacity-40"
            style={{ borderColor: "#1e1e1e", color: "#e0e0e0" }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="rounded px-3 py-1.5 text-xs font-medium transition-all"
            style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88" }}
          >
            Opslaan
          </button>
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-xs transition-all"
            style={{ color: "#666" }}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
