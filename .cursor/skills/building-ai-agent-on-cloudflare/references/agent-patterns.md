# Agent Patterns

## AI Chat with Tool Calling

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
          execute: async ({ city }) => `Weather in ${city}: Sunny, 72°F`,
        }),
        searchDocs: tool({
          description: "Search documentation",
          parameters: z.object({ query: z.string() }),
          execute: async ({ query }) =>
            JSON.stringify(
              this.sql<{ title: string; content: string }>`
                SELECT title, content FROM docs WHERE content LIKE ${"%" + query + "%"}
              `
            ),
        }),
      },
      onFinish,
    });
  }
}
```

## Human-in-the-Loop (Client-Side Tools)

Server defines tool, client executes it for user confirmation:

```typescript
// Server
export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return this.streamText({
      model: openai("gpt-4"),
      messages: this.messages,
      tools: {
        confirmAction: tool({
          description: "Ask user to confirm an action",
          parameters: z.object({ action: z.string() }),
          execute: "client",
        }),
      },
      onFinish,
    });
  }
}

// Client
const { messages } = useAgentChat({
  agent,
  onToolCall: async (toolCall) => {
    if (toolCall.toolName === "confirmAction") {
      return { confirmed: window.confirm(`Confirm: ${toolCall.args.action}?`) };
    }
  },
});
```

## RPC Methods (@callable)

Expose typed methods callable from the client without WebSocket message parsing:

```typescript
import { Agent, callable } from "agents";

export class MyAgent extends Agent<Env> {
  @callable()
  async processTask(input: { text: string }): Promise<{ result: string }> {
    const r = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: input.text,
    });
    return { result: r.response };
  }
}

// Client usage:
// const result = await agent.processTask({ text: "Hello" });
```

Return values must be JSON-serializable (no `Date`, class instances, etc.).

## MCP Integration

Expose tools to external AI systems via Model Context Protocol:

```typescript
export class MCPAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    await this.mcp.registerServer("github", {
      url: this.env.MCP_SERVER_URL,
      auth: {
        type: "oauth",
        clientId: this.env.GITHUB_CLIENT_ID,
        clientSecret: this.env.GITHUB_CLIENT_SECRET,
      },
    });

    const tools = await this.mcp.getAITools(["github"]);

    return this.streamText({
      model: openai("gpt-4"),
      messages: this.messages,
      tools,
      onFinish,
    });
  }
}
```

Re-register MCP servers in `onStart()` — connections don't survive hibernation.

## Task Queue & Scheduled Processing

```typescript
export class TaskAgent extends Agent<Env> {
  onStart() {
    this.schedule("*/5 * * * *", "processQueue", {});
    this.schedule("0 0 * * *", "dailyCleanup", {});
  }

  async onRequest(req: Request) {
    await this.queue("processVideo", { videoId: (await req.json()).videoId });
    return Response.json({ queued: true });
  }

  async processQueue() {
    const tasks = await this.dequeue(10);
    for (const task of tasks) {
      if (task.name === "processVideo") {
        await this.processVideo(task.data.videoId);
      }
    }
  }

  async dailyCleanup() {
    this.sql`DELETE FROM logs WHERE created_at < ${Date.now() - 86400000}`;
  }
}
```

## Email Processing with AI

```typescript
export class EmailAgent extends Agent<Env> {
  async onEmail(email: AgentEmail) {
    const [text, from, subject] = [
      await email.text(),
      email.from,
      email.headers.get("subject") || "",
    ];

    this.sql`INSERT INTO emails (from_addr, subject, body) VALUES (${from}, ${subject}, ${text})`;

    const { text: summary } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Summarize: ${subject}\n\n${text}`,
    });

    this.connections.forEach((c) =>
      c.send(JSON.stringify({ type: "new_email", from, summary }))
    );

    if (summary.includes("urgent")) {
      await this.schedule(0, "sendAutoReply", { to: from });
    }
  }
}
```

Requires email routing config in wrangler + Cloudflare dashboard.

## Multi-Agent Routing

```typescript
import { routeAgent } from "agents";

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/chat")) {
      return routeAgent(request, env, "ChatAgent");
    }
    if (url.pathname.startsWith("/task")) {
      return routeAgent(request, env, "TaskAgent");
    }

    return new Response("Not found", { status: 404 });
  },
};
```

Each agent class needs its own DO binding in wrangler config.

## Real-Time Collaboration

```typescript
export class GameAgent extends Agent<Env> {
  initialState = { players: [], gameStarted: false };

  async onConnect(conn: Connection, ctx: ConnectionContext) {
    conn.accept();
    const playerId = ctx.request.headers.get("X-Player-ID") || crypto.randomUUID();
    conn.setState({ playerId });

    const newPlayer = { id: playerId, score: 0 };
    this.setState({
      ...this.state,
      players: [...this.state.players, newPlayer],
    });
    this.connections.forEach((c) =>
      c.send(JSON.stringify({ type: "player_joined", player: newPlayer }))
    );
  }

  async onMessage(conn: Connection, msg: WSMessage) {
    const m = JSON.parse(msg as string);
    if (m.type === "move") {
      this.setState({
        ...this.state,
        players: this.state.players.map((p) =>
          p.id === conn.state.playerId ? { ...p, score: p.score + m.points } : p
        ),
      });
      this.connections.forEach((c) =>
        c.send(JSON.stringify({ type: "player_moved", playerId: conn.state.playerId }))
      );
    }
  }
}
```

## RAG Pattern (Retrieval Augmented Generation)

```typescript
export class RAGAgent extends AIChatAgent<Env> {
  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT,
      embedding BLOB
    )`;
  }

  async onChatMessage(onFinish) {
    const lastMessage = this.messages[this.messages.length - 1];
    const queryEmbedding = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: [lastMessage.content],
    });

    // Use Vectorize for similarity search if available,
    // or fall back to SQL-based search
    const context = this.sql<{ content: string }>`
      SELECT content FROM knowledge ORDER BY RANDOM() LIMIT 5
    `;

    return this.streamText({
      model: openai("gpt-4"),
      system: `Use this context to answer:\n${context.map((r) => r.content).join("\n")}`,
      messages: this.messages,
      onFinish,
    });
  }
}
```

For production RAG, use Cloudflare Vectorize for proper vector similarity search.
