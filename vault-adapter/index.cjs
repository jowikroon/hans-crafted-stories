#!/usr/bin/env node
/**
 * Vault adapter HTTP server (Gate 3).
 *
 * Endpoints:
 *   GET  /health        — returns { ok: true }
 *   GET  /meta          — returns { names: [...] } (stored key names only)
 *   GET  /secret/:name  — 200 { exists: true, name } or 404; never returns the value
 *   PUT  /secret/:name  — body { "value": "..." }; stores encrypted; no secret in logs
 *
 * Env:
 *   VAULT_MASTER_KEY  — required (64 hex chars)
 *   VAULT_FILE        — path to encrypted store (default ./data/secrets.vault, use /mnt/data/secrets.vault in Docker)
 *   VAULT_PORT        — listen port (default 4000)
 */

const http = require("node:http");
const store = require("./store.cjs");

const PORT = parseInt(process.env.VAULT_PORT || "4000", 10);

// Redact any string that might be a secret (tokens, keys, passwords) from log output
const REDACT_PATTERNS = [/Bearer\s+[\w-]+/gi, /api[_-]?key["\s:=]+[\w-]+/gi, /token["\s:=]+[\w-]+/gi, /password["\s:=]+[^\s"]+/gi, /value["\s:]+[^\s"}]+/gi];
function redactLog(msg) {
  if (typeof msg !== "string") return "[redacted]";
  let out = msg;
  for (const p of REDACT_PATTERNS) out = out.replace(p, "[redacted]");
  return out;
}

function safeLog(...args) {
  const line = args.map((a) => (typeof a === "string" ? redactLog(a) : a)).join(" ");
  console.log(line);
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  // GET /health
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true });
  }

  // GET /meta — list stored key names only (Gate 3 spec)
  if (req.method === "GET" && url.pathname === "/meta") {
    const names = store.list();
    safeLog(`GET /meta -> ${names.length} entries`);
    return json(res, 200, { names });
  }

  // GET /secrets — backward compat alias for /meta
  if (req.method === "GET" && url.pathname === "/secrets") {
    const names = store.list();
    safeLog(`GET /secrets -> ${names.length} entries`);
    return json(res, 200, { names });
  }

  // GET /secret/:name — existence only; never return value
  if (req.method === "GET" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    const exists = store.has(name);
    safeLog(`GET /secret/${name} -> ${exists ? 200 : 404}`);
    return exists
      ? json(res, 200, { exists: true, name })
      : json(res, 404, { exists: false, name });
  }

  // PUT /secret/:name — store encrypted; never log body or value
  if (req.method === "PUT" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    try {
      const body = await parseBody(req);
      if (!body.value || typeof body.value !== "string") {
        return json(res, 400, { error: "body.value (string) required" });
      }
      store.set(name, body.value);
      safeLog(`PUT /secret/${name} -> stored`);
      return json(res, 200, { stored: true, name });
    } catch (e) {
      safeLog(`PUT /secret/${name} -> error:`, e.message);
      return json(res, 500, { error: e.message });
    }
  }

  // DELETE /secret/:name
  if (req.method === "DELETE" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    const removed = store.remove(name);
    safeLog(`DELETE /secret/${name} -> ${removed ? "removed" : "not found"}`);
    return json(res, removed ? 200 : 404, { removed, name });
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  safeLog(`Vault adapter listening on :${PORT}`);
  safeLog(`Store file: ${process.env.VAULT_FILE || "./data/secrets.vault"}`);
});
