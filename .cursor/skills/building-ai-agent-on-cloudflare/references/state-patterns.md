# State Management Strategies

## State vs SQL — When to Use Which

| Data Type | Use `setState()` | Use `this.sql` |
|-----------|-------------------|----------------|
| UI-synced data (real-time) | Yes | No |
| Small config/preferences | Yes | No |
| Chat message history | Yes (small) / No (large) | Yes (large) |
| Relational/queryable data | No | Yes |
| Large datasets (>1MB) | No | Yes |
| Data needing indexes | No | Yes |

## setState() — Real-Time Synced State

State is automatically synced to all connected WebSocket clients.

```typescript
// Always use immutable updates
this.setState({ ...this.state, count: this.state.count + 1 });

// Nested updates
this.setState({
  ...this.state,
  preferences: { ...this.state.preferences, theme: "dark" },
});

// Array updates
this.setState({
  ...this.state,
  messages: [...this.state.messages, newMessage],
});
```

**Never do this:**
```typescript
// WRONG — mutation won't sync or persist
this.state.count++;
this.state.messages.push(newMessage);
```

## Reacting to State Changes

```typescript
onStateUpdate(state: State, source: string) {
  // source: "server" (setState call) or connection ID (client sync)
  if (state.messages.length > 100) {
    this.setState({
      ...state,
      messages: state.messages.slice(-100),
    });
  }
}
```

## SQL Storage — Complex Queries

```typescript
onStart() {
  this.sql`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`;
  this.sql`CREATE INDEX IF NOT EXISTS idx_docs_category ON documents(category)`;
}

// Insert
this.sql`INSERT INTO documents (title, content, category) VALUES (${title}, ${content}, ${cat})`;

// Query (type-safe)
const docs = this.sql<{ id: number; title: string; content: string }>`
  SELECT * FROM documents WHERE category = ${category} ORDER BY created_at DESC LIMIT 20
`;

// Parameterized queries prevent SQL injection automatically
// CORRECT:  this.sql`WHERE id = ${userId}`
// WRONG:    this.sql`WHERE id = '${userId}'`
```

## Trimming Unbounded State

Chat histories and logs grow without bounds. Trim proactively:

```typescript
// In AIChatAgent
async onChatMessage(onFinish) {
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  return this.streamText({ model: openai("gpt-4"), messages: this.messages, onFinish });
}

// In base Agent
async onMessage(conn: Connection, msg: WSMessage) {
  const messages = [...this.state.messages, JSON.parse(msg as string)].slice(-200);
  this.setState({ ...this.state, messages });
}
```

## Connection State

Per-connection state (not shared across clients):

```typescript
async onConnect(conn: Connection<{ userId: string; role: string }>, ctx: ConnectionContext) {
  conn.accept();
  conn.setState({
    userId: ctx.request.headers.get("X-User-ID") || "anon",
    role: ctx.request.headers.get("X-Role") || "viewer",
  });
}

async onMessage(conn: Connection<{ userId: string; role: string }>, msg: WSMessage) {
  if (conn.state.role !== "admin") {
    conn.send(JSON.stringify({ error: "Unauthorized" }));
    return;
  }
  // process admin action
}
```

## Hybrid Pattern — State + SQL

Use state for real-time UI, SQL for persistence and queries:

```typescript
export class HybridAgent extends Agent<Env, { onlineUsers: string[]; recentActivity: string[] }> {
  initialState = { onlineUsers: [], recentActivity: [] };

  onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT, action TEXT, timestamp INTEGER
    )`;
  }

  async onConnect(conn: Connection<{ userId: string }>, ctx: ConnectionContext) {
    conn.accept();
    const userId = ctx.request.headers.get("X-User-ID") || "anon";
    conn.setState({ userId });

    // Real-time state for UI
    this.setState({
      ...this.state,
      onlineUsers: [...this.state.onlineUsers, userId],
    });

    // SQL for persistent log
    this.sql`INSERT INTO activity_log (user_id, action, timestamp) VALUES (${userId}, 'connected', ${Date.now()})`;
  }

  async onClose(conn: Connection<{ userId: string }>) {
    this.setState({
      ...this.state,
      onlineUsers: this.state.onlineUsers.filter((u) => u !== conn.state.userId),
    });
  }
}
```

## Storage Limits

| Resource | Limit |
|----------|-------|
| State object size | Keep under ~1MB for performance |
| SQL storage per agent | 10GB |
| SQL columns per table | 100 |
| SQL row size | 2MB |
| Scheduled tasks | 1000 per agent |
