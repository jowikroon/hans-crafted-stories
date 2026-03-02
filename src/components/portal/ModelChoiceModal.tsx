import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Code2, Sparkles, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ModelChoiceModalProps {
  open: boolean;
  onClose: () => void;
  llmJobId: string;
  system: string;
  messages: Array<{ role: string; content: string }>;
  onResume: (reply: string) => void;
  onCancel: () => void;
}

const ModelChoiceModal = ({
  open,
  onClose,
  llmJobId,
  system,
  messages,
  onResume,
  onCancel,
}: ModelChoiceModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleChoice = async (selectedModel: "codex" | "openai") => {
    setLoading(selectedModel);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const user = sessionData?.session?.user;
      if (!token || !user) {
        onCancel();
        return;
      }

      await (supabase as any).from("approvals").insert({
        llm_job_id: llmJobId,
        type: "model_switch",
        payload: { selected_model: selectedModel },
        approved_by: user.id,
        status: "approved",
      });

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ llm_job_id: llmJobId, system, messages }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        onResume(data.reply);
        onClose();
      } else {
        onResume(`Fallback failed: ${data.error || res.statusText}`);
        onClose();
      }
    } catch (err) {
      onResume(`Connection error: ${err instanceof Error ? err.message : "Unknown"}`);
      onClose();
    } finally {
      setLoading(null);
    }
  };

  const handleStop = async () => {
    setLoading("stop");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        await (supabase as any)
          .from("llm_jobs")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", llmJobId)
          .eq("user_id", user.id);
      }
      onCancel();
      onClose();
    } catch {
      onCancel();
      onClose();
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Model choice required</h3>
              <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
              The primary model is currently unavailable (credits/limit). Continue with a fallback model?
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-orange-500/20"
                onClick={() => handleChoice("codex")}
                disabled={!!loading}
              >
                {loading === "codex" ? <Loader2 size={14} className="animate-spin" /> : <Code2 size={14} />}
                Continue with Codex (best for code/patches)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-orange-500/20"
                onClick={() => handleChoice("openai")}
                disabled={!!loading}
              >
                {loading === "openai" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Continue with OpenAI (best for analysis/spec)
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleStop}
                disabled={!!loading}
              >
                {loading === "stop" ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
                Stop and save draft
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModelChoiceModal;
