import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";

export interface AttributeEntry {
  id?: string;
  key: string;
  value: string;
}

interface AttributeEditorProps {
  attributes: AttributeEntry[];
  onChange: (attrs: AttributeEntry[]) => void;
  /** If provided, attribute changes are persisted immediately via these callbacks */
  onAdd?: (key: string, value: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, value: string) => Promise<void>;
}

const AttributeEditor = ({ attributes, onChange, onAdd, onDelete, onUpdate }: AttributeEditorProps) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k || !v) return;
    if (attributes.some((a) => a.key.toLowerCase() === k.toLowerCase())) return;

    if (onAdd) {
      setAdding(true);
      try {
        await onAdd(k, v);
      } finally {
        setAdding(false);
      }
    } else {
      onChange([...attributes, { key: k, value: v }]);
    }
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = async (index: number) => {
    const attr = attributes[index];
    if (onDelete && attr.id) {
      setDeletingId(attr.id);
      try {
        await onDelete(attr.id);
      } finally {
        setDeletingId(null);
      }
    } else {
      onChange(attributes.filter((_, i) => i !== index));
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], value };
    onChange(updated);
  };

  const handleValueBlur = async (index: number) => {
    const attr = attributes[index];
    if (onUpdate && attr.id) {
      await onUpdate(attr.id, attr.value);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Attributes</Label>

      {attributes.length > 0 && (
        <div className="space-y-2">
          {attributes.map((attr, i) => (
            <div key={attr.id || i} className="flex items-center gap-2">
              <span className="min-w-[80px] shrink-0 text-xs font-medium text-muted-foreground">{attr.key}</span>
              <Input
                value={attr.value}
                onChange={(e) => handleValueChange(i, e.target.value)}
                onBlur={() => handleValueBlur(i)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(i)}
                disabled={deletingId === attr.id}
              >
                {deletingId === attr.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-8 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleAdd}
          disabled={adding || !newKey.trim() || !newValue.trim()}
        >
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </Button>
      </div>
    </div>
  );
};

export default AttributeEditor;
