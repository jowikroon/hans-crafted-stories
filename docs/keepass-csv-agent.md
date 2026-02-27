# KeePassCSV Converter Agent (local)

Single point of truth: one doc for the local KeePassXC CSV converter agent (Ollama + n8n + optional MCP).  
**Hardware:** Windows 11, GTX 1660 Ti (6 GB VRAM), 24 GB RAM. All data stays on your PC.

---

## 1. Quick verification commands

Run in **PowerShell** (in this order).

### 1.1 Ollama running and models

```powershell
ollama list
```

Expected: `llama3.1:8b` (or similar) in the list.

### 1.2 Ollama reachable from host

```powershell
Invoke-WebRequest -Uri http://localhost:11434 -UseBasicParsing
```

Expected: Status 200, body "Ollama is running".

### 1.3 Ollama reachable from Docker (for n8n)

**Requires:** Docker Desktop running and Ollama bound to `0.0.0.0` (see §2).

```powershell
docker run --rm curlimages/curl -s http://host.docker.internal:11434
```

Expected: `Ollama is running` (or JSON).  
If you get **500** or connection refused: do §2 (restart Ollama with `OLLAMA_HOST=0.0.0.0`).

---

## 2. Fix: Ollama reachable from Docker (500 / connection refused)

**Important:** Make sure Docker Desktop is fully started first (green whale icon in system tray). The `500 Internal Server Error` you see is almost always Docker Desktop not running — not an Ollama issue. Wait until Docker Desktop shows "Engine running" before any `docker run` commands.

Ollama normally listens only on `127.0.0.1`; containers use `host.docker.internal` and need Ollama on all interfaces.

1. Stop Ollama (Ctrl+C in the window where it runs, or close it).
2. In a **new** PowerShell window:

```powershell
$env:OLLAMA_HOST="0.0.0.0"; ollama serve
```

Leave this window open. Then run the Docker test again (§1.3).

Optional: make this permanent (Windows) — e.g. set User env var `OLLAMA_HOST` = `0.0.0.0`, or use a small `.ps1` that sets it and runs `ollama serve`.

---

## 3. n8n Ollama credential (n8n in Docker, Ollama on host)

| Field | Value |
|-------|--------|
| **Base URL** | `http://host.docker.internal:11434` |
| **API Key** | *(leave empty)* |
| **Allowed HTTP Request Domains** | `All` (or `localhost,127.0.0.1,host.docker.internal`) |

Test connection in n8n → Save.

---

## 4. System prompt for KeePassCSV converter

Use this as the **system prompt** for your agent (Open WebUI assistant or n8n AI node).  
Model: `llama3.1:8b`. Temperature: **0.2** (consistent output).

```
You are an expert KeePassXC migration assistant. Your ONLY job is to create a perfect, ready-to-import CSV file from my raw login data.

Follow these rules EXACTLY — no exceptions, no extra text:

1. Output ONLY the raw CSV. Start directly with the first line (the header). No explanations, no markdown, no ```csv, no "Here is your CSV", nothing else.

2. Header must be exactly: Group,Title,Username,Password,URL,Notes

3. For every entry:
   - Group: intelligently assign one of these (create new groups only if necessary): Email, Banking, Shopping, Social Media, Streaming, Work, Government, Utilities, Other
   - Title: clean and short name of the service (e.g. "Gmail", "ING Bank", "Netflix")
   - Username, Password, URL: use exactly what I provide, never change or invent
   - Notes: ALWAYS begin with one of these exact tags (based on logic and what I wrote):
     • "SAFE" — if strong, unique, recent, 2FA mentioned
     • "NOT SAFE" — if reused, old, weak-looking, or I said so
     • "WEAK" — if short or obvious pattern
     • "REUSED" — if I mention it's used elsewhere
     • "NEEDS CHANGE" — if old or compromised
     After the tag add any extra info I gave you (2FA, changed date, etc.)

4. Clean and normalize everything:
   - Fix obvious typos in URLs (http/https, missing www, etc.)
   - Remove duplicate entries (keep the most recent/complete one)
   - If no URL is given, use a logical guess or leave empty
   - Properly escape fields: any field with comma or quote must be wrapped in "double quotes"

5. Sort the final CSV by Group alphabetically, then by Title alphabetically.

Here is my raw login data (in any format — text, list, table, screenshots description, whatever):

[paste ALL your login data here]

Now generate the CSV.
```

---

## 5. MCP config (Cursor / Claude Desktop)

Use this so your AI IDE can call your **local** n8n (KeePass agent). Replace the token with your n8n MCP token (n8n → Settings → MCP → Generate).

**Local n8n (recommended — everything stays on PC):**

```json
{
  "mcpServers": {
    "keepass-csv-converter": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "http://localhost:5678/mcp-server/http",
        "--header",
        "authorization:Bearer YOUR_LOCAL_N8N_MCP_TOKEN_HERE"
      ],
      "env": {
        "NODE_NO_WARNINGS": "1"
      }
    }
  }
}
```

**VPS n8n (your live instance — recommended for remote access):**

```json
{
  "mcpServers": {
    "keepass-csv-converter-vps": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--streamableHttp",
        "https://n8n.hansvanleeuwen.com/mcp-server/http",
        "--header",
        "authorization:Bearer YOUR_N8N_MCP_TOKEN_HERE"
      ],
      "env": {
        "NODE_NO_WARNINGS": "1"
      }
    }
  }
}
```

- Local n8n port: **5678** (from `docker run ... -p 5678:5678 ... n8nio/n8n`).
- Get token: n8n → **Settings** → **MCP** → Instance-level MCP → **Generate new token**.
- Restart Cursor/Claude after editing the config.

---

## 6. One-shot prompt for any LLM (Codex / ChatGPT / Claude / Grok)

If you don’t use the agent and just want a CSV from a single paste:

1. Copy the full system prompt from §4 (from “You are an expert…” through “Now generate the CSV.”).
2. Replace `[paste ALL your login data here]` with your actual messy list.
3. Send. Copy the **raw CSV** reply (no markdown, no extra text).
4. Save as `MyLogins.csv` (UTF-8), then in KeePassXC: **Database → Import → CSV File…**.

---

## 7. Optional: n8n workflow sketch

- **Trigger:** Webhook or Manual.
- **Ollama** node: credential from §3, model `llama3.1:8b`, system message = prompt from §4, user message = `{{ $json.body }}` or input.
- **Respond to Webhook** (or Write to File): return/save the CSV.

If you want a ready-to-import JSON workflow for this, say so and we can add it under `public/workflows/`.
