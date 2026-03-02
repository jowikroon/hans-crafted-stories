import { useState, useEffect } from "react";
import { getVoicePersonaByName, saveVoicePersona } from "@/data/voicePersonas";

interface VoiceEditFormProps {
  personaName: string;
  initialStyle?: string;
  onSave: (name: string, style: string) => void;
  onCancel: () => void;
}

export default function VoiceEditForm({ personaName, initialStyle, onSave, onCancel }: VoiceEditFormProps) {
  const [style, setStyle] = useState(initialStyle ?? "");

  useEffect(() => {
    const existing = getVoicePersonaByName(personaName);
    setStyle(existing?.style ?? initialStyle ?? "");
  }, [personaName, initialStyle]);

  const handleSave = () => {
    const name = personaName.trim();
    if (!name) return;
    saveVoicePersona({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      style: style.trim(),
      updatedAt: Date.now(),
    });
    onSave(name, style.trim());
  };

  return (
    <div className="my-3 rounded-lg border p-4" style={{ background: "#111111", borderColor: "#00ff8830" }}>
      <div className="mb-3 text-xs font-semibold" style={{ color: "#00ff88" }}>
        Voice bewerken
      </div>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>
            Naam
          </label>
          <input
            type="text"
            value={personaName}
            readOnly
            disabled
            className="w-full rounded border bg-black/30 px-2 py-1.5 text-xs text-gray-500 outline-none"
            style={{ borderColor: "#1e1e1e" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: "#666" }}>
            Stijl (tone, how to act, style, preferred commands — wordt aan de AI doorgegeven)
          </label>
          <textarea
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Bijv.: Antwoord altijd in het Nederlands. Wees bondig en vriendelijk. Noem jezelf [Naam] AI."
            rows={6}
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
