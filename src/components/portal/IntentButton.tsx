import { useState } from "react";
import { Compass, Loader2, X, Play } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WORKFLOWS, type WorkflowDef } from "@/lib/config/workflows";
import { runIntentPipeline } from "@/lib/intent/pipeline";

interface IntentResult {
  intent: string;
  confidence: number;
  clarification?: string;
  matchedWorkflow?: WorkflowDef;
}

interface IntentButtonProps {
  currentInput: string;
  currentContext: string | null;
  onResult?: (result: IntentResult) => void;
  /** Called when a workflow is matched and the user confirms execution */
  onExecute?: (wf: WorkflowDef) => void;
}

const IntentButton = ({ currentInput, currentContext, onResult, onExecute }: IntentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);
  const [matchedWorkflow, setMatchedWorkflow] = useState<WorkflowDef | null>(null);

  const handleSubmit = async () => {
    const queryText = currentInput.trim() || goal.trim();
    if (!queryText && !goal.trim()) return;
    const input = goal.trim() || queryText;

    setLoading(true);
    setMatchedWorkflow(null);

    try {
      const pipelineResult = await runIntentPipeline(input, "command_center");
      const { outcome } = pipelineResult;

      if (outcome.type === "workflow_match") {
        const intentResult: IntentResult = {
          intent: outcome.workflow.name,
          confidence: pipelineResult.fastRouteScore >= 0.85 ? pipelineResult.fastRouteScore : 0.85,
          matchedWorkflow: outcome.workflow,
        };
        setResult(intentResult);
        setMatchedWorkflow(outcome.workflow);
        onResult?.(intentResult);
      } else if (outcome.type === "clarify") {
        const intentResult: IntentResult = {
          intent: outcome.workflows[0]?.name || "clarify",
          confidence: pipelineResult.fastRouteScore,
          clarification: outcome.message || "Multiple workflows match — choose one below",
          matchedWorkflow: outcome.workflows[0],
        };
        setResult(intentResult);
        setMatchedWorkflow(outcome.workflows[0] || null);
        onResult?.(intentResult);
      } else {
        setResult({ intent: outcome.type, confidence: pipelineResult.fastRouteScore });
        onResult?.({ intent: outcome.type, confidence: pipelineResult.fastRouteScore });
      }

      setOpen(false);
    } catch {
      setResult({ intent: "error", confidence: 0, clarification: "Connection failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMatched = () => {
    if (matchedWorkflow && onExecute) {
      onExecute(matchedWorkflow);
      setResult(null);
      setMatchedWorkflow(null);
    }
  };

  const clearResult = () => { setResult(null); setMatchedWorkflow(null); };

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
          {matchedWorkflow && onExecute && (
            <button
              onClick={handleExecuteMatched}
              className="ml-0.5 rounded px-0.5 hover:text-emerald-400"
              title={`Run ${matchedWorkflow.label}`}
            >
              <Play size={7} />
            </button>
          )}
          <button onClick={clearResult} className="ml-0.5 hover:text-orange-300">
            <X size={8} />
          </button>
        </Badge>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-400/60 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            title="Route Intent — classify and match to a workflow"
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
              Route intent to a workflow
            </p>
            <p className="text-[9px] text-muted-foreground">
              Type a goal and the pipeline will match or classify it
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

          <div className="p-3">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={currentInput ? `Classifying: "${currentInput.slice(0, 40)}…"` : "Describe your goal to route it"}
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-orange-500/30 focus:outline-none"
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={(!goal.trim() && !currentInput.trim()) || loading}
              className="mt-2 w-full rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-[11px] h-7"
            >
              {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : <Compass size={12} className="mr-1" />}
              Classify &amp; Route
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default IntentButton;
