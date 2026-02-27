---
name: building-ai-agent-on-cloudflare
description: Builds AI agents on Cloudflare using the Agents SDK with state management, real-time WebSockets, scheduled tasks, tool integration, and chat capabilities. Generates production-ready agent code deployed to Workers. Use when user wants to "build an agent", "AI agent", "chat agent", "stateful agent", mentions "Agents SDK", needs "real-time AI", "WebSocket AI", or asks about agent "state management", "scheduled tasks", or "tool calling" on Cloudflare.
---

# Building AI Agents on Cloudflare

Build stateful, globally distributed AI agents using Cloudflare's Agents SDK on Durable Objects. Agents persist state, communicate via WebSockets, run scheduled tasks, call tools, and integrate with any AI model.

## Automatic Trigger Cues

Apply this skill when user requests include:
- "build an agent", "AI agent", "chat agent", "stateful agent"
- "Agents SDK", "Cloudflare agent"
- "real-time AI", "WebSocket AI", "streaming chat"
- "scheduled tasks", "cron agent", "background AI work"
- "tool calling", "function calling" on Cloudflare
- "Durable Objects" with AI/chat context
- "MCP server" on Cloudflare Workers
- "persistent state" with AI context

## Prerequisites

- Cloudflare account with Workers enabled
- Node.js 18+ and npm/pnpm/yarn
- Wrangler CLI (`npm install -g wrangler`)
- Authenticated: `npx wrangler whoami`

## Quick Start

```bash
npm create cloudflare@latest -- my-agent --template=cloudflare/agents-starter
cd my-agent
npm start
```

Agent runs at `http://localhost:8787`

## Decision: Which Agent Type?

| Use Case | Class | Key Features |
|----------|-------|--------------|
| AI chat interface | `AIChatAgent` | Auto-streaming, tools, message history, resumable |
| MCP tool provider | `Agent` + MCP | Expose tools to AI systems |
| Custom logic/routing | `Agent` | Full control, WebSockets, email, SQL |
| Real-time collaboration | `Agent` | WebSocket state sync, broadcasts |
| Email processing | `Agent` | `onEmail()` handler |

**Default choice:** Use `AIChatAgent` for chat/conversational agents. Use base `Agent` for everything else.

## AIChatAgent — AI Chat (Recommended for Chat)

```typescript
import { AIChatAgent } from "agents";
import { openai } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return this.streamText({
      model: openai("gpt-4"),
      messages: this.messages,
      tools: {
        getWeather: tool({
          description: "Get current weather",
          parameters: z.object({ city: z.string() }),
          execute: async ({ city }) => `Sunny, 72°F in ${city}`,
        }),
      },
      onFinish,
    });
  }
}
```

Features: automatic message history, resumable streaming (survives disconnects), built-in `saveMessages()`.

## Base Agent — Full Control

```typescript
import { Agent, Connection, ConnectionContext } from "agents";

interface State {
  messages: Array<{ role: string; content: string }>;
  preferences: Record<string, string>;
}

export class MyAgent extends Agent<Env, State> {
  initialState: State = { messages: [], preferences: {} };

  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS docs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT)`;
  }

  async onConnect(conn: Connection, ctx: ConnectionContext) {
    conn.accept();
    conn.send(JSON.stringify({ type: "welcome", history: this.state.messages }));
  }

  async onMessage(conn: Connection, msg: WSMessage) {
    const data = JSON.parse(msg as string);
    this.setState({ ...this.state, messages: [...this.state.messages, data] });
    this.connections.forEach(c => c.send(JSON.stringify(data)));
  }
}
```

## Entry Point & Routing

```typescript
import { routeAgent } from "agents";

export default {
  fetch(request: Request, env: Env) {
    return routeAgent(request, env);
  },
};

export { ChatAgent, MyAgent };
```

Clients connect via: `wss://my-agent.workers.dev/agents/ChatAgent/session-id`

## Wrangler Configuration

```jsonc
{
  "name": "my-agent",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "durable_objects": {
    "bindings": [
      { "name": "ChatAgent", "class_name": "ChatAgent" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["ChatAgent"] }
  ],
  "ai": { "binding": "AI" }
}
```

## State Management

```typescript
// Read state
const count = this.state.count;

// Update state (immutable — persists + syncs to all clients)
this.setState({ ...this.state, count: this.state.count + 1 });

// SQL for complex data
this.sql`INSERT INTO docs (title, content) VALUES (${title}, ${content})`;
const results = this.sql<{id: number, title: string}>`SELECT * FROM docs WHERE title LIKE ${'%' + query + '%'}`;
```

**Critical:** Never mutate state directly. Always use `setState()` with spread.

## Scheduling

```typescript
await this.schedule(60, "checkStatus", {});                    // Delay (seconds)
await this.schedule(new Date("2026-12-25"), "sendGreeting", {msg: "Hi"});  // Date
await this.schedule("0 9 * * *", "dailyTask", {});             // Cron (9 AM daily)
await this.schedule("*/5 * * * *", "everyFiveMinutes", {});    // Every 5 min

const schedules = await this.getSchedules();
await this.cancelSchedule(scheduleId);
```

Limit: 1000 scheduled tasks per agent. Clean up completed tasks.

## Client Integration (React)

```tsx
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";

function ChatUI() {
  const agent = useAgent({ agent: "ChatAgent" });
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useAgentChat({ agent, maxSteps: 5, resume: true });

  return (
    <div>
      {messages.map(m => <div key={m.id}>{m.role}: {m.content}</div>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} disabled={isLoading} />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

## Deployment

```bash
npx wrangler dev          # Local dev
npx wrangler deploy       # Deploy to production
npx wrangler secret put OPENAI_API_KEY  # Set secrets
wrangler tail             # View logs
```

## Operating Workflow

When building an agent:

1. **Identify agent type** — chat (AIChatAgent) vs custom (Agent)
2. **Define state shape** — what persists across connections
3. **Set up wrangler config** — DO bindings, migrations, AI binding
4. **Implement agent class** — lifecycle hooks, message handling
5. **Add tools/scheduling** if needed
6. **Create client** — React hooks or vanilla WebSocket
7. **Deploy** — `npx wrangler deploy`

## Additional Resources

- For advanced patterns (tool calling, multi-agent, RAG, human-in-the-loop), see [references/agent-patterns.md](references/agent-patterns.md)
- For state management strategies, see [references/state-patterns.md](references/state-patterns.md)
- For official templates and examples, see [references/examples.md](references/examples.md)
- For troubleshooting and common errors, see [references/troubleshooting.md](references/troubleshooting.md)
