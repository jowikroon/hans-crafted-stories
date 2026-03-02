#!/usr/bin/env node
/**
 * Vault adapter HTTP server.
 *
 * Endpoints:
 *   GET  /secret/:name  — returns { exists: true } (200) or 404; never returns the value via HTTP
 *   PUT  /secret/:name  — body { "value": "..." }; stores encrypted
 *   GET  /secrets        — returns { names: [...] }
 *   GET  /health         — returns { ok: true }
 *
 * Env:
 *   VAULT_MASTER_KEY  — required (64 hex chars)
 *   VAULT_FILE        — path to encrypted store (default ./data/secrets.vault)
 *   VAULT_PORT        — listen port (default 4000)
 */

const http = require("node:http");
const store = require("./store");

const PORT = parseInt(process.env.VAULT_PORT || "4000", 10);

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

  // GET /secrets — list names only
  if (req.method === "GET" && url.pathname === "/secrets") {
    const names = store.list();
    console.log(`GET /secrets -> ${names.length} entries`);
    return json(res, 200, { names });
  }

  // GET /secret/:name — check existence (never return value over HTTP)
  if (req.method === "GET" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    const exists = store.has(name);
    console.log(`GET /secret/${name} -> ${exists ? 200 : 404}`);
    return exists
      ? json(res, 200, { exists: true, name })
      : json(res, 404, { exists: false, name });
  }

  // PUT /secret/:name — store encrypted value
  if (req.method === "PUT" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    try {
      const body = await parseBody(req);
      if (!body.value || typeof body.value !== "string") {
        return json(res, 400, { error: "body.value (string) required" });
      }
      store.set(name, body.value);
      console.log(`PUT /secret/${name} -> stored`);
      return json(res, 200, { stored: true, name });
    } catch (e) {
      console.error(`PUT /secret/${name} -> error:`, e.message);
      return json(res, 500, { error: e.message });
    }
  }

  // DELETE /secret/:name
  if (req.method === "DELETE" && parts[0] === "secret" && parts[1]) {
    const name = parts[1];
    const removed = store.remove(name);
    console.log(`DELETE /secret/${name} -> ${removed ? "removed" : "not found"}`);
    return json(res, removed ? 200 : 404, { removed, name });
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Vault adapter listening on :${PORT}`);
  console.log(`Store file: ${process.env.VAULT_FILE || "./data/secrets.vault"}`);
});
