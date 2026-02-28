import { useState } from "react";
import { Compass, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { WORKFLOWS } from "@/lib/config/workflows";

interface IntentResult {
  intent: string;
  confidence: number;
  clarification?: string;
}

interface IntentButtonProps {
  currentInput: string;
  currentContext: string | null;
  onResult?: (result: IntentResult) => void;
}

const IntentButton = ({ currentInput, currentContext, onResult }: IntentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intent-router`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          input: currentInput || goal,
          goal,
          context: currentContext,
        }),
      });

      const data = await res.json();
      const intentResult: IntentResult = {
        intent: data.intent || data.workflow || "unknown",
        confidence: data.confidence || 0,
        clarification: data.clarification,
      };
      setResult(intentResult);
      onResult?.(intentResult);
      setOpen(false);
    } catch {
      setResult({ intent: "error", confidence: 0, clarification: "Connection failed" });
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return (
    <div className="flex items-center gap-1.5">
      {result && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-orange-500/30 bg-orange-500/10 text-orange-400 text-[9px] font-mono animate-in fade-in-0 zoom-in-95"
        >
          <span className="uppercase">{result.intent}</span>
          <span className="text-orange-400/50">
            {Math.round(result.confidence * 100)}%
          </span>
          <button onClick={clearResult} className="ml-0.5 hover:text-orange-300">
            <X size={8} />
          </button>
        </Badge>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-400/60 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            title="Intent Router — Wat is het doel?"
          >
            <Compass size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-72 border-orange-500/20 bg-card p-0"
        >
          <div className="border-b border-orange-500/10 px-3 py-2">
            <p className="text-[11px] font-semibold text-foreground">
              Wat is het doel van je prompt?
            </p>
            <p className="text-[9px] text-muted-foreground">
              Dit wordt naar de intent router gestuurd
            </p>
          </div>

          {/* Quick workflow picks */}
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-orange-500/10">
            {WORKFLOWS.map((wf) => (
              <button
                key={wf.name}
                onClick={() => setGoal(wf.label)}
                className={`rounded-full border px-2 py-0.5 text-[9px] font-medium transition-all ${
                  goal === wf.label
                    ? "border-orange-400/40 bg-orange-500/10 text-orange-300"
                    : "border-orange-500/10 text-orange-400/40 hover:border-orange-500/25 hover:text-orange-300"
                }`}
              >
                {wf.label}
              </button>
            ))}
          </div>

          {/* Free text */}
          <div className="p-3">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Bijv. 'optimaliseer product titels' of 'check systeem status'"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-orange-500/30 focus:outline-none"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!goal.trim() || loading}
              className="mt-2 w-full rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-[11px] h-7"
            >
              {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Compass size={12} className="mr-1" />}
              Route Intent
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default IntentButton;
