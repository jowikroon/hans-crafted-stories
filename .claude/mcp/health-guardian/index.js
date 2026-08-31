#!/usr/bin/env node
/**
 * Health Guardian — Agent #4 (MCP Server)
 * Monitors all 7 layers of the Sovereign AI Spine.
 * Polls health endpoints, logs incidents to Supabase, triggers alerts.
 *
 * Registratie: .mcp.json in de repo-root (reist mee met git clone).
 * Dependencies: npm run mcp:setup — controleren met npm run mcp:audit.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const N8N_URL     = process.env.VITE_N8N_PROD_URL    || "https://n8n.srv1402218.hstgr.cloud";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL   || "https://oejeojzaakfhculcoqdh.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

// Local tunnel endpoints (SSH tunnels must be open via SSH Sentinel first)
const ENDPOINTS = {
  // Layer 1 — Shield (Cloudflare)
  cloudflare: { url: "https://hansvanleeuwen.com", layer: 1, name: "Cloudflare / hansvanleeuwen.com" },

  // Layer 2 — Portal (React dashboard)
  portal: { url: "https://hansvanleeuwen.com/empire", layer: 2, name: "Empire Portal" },

  // Layer 3 — Brain (n8n)
  n8n: { url: `${N8N_URL}/healthz`, layer: 3, name: "n8n Orchestration" },

  // Layer 5 — Senses (local tunnel services)
  ollama:      { url: "http://localhost:11434/api/tags",  layer: 5, name: "Ollama LLM" },
  qdrant:      { url: "http://localhost:6333/health",     layer: 5, name: "Qdrant Vector DB" },
  anythingllm: { url: "http://localhost:3001",            layer: 5, name: "AnythingLLM RAG" },

  // Layer 6 — Memory (Supabase)
  supabase: { url: `${SUPABASE_URL}/rest/v1/`, layer: 6, name: "Supabase Memory" },
};

// ─── Health Check Helpers ────────────────────────────────────────────────────
async function checkEndpoint(key) {
  const cfg = ENDPOINTS[key];
  const start = Date.now();
  try {
    const headers = {};
    if (key === "supabase" && SUPABASE_KEY) {
      headers["apikey"] = SUPABASE_KEY;
      headers["Authorization"] = `Bearer ${SUPABASE_KEY}`;
    }
    const res = await fetch(cfg.url, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    return {
      key,
      name: cfg.name,
      layer: cfg.layer,
      ok: res.ok,
      status: res.status,
      latency_ms: latency,
    };
  } catch (e) {
    return {
      key,
      name: cfg.name,
      layer: cfg.layer,
      ok: false,
      error: e.message,
      latency_ms: Date.now() - start,
    };
  }
}

async function checkAllLayers() {
  const results = await Promise.all(Object.keys(ENDPOINTS).map(checkEndpoint));
  const healthy = results.filter((r) => r.ok).length;
  const total = results.length;
  const score = Math.round((healthy / total) * 100);

  return {
    score,
    healthy,
    total,
    status: score === 100 ? "PERFECT" : score >= 80 ? "GOOD" : score >= 60 ? "DEGRADED" : "CRITICAL",
    layers: results,
    checked_at: new Date().toISOString(),
  };
}

async function checkSingleLayer(key) {
  if (!ENDPOINTS[key]) {
    return { error: `Unknown endpoint: ${key}. Available: ${Object.keys(ENDPOINTS).join(", ")}` };
  }
  return checkEndpoint(key);
}

// ─── Supabase Logging ────────────────────────────────────────────────────────
async function logToSupabase(eventType, payload) {
  if (!SUPABASE_KEY) return { ok: false, error: "SUPABASE_KEY not set" };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/empire_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ event_type: eventType, payload }),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Alert Helpers ───────────────────────────────────────────────────────────
async function triggerAlert(payload) {
  try {
    const res = await fetch(`${N8N_URL}/webhook/vps-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "health-guardian-mcp", ...payload }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── Status Report Formatter ─────────────────────────────────────────────────
function formatStatusReport(health) {
  const icon = (ok) => (ok ? "✅" : "❌");
  const layerName = (n) =>
    ({ 1: "Shield", 2: "Portal", 3: "Brain", 4: "Muscle", 5: "Senses", 6: "Memory", 7: "Immune" }[n] || `Layer ${n}`);

  const lines = health.layers.map(
    (l) => `║ [L${l.layer}] ${layerName(l.layer).padEnd(7)} ${l.name.padEnd(22)} ${icon(l.ok)} ${l.ok ? `${l.latency_ms}ms` : (l.error || `HTTP ${l.status}`).slice(0, 20)}`
  );

  return [
    "╔══════════════════════════════════════════════════╗",
    `║     HEALTH GUARDIAN — EMPIRE STATUS REPORT      ║`,
    `╠══════════════════════════════════════════════════╣`,
    `║ Overall: ${health.status.padEnd(10)} Score: ${health.score}% (${health.healthy}/${health.total})  ║`,
    `╠══════════════════════════════════════════════════╣`,
    ...lines.map((l) => l + " ║"),
    `╠══════════════════════════════════════════════════╣`,
    `║ Checked: ${health.checked_at.slice(0, 19).replace("T", " ")}               ║`,
    "╚══════════════════════════════════════════════════╝",
  ].join("\n");
}

// ─── MCP Server ──────────────────────────────────────────────────────────────
const server = new Server(
  { name: "health-guardian", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health_check_all",
      description: "Check health of all 7 layers of the Sovereign AI Spine",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "health_check_layer",
      description: "Check health of a specific service/endpoint",
      inputSchema: {
        type: "object",
        required: ["key"],
        properties: {
          key: {
            type: "string",
            enum: Object.keys(ENDPOINTS),
            description: "Service key to check",
          },
        },
      },
    },
    {
      name: "health_report",
      description: "Get a formatted visual status report of all empire layers",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "log_event",
      description: "Log an infrastructure event to Supabase empire_events table",
      inputSchema: {
        type: "object",
        required: ["event_type", "payload"],
        properties: {
          event_type: { type: "string", description: "Event type (e.g. health-check, ssh-sentinel-run, deploy)" },
          payload: { type: "object", description: "JSON payload to store" },
        },
      },
    },
    {
      name: "trigger_alert",
      description: "Send a VPS alert via n8n webhook (e.g. when a layer is CRITICAL)",
      inputSchema: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", description: "Alert message" },
          severity: { type: "string", enum: ["warning", "critical"], description: "Alert severity" },
          layer: { type: "number", description: "Layer number (1-7) affected" },
        },
      },
    },
    {
      name: "list_endpoints",
      description: "List all monitored endpoints with their layer assignments",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "health_run_and_log",
      description: "Run full health check, log results to Supabase, and alert if critical — the standard monitoring cycle",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "health_check_all": {
      const health = await checkAllLayers();
      return { content: [{ type: "text", text: JSON.stringify(health, null, 2) }] };
    }

    case "health_check_layer": {
      const result = await checkSingleLayer(args.key);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "health_report": {
      const health = await checkAllLayers();
      const report = formatStatusReport(health);
      return { content: [{ type: "text", text: report }] };
    }

    case "log_event": {
      const result = await logToSupabase(args.event_type, args.payload);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "trigger_alert": {
      const result = await triggerAlert({
        message: args.message,
        severity: args.severity || "warning",
        layer: args.layer,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "list_endpoints":
      return {
        content: [{
          type: "text",
          text: JSON.stringify(
            Object.entries(ENDPOINTS).map(([k, v]) => ({
              key: k,
              name: v.name,
              layer: v.layer,
              url: v.url,
            })),
            null, 2
          ),
        }],
      };

    case "health_run_and_log": {
      // 1. Run full health check
      const health = await checkAllLayers();

      // 2. Log to Supabase
      const logResult = await logToSupabase("health-guardian-run", {
        score: health.score,
        status: health.status,
        healthy: health.healthy,
        total: health.total,
        failed: health.layers.filter((l) => !l.ok).map((l) => l.key),
      });

      // 3. Alert if critical (score < 60 or n8n/supabase down)
      const criticalServices = health.layers.filter(
        (l) => !l.ok && ["n8n", "supabase"].includes(l.key)
      );
      let alertResult = null;
      if (health.score < 60 || criticalServices.length > 0) {
        alertResult = await triggerAlert({
          message: `Empire health CRITICAL: ${health.score}% — Failed: ${health.layers.filter(l => !l.ok).map(l => l.name).join(", ")}`,
          severity: "critical",
        });
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            health,
            logged: logResult,
            alert_sent: alertResult !== null,
            alert_result: alertResult,
            report: formatStatusReport(health),
          }, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Health Guardian MCP running");
