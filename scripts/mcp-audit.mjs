#!/usr/bin/env node
/**
 * MCP-audit: controleert of dit device de MCP-servers kent die de registry voorschrijft.
 *
 * Draait op elk device (VPS, laptop, sandbox) en vergelijkt drie dingen:
 *   1. staat elke repo-server in .mcp.json?
 *   2. start elke repo-server echt, en levert hij de verwachte tools? (echte MCP-handshake)
 *   3. reageert elk HTTP-endpoint zoals de registry verwacht?
 *      200 = "ok"; een verwachte 401/403 uit expectUnauthenticated = "alive (auth required)":
 *      het endpoint leeft en dwingt auth af. Beide tellen als gezond (geen drift, heartbeat "up").
 * Daarnaast leest hij de lokale client-registries (~/.claude.json) zodat zichtbaar wordt
 * wat dít device kent, en waarschuwt hij als een afgevoerde server weer als default opduikt.
 *
 * Gebruik:
 *   npm run mcp:audit                 : leesbare rapportage, exit 1 bij drift
 *   npm run mcp:audit -- --json       : machineleesbaar
 *   npm run mcp:audit -- --device=pi5 : forceer een device-id uit de registry
 *   npm run mcp:audit -- --report     : schrijf het resultaat als heartbeat naar Supabase,
 *                                       zodat de andere devices het ook zien
 *
 * --report heeft SUPABASE_URL + SUPABASE_SERVICE_KEY (of SUPABASE_KEY) in de omgeving nodig
 * en doet zonder die twee niets. Er wordt nooit een sleutel afgedrukt.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const doReport = args.includes("--report");
const deviceFlag = args.find((a) => a.startsWith("--device="))?.split("=")[1];

const registry = JSON.parse(readFileSync(join(ROOT, "ops/mcp/registry.json"), "utf8"));

/* ── device bepalen ──────────────────────────────────────────────────────── */

function detectDevice() {
  if (deviceFlag) {
    const d = registry.devices.find((x) => x.id === deviceFlag);
    if (!d) throw new Error(`Onbekend device-id: ${deviceFlag}`);
    return d;
  }
  const host = hostname().toLowerCase();
  const match = registry.devices.find(
    (d) =>
      d.id === host ||
      d.heartbeatHost === host ||
      (Array.isArray(d.hostnameAliases) && d.hostnameAliases.some((x) => x.toLowerCase() === host)) ||
      (d.hostname && (d.hostname.toLowerCase() === host || d.hostname.toLowerCase().startsWith(`${host}.`))),
  );
  return match ?? { id: host, label: `${host} (niet in de registry)`, heartbeatHost: host, repoCheckout: true, unknown: true };
}

const device = detectDevice();

// Op een device dat de registry niet kent, vervalt `requiredOn`; dan zou de audit
// nooit drift zien. Daarom geldt daar de ondergrens: wie een repo-checkout heeft,
// hoort de repo-servers te kunnen draaien.
// Een server met registry-status "planned" is nog niet aangesloten en is dus nergens drift;
// "retired" hoort in de `retired`-lijst, maar telt ook in `servers` nooit als drift.
const expectedHere = (server) => {
  if (server.status === "planned" || server.status === "retired") return false;
  if (device.unknown) return server.scope === "repo";
  return Array.isArray(server.requiredOn) && server.requiredOn.includes(device.id);
};

// Statussen die "gezond" betekenen: tellen niet als drift en publiceren als "up".
const AUTH_REQUIRED = "alive (auth required)";
const HEALTHY = new Set(["ok", AUTH_REQUIRED]);
const NOT_DRIFT = new Set([...HEALTHY, "n.v.t.", "handmatig"]);

/* ── 1. registratie in .mcp.json ─────────────────────────────────────────── */

function readProjectMcpJson() {
  const p = join(ROOT, ".mcp.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")).mcpServers ?? {};
  } catch (e) {
    return { __error: e.message };
  }
}

/* ── 2. echte MCP-handshake over stdio ───────────────────────────────────── */

function handshakeStdio(server, timeoutMs = 15000) {
  return new Promise((done) => {
    const child = spawn(server.command, server.args, {
      cwd: ROOT,
      env: { ...process.env, VITE_N8N_PROD_URL: process.env.VITE_N8N_PROD_URL ?? "https://n8n.srv1402218.hstgr.cloud" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGTERM");
      done(result);
    };

    const timer = setTimeout(
      () => finish({ ok: false, error: `geen antwoord binnen ${timeoutMs / 1000}s`, stderr: stderr.trim().split("\n").pop() }),
      timeoutMs,
    );

    child.on("error", (e) => finish({ ok: false, error: e.message }));
    child.on("exit", (code) => {
      if (settled) return;
      const line = stderr.trim().split("\n").find((l) => l.includes("Error")) ?? stderr.trim().split("\n").pop();
      finish({ ok: false, error: `proces stopte met code ${code}`, stderr: line });
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      let idx;
      while ((idx = stdout.indexOf("\n")) !== -1) {
        const raw = stdout.slice(0, idx).trim();
        stdout = stdout.slice(idx + 1);
        if (!raw) continue;
        let msg;
        try {
          msg = JSON.parse(raw);
        } catch {
          continue;
        }
        if (msg.id === 1) {
          child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
          child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
        }
        if (msg.id === 2) {
          const tools = (msg.result?.tools ?? []).map((t) => t.name);
          finish({ ok: true, tools });
        }
      }
    });

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "mcp-audit", version: "1.0.0" },
        },
      })}\n`,
    );
  });
}

/* ── 3. HTTP-endpoint probe ──────────────────────────────────────────────── */

async function probeHttp(server) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "mcp-audit", version: "1.0.0" } },
  });
  try {
    const res = await fetch(server.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body,
      signal: AbortSignal.timeout(12000),
    });
    return { status: res.status };
  } catch (e) {
    return { status: null, error: e.message };
  }
}

/* ── 4. lokale client-registries ─────────────────────────────────────────── */

function readLocalClientRegistry() {
  const home = process.env.HOME ?? process.env.USERPROFILE;
  const out = { known: [], needsAuth: [], sources: [] };
  if (!home) return out;

  const claudeJson = join(home, ".claude.json");
  if (existsSync(claudeJson)) {
    out.sources.push("~/.claude.json");
    try {
      const cfg = JSON.parse(readFileSync(claudeJson, "utf8"));
      out.known.push(...Object.keys(cfg.mcpServers ?? {}));
      for (const project of Object.values(cfg.projects ?? {})) {
        out.known.push(...Object.keys(project?.mcpServers ?? {}));
        out.known.push(...(project?.enabledMcpjsonServers ?? []));
      }
    } catch {
      /* onleesbaar is geen fout van de audit */
    }
  }

  const authCache = join(home, ".claude", "mcp-needs-auth-cache.json");
  if (existsSync(authCache)) {
    out.sources.push("~/.claude/mcp-needs-auth-cache.json");
    try {
      out.needsAuth.push(...Object.keys(JSON.parse(readFileSync(authCache, "utf8"))));
    } catch {
      /* idem */
    }
  }

  out.known = [...new Set(out.known)];
  return out;
}

/* ── 5. afgevoerde servers mogen niet terugkeren ─────────────────────────── */

function retiredStillDefault() {
  const hits = [];
  for (const gone of registry.retired ?? []) {
    if (!gone.url) continue;
    const host = new URL(gone.url).host;
    for (const server of registry.servers.filter((s) => s.transport === "stdio")) {
      const file = join(ROOT, server.args[0]);
      if (!existsSync(file)) continue;
      if (readFileSync(file, "utf8").includes(host)) {
        hits.push({ retired: gone.id, host, file: server.args[0] });
      }
    }
  }
  return hits;
}

/* ── uitvoeren ───────────────────────────────────────────────────────────── */

const projectServers = readProjectMcpJson();
const local = readLocalClientRegistry();
const results = [];

for (const server of registry.servers) {
  const required = expectedHere(server);
  const row = {
    id: server.id,
    label: server.label,
    transport: server.transport,
    scope: server.scope,
    required,
    registryStatus: server.status ?? null,
    lastVerified: server.lastVerified ?? null,
  };

  if (server.transport === "stdio") {
    row.registered = projectServers !== null && Object.hasOwn(projectServers, server.id);
    if (device.repoCheckout === false) {
      row.status = "n.v.t.";
      row.detail = "device heeft geen repo-checkout";
    } else {
      const hs = await handshakeStdio(server);
      if (!hs.ok) {
        row.status = "stuk";
        row.detail = hs.stderr ? `${hs.error}: ${hs.stderr}` : hs.error;
      } else {
        const missing = (server.expectedTools ?? []).filter((t) => !hs.tools.includes(t));
        row.tools = hs.tools.length;
        row.status = missing.length === 0 ? "ok" : "onvolledig";
        row.detail = missing.length === 0 ? `${hs.tools.length} tools` : `mist: ${missing.join(", ")}`;
      }
      if (!row.registered) {
        row.status = row.status === "ok" ? "niet geregistreerd" : row.status;
        row.detail = `${row.detail} · staat niet in .mcp.json`;
      }
    }
  } else if (server.url) {
    const probe = await probeHttp(server);
    const expect = server.expectUnauthenticated ?? [200];
    if (probe.status === null) {
      row.status = "onbereikbaar";
      row.detail = probe.error;
    } else if (probe.status === 200) {
      row.status = "ok";
      row.detail = "HTTP 200";
    } else if (expect.includes(probe.status)) {
      row.status = AUTH_REQUIRED;
      row.authRequired = true;
      row.detail = `HTTP ${probe.status}, endpoint leeft en vraagt ${server.auth ?? "auth"}`;
    } else {
      row.status = "afwezig";
      row.detail = `HTTP ${probe.status}, verwacht ${[...new Set([200, ...expect])].join(" of ")}`;
    }
  } else {
    row.status = "handmatig";
    row.detail = "client-beheerd endpoint, alleen aanwezigheid controleerbaar";
  }

  const aliases = [server.id, ...(server.aliases ?? [])];
  row.knownLocally = aliases.some((a) => local.known.includes(a));
  row.needsAuthLocally = aliases.some((a) => local.needsAuth.includes(a));

  results.push(row);
}

const reintroduced = retiredStillDefault();
const drift = results.filter((r) => r.required && !NOT_DRIFT.has(r.status));

// Registry zegt live of needs-auth, maar de probe vindt niets: alleen een waarschuwing,
// telt niet mee in de exitcode (die blijft drift + teruggekeerde afgevoerde servers).
const statusMismatch = results.filter(
  (r) => ["live", "needs-auth"].includes(r.registryStatus) && !NOT_DRIFT.has(r.status),
);
// Een status buiten de legenda (tikfout, of een server zonder status) is ook alleen een waarschuwing.
// Een v1-registry (zonder statusLegend) kent nog geen status en wordt hier niet op afgerekend.
const knownStatuses = Object.keys(registry.statusLegend ?? {});
const unknownStatus = registry.statusLegend ? results.filter((r) => !knownStatuses.includes(r.registryStatus)) : [];
for (const r of results) r.healthy = HEALTHY.has(r.status);

const report = {
  device: { id: device.id, label: device.label, hostname: hostname(), unknownToRegistry: device.unknown === true },
  checkedAt: new Date().toISOString(),
  registryVersion: registry.version,
  servers: results,
  localRegistry: { sources: local.sources, known: local.known.length, needsAuth: local.needsAuth },
  retiredReintroduced: reintroduced,
  retired: (registry.retired ?? []).map((r) => ({ id: r.id, retiredOn: r.retiredOn ?? null })),
  statusMismatch: statusMismatch.map((r) => ({ id: r.id, registryStatus: r.registryStatus, status: r.status })),
  unknownRegistryStatus: unknownStatus.map((r) => ({ id: r.id, registryStatus: r.registryStatus })),
  driftCount: drift.length,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const icon = { ok: "✓", [AUTH_REQUIRED]: "✓", "n.v.t.": "·", handmatig: "·" };
  console.log(`\nMCP-audit, device: ${device.label}${device.unknown ? "" : ` (${device.id})`}`);
  if (device.unknown) {
    console.log("  → dit device staat niet in ops/mcp/registry.json. Voeg het daar toe, of draai met --device=<id>.");
  }
  console.log(`registry v${registry.version} · ${report.checkedAt}\n`);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${pad("SERVER", 24)}${pad("REGISTRY", 12)}${pad("HIER NODIG", 12)}${pad("STATUS", 26)}DETAIL`);
  console.log("-".repeat(120));
  for (const r of results) {
    console.log(
      `${pad(r.id, 24)}${pad(r.registryStatus ?? "-", 12)}${pad(r.required ? "ja" : "nee", 12)}${pad(`${icon[r.status] ?? "✗"} ${r.status}`, 26)}${r.detail ?? ""}`,
    );
  }
  console.log("");
  const healthy = results.filter((r) => r.healthy);
  const authOnly = healthy.filter((r) => r.status === AUTH_REQUIRED).length;
  console.log(
    `Gezond: ${healthy.length} van ${results.length} (${healthy.length - authOnly} ok, ${authOnly} alive (auth required)); ` +
      `handmatig: ${results.filter((r) => r.status === "handmatig").length}; ` +
      `afgevoerd in registry: ${report.retired.map((r) => (r.retiredOn ? `${r.id} (${r.retiredOn})` : r.id)).join(", ") || "geen"}`,
  );
  for (const r of statusMismatch) {
    console.log(`! registry zegt ${r.registryStatus} voor ${r.id}, maar de audit ziet: ${r.status}. Werk status/lastVerified bij.`);
  }
  for (const r of unknownStatus) {
    console.log(`! ${r.id} heeft geen geldige registry-status (${r.registryStatus ?? "leeg"}); kies uit ${knownStatuses.join(", ")}.`);
  }
  if (local.sources.length) {
    console.log(`Lokale registry (${local.sources.join(", ")}): ${local.known.length} server(s) bekend` + (local.needsAuth.length ? `, zonder auth: ${local.needsAuth.join(", ")}` : ""));
  }
  for (const hit of reintroduced) {
    console.log(`! afgevoerde server ${hit.retired} (${hit.host}) staat nog in ${hit.file}`);
  }
  console.log(drift.length === 0 ? "\nGeen drift op dit device." : `\n${drift.length} afwijking(en) op dit device: ${drift.map((d) => d.id).join(", ")}`);
}

/* ── optioneel: publiceren zodat andere devices dit zien ─────────────────── */

if (doReport) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_KEY;
  if (!url || !key) {
    console.error("\n--report overgeslagen: SUPABASE_URL en SUPABASE_SERVICE_KEY zijn niet gezet.");
  } else {
    // "handmatig" (client-beheerd, niet gemeten) is geen meting en dus ook geen "down".
    const rows = results
      .filter((r) => r.status !== "n.v.t." && r.status !== "handmatig")
      .map((r) => ({
        host: device.heartbeatHost ?? device.id,
        service: `mcp:${r.id}`,
        status: HEALTHY.has(r.status) ? "up" : "down",
        detail: {
          transport: r.transport,
          scope: r.scope,
          required: r.required,
          auditStatus: r.status,
          registryStatus: r.registryStatus,
          authRequired: r.authRequired === true,
          note: r.detail ?? null,
          knownLocally: r.knownLocally,
        },
        reported_at: report.checkedAt,
      }));
    const res = await fetch(`${url}/rest/v1/infra_service_heartbeats`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    });
    console.error(res.ok ? `\n${rows.length} MCP-heartbeats gepubliceerd als host=${device.heartbeatHost ?? device.id}.` : `\nPubliceren faalde: HTTP ${res.status}`);
  }
}

process.exit(drift.length === 0 && reintroduced.length === 0 ? 0 : 1);
