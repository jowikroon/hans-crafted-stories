#!/usr/bin/env node
/**
 * Workflow Orchestrator — Agent #3 (MCP Server)
 * Manages n8n workflows, git deployments, and webhook registry.
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
import { execSync } from "child_process";

const N8N_URL = process.env.VITE_N8N_PROD_URL || "https://n8n.srv1402218.hstgr.cloud";
const N8N_WEBHOOK = `${N8N_URL}/webhook`;

// ─── Webhook Registry ────────────────────────────────────────────────────────
const WEBHOOKS = {
  autoseo:        `${N8N_WEBHOOK}/autoseo`,
  "product-titles": `${N8N_WEBHOOK}/product-titles`,
  "health-check": `${N8N_WEBHOOK}/health-check`,
  "ssh-sentinel": `${N8N_WEBHOOK}/ssh-sentinel`,
  "context-keeper": `${N8N_WEBHOOK}/context-keeper`,
  "vps-alert":    `${N8N_WEBHOOK}/vps-alert`,
};

// ─── Git Helpers ─────────────────────────────────────────────────────────────
function gitStatus() {
  try {
    const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    const log = execSync("git log --oneline -5", { encoding: "utf8" }).trim();
    const status = execSync("git status --short", { encoding: "utf8" }).trim();
    return { branch, recent_commits: log.split("\n"), uncommitted: status || "clean" };
  } catch (e) {
    return { error: e.message };
  }
}

function gitDiff() {
  try {
    return execSync("git diff --name-only HEAD~1", { encoding: "utf8" }).trim().split("\n");
  } catch (e) {
    return [];
  }
}

// ─── n8n Helpers ─────────────────────────────────────────────────────────────
async function triggerWebhook(name, payload = {}) {
  const url = WEBHOOKS[name];
  if (!url) return { error: `Unknown webhook: ${name}. Available: ${Object.keys(WEBHOOKS).join(", ")}` };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "workflow-orchestrator-mcp", ...payload }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status, webhook: name, url };
  } catch (e) {
    return { error: e.message, webhook: name };
  }
}

async function checkN8nHealth() {
  try {
    const res = await fetch(`${N8N_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    return { ok: res.ok, status: res.status, url: N8N_URL };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── MCP Server ──────────────────────────────────────────────────────────────
const server = new Server(
  { name: "workflow-orchestrator", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_webhooks",
      description: "List all registered n8n webhooks in the empire",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "trigger_webhook",
      description: "Trigger an n8n webhook by name",
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", description: "Webhook name (e.g. autoseo, health-check)" },
          payload: { type: "object", description: "Optional JSON payload to send" },
        },
      },
    },
    {
      name: "n8n_health",
      description: "Check if n8n cloud instance is healthy",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "git_status",
      description: "Get current git branch, recent commits, and uncommitted changes",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "git_changed_files",
      description: "List files changed since last commit (to know what may need deployment)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "deployment_map",
      description: "Show which git branches map to which deployment environments",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "trigger_deploy",
      description: "Trigger a deployment by pushing to the correct branch",
      inputSchema: {
        type: "object",
        required: ["environment"],
        properties: {
          environment: {
            type: "string",
            enum: ["production", "preview"],
            description: "Target deployment environment",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_webhooks":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ webhooks: WEBHOOKS, count: Object.keys(WEBHOOKS).length }, null, 2),
        }],
      };

    case "trigger_webhook": {
      const result = await triggerWebhook(args.name, args.payload || {});
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "n8n_health": {
      const result = await checkN8nHealth();
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "git_status":
      return { content: [{ type: "text", text: JSON.stringify(gitStatus(), null, 2) }] };

    case "git_changed_files":
      return { content: [{ type: "text", text: JSON.stringify({ changed: gitDiff() }, null, 2) }] };

    case "deployment_map":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            branches: {
              main: { environment: "production", platform: "Cloudflare Pages", url: "https://hansvanleeuwen.com" },
              develop: { environment: "preview", platform: "Cloudflare Pages", url: "https://dev.hansvanleeuwen.com" },
            },
            note: "Push to 'main' to deploy production. All PRs get preview deploys automatically.",
          }, null, 2),
        }],
      };

    case "trigger_deploy": {
      const env = args.environment;
      const branch = env === "production" ? "main" : "develop";
      try {
        execSync(`git push origin HEAD:${branch}`, { encoding: "utf8" });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ ok: true, pushed_to: branch, environment: env }, null, 2),
          }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }, null, 2) }] };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Workflow Orchestrator MCP running");
