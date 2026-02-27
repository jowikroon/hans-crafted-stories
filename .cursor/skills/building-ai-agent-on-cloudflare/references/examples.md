# Official Templates & Examples

## Starter Template

```bash
npm create cloudflare@latest -- my-agent --template=cloudflare/agents-starter
```

Includes: AIChatAgent, React frontend with `useAgentChat`, tool calling, wrangler config.

## Minimal AIChatAgent

```typescript
// src/agent.ts
import { AIChatAgent } from "agents";
import { openai } from "@ai-sdk/openai";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return this.streamText({
      model: openai("gpt-4"),
      system: "You are a helpful assistant.",
      messages: this.messages,
      onFinish,
    });
  }
}

// src/index.ts
import { routeAgent } from "agents";
export default {
  fetch: (req: Request, env: Env) => routeAgent(req, env),
};
export { ChatAgent } from "./agent";
```

```jsonc
// wrangler.jsonc
{
  "name": "chat-agent",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "durable_objects": {
    "bindings": [{ "name": "ChatAgent", "class_name": "ChatAgent" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ChatAgent"] }]
}
```

## Agent with Workers AI (No External API Key)

```typescript
import { AIChatAgent } from "agents";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...this.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    });
    return response;
  }
}
```

Wrangler config needs `"ai": { "binding": "AI" }`.

## Agent with Tool Calling + React Frontend

**Server:**

```typescript
import { AIChatAgent } from "agents";
import { openai } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";

export class AssistantAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return this.streamText({
      model: openai("gpt-4"),
      messages: this.messages,
      maxSteps: 5,
      tools: {
        createTodo: tool({
          description: "Create a new todo item",
          parameters: z.object({
            title: z.string(),
            priority: z.enum(["low", "medium", "high"]),
          }),
          execute: async ({ title, priority }) => {
            this.sql`INSERT INTO todos (title, priority, done) VALUES (${title}, ${priority}, 0)`;
            return { success: true, title, priority };
          },
        }),
        listTodos: tool({
          description: "List all todo items",
          parameters: z.object({}),
          execute: async () => {
            return this.sql<{ id: number; title: string; priority: string; done: number }>`
              SELECT * FROM todos ORDER BY priority DESC
            `;
          },
        }),
      },
      onFinish,
    });
  }

  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      done INTEGER DEFAULT 0
    )`;
  }
}
```

**Client:**

```tsx
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";

export default function App() {
  const agent = useAgent({ agent: "AssistantAgent" });
  const { messages, input, handleInputChange, handleSubmit, isLoading, clearHistory } =
    useAgentChat({ agent, maxSteps: 5, resume: true });

  return (
    <main>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={m.role}>
            <strong>{m.role}:</strong> {m.content}
            {m.toolInvocations?.map((t, i) => (
              <pre key={i}>{JSON.stringify(t.result, null, 2)}</pre>
            ))}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Ask me anything..." />
        <button disabled={isLoading}>{isLoading ? "..." : "Send"}</button>
      </form>
      <button onClick={clearHistory}>Clear</button>
    </main>
  );
}
```

## Scheduled Task Agent

```typescript
import { Agent } from "agents";

export class CronAgent extends Agent<Env> {
  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, created_at INTEGER)`;
    this.schedule("0 9 * * *", "generateDailyReport", {});
    this.schedule("0 * * * *", "healthCheck", {});
  }

  async generateDailyReport() {
    const data = await fetch("https://api.example.com/metrics").then((r) => r.json());
    this.sql`INSERT INTO reports (data, created_at) VALUES (${JSON.stringify(data)}, ${Date.now()})`;
  }

  async healthCheck() {
    const status = await fetch("https://api.example.com/health").then((r) => r.status);
    if (status !== 200) {
      this.setState({ ...this.state, lastAlert: Date.now() });
    }
  }
}
```

## Vanilla JavaScript Client (No React)

```javascript
const ws = new WebSocket("wss://my-agent.workers.dev/agents/ChatAgent/user-123");

ws.onopen = () => console.log("Connected");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

ws.send(JSON.stringify({ type: "chat", content: "Hello!" }));
```

## Package Dependencies

Typical `package.json` dependencies for an agent project:

```json
{
  "dependencies": {
    "agents": "latest",
    "@ai-sdk/openai": "latest",
    "ai": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "wrangler": "latest",
    "typescript": "latest"
  }
}
```

For Workers AI (no external provider): only `agents` and `wrangler` are required.
