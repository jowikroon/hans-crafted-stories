import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, X } from "lucide-react";
import { useMediaPicker } from "./MediaPickerContext";

// ═══════════════════════════════════════════════════════════
//  ImageUrlField — reusable image URL input with media library button
//
//  Usage:
//    <ImageUrlField
//      label="OG Image"
//      value={ogImage}
//      onChange={setOgImage}
//      placeholder="Select from library or paste URL"
//    />
// ═══════════════════════════════════════════════════════════

interface Props {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  hint?: string;
  /** Show a small preview thumbnail */
  showPreview?: boolean;
  className?: string;
}

export default function ImageUrlField({
  label,
  value,
  onChange,
  placeholder = "Select from library or paste URL…",
  hint,
  showPreview = true,
  className = "",
}: Props) {
  const { pickImage } = useMediaPicker();

  const handlePick = async () => {
    const url = await pickImage();
    if (url) onChange(url);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs font-medium text-muted-foreground/60 mb-1.5 block">{label}</Label>
      )}
      <div className="flex gap-2">
        {showPreview && value && (
          <div className="relative shrink-0 h-9 w-14 rounded-md border border-border/50 overflow-hidden bg-secondary/20">
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X size={8} />
            </button>
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-xs h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-2.5 gap-1.5 shrink-0"
          onClick={handlePick}
        >
          <ImageIcon size={13} />
          <span className="text-[11px]">Library</span>
        </Button>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/40 mt-1">{hint}</p>}
    </div>
  );
}
