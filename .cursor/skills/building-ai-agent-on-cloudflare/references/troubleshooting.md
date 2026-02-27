# Troubleshooting

## Common Errors

### "setState() not syncing"

**Cause:** Mutating state directly instead of using `setState()`
**Fix:** Always use immutable updates:
```typescript
// WRONG
this.state.count++;

// CORRECT
this.setState({ ...this.state, count: this.state.count + 1 });
```

### "Agent not found" / 404

**Cause:** Durable Object binding missing or class name mismatch
**Fix:** Verify wrangler config:
- `class_name` in bindings matches your exported class name exactly
- Class is exported from entry point (`export { MyAgent }`)
- Migration tag exists with `new_sqlite_classes` including the class

### "WebSocket connection timeout"

**Cause:** Not calling `conn.accept()` in `onConnect`
**Fix:**
```typescript
async onConnect(conn: Connection, ctx: ConnectionContext) {
  conn.accept(); // Must be called
  conn.send(JSON.stringify({ type: "connected" }));
}
```

### "Message history grows unbounded"

**Cause:** `this.messages` in AIChatAgent accumulates indefinitely
**Fix:** Trim before each AI call:
```typescript
async onChatMessage(onFinish) {
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  return this.streamText({ model: openai("gpt-4"), messages: this.messages, onFinish });
}
```

### "SQL injection vulnerability"

**Cause:** String interpolation in SQL
**Fix:** Use tagged template literals (parameterized automatically):
```typescript
// WRONG — vulnerable
this.sql`SELECT * FROM users WHERE id = '${userId}'`;

// CORRECT — parameterized
this.sql`SELECT * FROM users WHERE id = ${userId}`;
```

### "Schedule limit exceeded"

**Cause:** More than 1000 scheduled tasks per agent
**Fix:** Monitor and clean up:
```typescript
async checkSchedules() {
  const schedules = await this.getSchedules();
  if (schedules.length > 800) {
    // Cancel completed/old schedules
    for (const s of schedules.slice(0, schedules.length - 500)) {
      await this.cancelSchedule(s.id);
    }
  }
}
```

### "@callable method returns undefined"

**Cause:** Return value is not JSON-serializable (Date, class instance, Map, etc.)
**Fix:** Return plain objects/arrays/primitives:
```typescript
// WRONG
@callable()
async getData() { return new Date(); }

// CORRECT
@callable()
async getData() { return { timestamp: Date.now() }; }
```

### "Resumable stream not resuming"

**Cause:** Stream ID must be deterministic for resumption
**Fix:** Use `AIChatAgent` which handles this automatically. For base `Agent`, ensure consistent stream IDs.

### "MCP connection loss on hibernation"

**Cause:** MCP server connections don't survive Durable Object hibernation
**Fix:** Re-register servers in `onStart()`:
```typescript
onStart() {
  this.mcp.registerServer("github", {
    url: this.env.MCP_SERVER_URL,
    auth: { type: "oauth", clientId: this.env.GITHUB_CLIENT_ID, clientSecret: this.env.GITHUB_CLIENT_SECRET },
  });
}
```

### "AI Gateway unavailable" / AI timeout

**Cause:** AI service timeout or quota exceeded
**Fix:** Add error handling:
```typescript
try {
  return await this.env.AI.run(model, { prompt });
} catch (e) {
  console.error("AI error:", e);
  return { error: "AI service temporarily unavailable" };
}
```

### Wrangler deploy fails with migration error

**Cause:** Changed class name without proper migration
**Fix:** Add a new migration entry:
```jsonc
{
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["OldAgent"] },
    { "tag": "v2", "renamed_classes": [{ "from": "OldAgent", "to": "NewAgent" }] }
  ]
}
```

### "useAgent" / "useAgentChat" not connecting

**Cause:** Agent name doesn't match wrangler binding, or CORS issue
**Fix:**
1. Verify `agent` prop matches the class name in wrangler bindings
2. For local dev, ensure client and worker are on the same origin or CORS is configured
3. Check `agent.readyState` — 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

## Rate Limits & Quotas

| Resource | Limit |
|----------|-------|
| CPU per request | 30s (standard), 300s (max) |
| Memory per instance | 128MB |
| Storage per agent | 10GB (SQLite) |
| Scheduled tasks | 1000 per agent |
| WebSocket message size | 32MiB |
| DO requests/sec | ~1000 per instance |
| SQL columns per table | 100 |
| SQL row size | 2MB |

## Deployment Checklist

- [ ] `npx wrangler whoami` — authenticated
- [ ] All secrets set: `npx wrangler secret put <KEY>`
- [ ] DO bindings match exported class names
- [ ] Migrations include all DO classes
- [ ] `compatibility_date` is recent (2024-12-01+)
- [ ] Entry point exports all agent classes
- [ ] `routeAgent()` or manual routing configured
