import { Globe } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const PortalLangToggle = () => {
  const { lang, setLang } = useLang();

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      <Globe size={12} className="text-muted-foreground/50 mr-1" />
      <button
        onClick={() => setLang("nl")}
        className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
          lang === "nl"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/50 hover:text-foreground"
        }`}
      >
        NL
      </button>
      <button
        onClick={() => setLang("en")}
        className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
          lang === "en"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/50 hover:text-foreground"
        }`}
      >
        ENG
      </button>
    </div>
  );
};

export default PortalLangToggle;
