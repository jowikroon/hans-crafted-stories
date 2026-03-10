// ═══════════════════════════════════════════════════════
//  Samantha — Core types
// ═══════════════════════════════════════════════════════

export type MessageRole = "user" | "samantha" | "system" | "tool";
export type Stage = "idle" | "listening" | "thinking" | "routing" | "executing";
export type Emotion = "calm" | "thinking" | "working" | "speaking" | "error" | "success";
export type ProviderKind = "cloud" | "local" | "agent";
export type ToolExecStatus = "running" | "success" | "error";
export type PanelId = "health" | "workflows" | "audit" | null;

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: string;
  streaming?: boolean;
  toolStatus?: ToolExecStatus;
  toolName?: string;
  toolResult?: ToolResult;
}

export interface AIModel {
  id: string;
  label: string;
  provider: string;
  tag: string;
  kind: ProviderKind;
  color: string;
  description: string;
  suggestions: string[];
}

// ─── Tool Results (discriminated union) ──────────────

export type ToolResult =
  | { type: "health"; services: ServiceHealthEntry[] }
  | { type: "workflow"; workflowName: string; status: ToolExecStatus; message: string }
  | { type: "audit"; entries: AuditEntry[] }
  | { type: "task"; task: TaskRecord }
  | { type: "idea"; idea: TaskRecord }
  | { type: "workflows_list"; workflows: WorkflowInfo[] }
  | { type: "generic"; title: string; content: string };

export interface ServiceHealthEntry {
  name: string;
  ok: boolean;
  latency?: number;
  error?: string;
}

export interface AuditEntry {
  id: string;
  event_type: string;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TaskRecord {
  id: string;
  text: string;
  type: "task" | "idea";
  created_at: number;
  done?: boolean;
}

export interface WorkflowInfo {
  name: string;
  label: string;
  category: string;
  description: string;
}

// ─── Slash Commands ──────────────────────────────────

export interface SlashCommand {
  cmd: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  handler: "run" | "task" | "idea" | "workflows" | "health" | "audit" | "model" | "clear";
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/run", label: "Run Workflow", description: "Trigger an n8n workflow", icon: "Zap", handler: "run" },
  { cmd: "/task", label: "Create Task", description: "Save a task for later", icon: "ListChecks", handler: "task" },
  { cmd: "/idea", label: "Save Idea", description: "Capture an idea", icon: "Lightbulb", handler: "idea" },
  { cmd: "/tasks", label: "View Tasks", description: "Show all tasks & ideas", icon: "ListChecks", handler: "tasks" },
  { cmd: "/done", label: "Complete Task", description: "Mark a task done by number", icon: "CheckCircle", handler: "done" },
  { cmd: "/workflows", label: "List Workflows", description: "Show available workflows", icon: "GitBranch", handler: "workflows" },
  { cmd: "/health", label: "Health Check", description: "Check all services", icon: "HeartPulse", handler: "health" },
  { cmd: "/audit", label: "Audit Log", description: "View recent changes", icon: "ScrollText", handler: "audit" },
  { cmd: "/model", label: "Switch Model", description: "Change AI model", icon: "Brain", handler: "model" },
  { cmd: "/clear", label: "Clear Chat", description: "Clear conversation", icon: "Trash2", handler: "clear" },
];
