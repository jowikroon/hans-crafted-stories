/**
 * No-JS netwerkcontrole (review R3). Start headless Chrome/Edge, schakelt JavaScript uit via het
 * DevTools-protocol (Emulation.setScriptExecutionDisabled) en registreert élk netwerkverzoek dat de
 * pagina doet (Network.requestWillBeSent). Faalt als er een tracking-host wordt benaderd, of als de
 * pagina zelf niet laadde (dan is de controle ongeldig).
 *
 *   node scripts/nojs-network-check.mjs http://localhost:4173/ http://localhost:4173/nl/about
 *
 * Alleen lokaal/preview; verstuurt geen formulieren, logt geen cookies/headers.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BROWSERS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
export const TRACKING = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|doubleclick\.net|hotjar\.com|facebook\.net|snap\.licdn\.com|px\.ads\.linkedin\.com/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withBrowser(fn) {
  const browser = BROWSERS.find((b) => fs.existsSync(b));
  if (!browser) throw new Error("geen Chrome/Edge gevonden (zet CHROME_PATH)");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nojs-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-background-networking", "--disable-component-update", "--disable-sync", "--no-pings",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" });
  try {
    let wsUrl;
    for (let i = 0; i < 50 && !wsUrl; i++) {
      await sleep(200);
      try {
        const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
        wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
      } catch { /* nog niet klaar */ }
    }
    if (!wsUrl) throw new Error("DevTools-endpoint niet bereikbaar");
    return await fn(wsUrl);
  } finally {
    proc.kill();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* profiel nog in gebruik */ }
  }
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else listeners.forEach((l) => l(msg));
  };
  const open = new Promise((r) => (ws.onopen = r));
  return {
    open,
    send: (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); }),
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  };
}

export async function checkUrl(url) {
  return withBrowser(async (wsUrl) => {
    const c = cdp(wsUrl);
    await c.open;
    const requests = [];
    let loaded = false;
    c.on((m) => {
      if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
      if (m.method === "Page.loadEventFired") loaded = true;
    });
    await c.send("Network.enable");
    await c.send("Page.enable");
    await c.send("Emulation.setScriptExecutionDisabled", { value: true });
    await c.send("Page.navigate", { url });
    for (let i = 0; i < 100 && !loaded; i++) await sleep(100);
    await sleep(1500); // iframes/lazy resources de kans geven
    const ev = await c.send("Runtime.evaluate", { expression: "document.documentElement.outerHTML.length" });
    c.close();
    const htmlLength = ev?.result?.result?.value ?? 0;
    const pageLoaded = loaded && requests.some((u) => u.startsWith(new URL(url).origin)) && htmlLength > 500;
    const tracking = requests.filter((u) => TRACKING.test(u));
    return { url, pageLoaded, requests, tracking };
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const urls = process.argv.slice(2);
  if (!urls.length) { console.error("gebruik: node scripts/nojs-network-check.mjs <url> [url...]"); process.exit(2); }
  let failed = 0;
  for (const url of urls) {
    const r = await checkUrl(url);
    const hosts = [...new Set(r.requests.map((u) => { try { return new URL(u).host; } catch { return ""; } }).filter(Boolean))].sort();
    const ok = r.pageLoaded && r.tracking.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "FAIL"} ${url}  (JS uit; ${r.requests.length} verzoeken; hosts: ${hosts.join(", ")})`);
    if (r.tracking.length) console.log(`     tracking: ${[...new Set(r.tracking.map((u) => new URL(u).host + new URL(u).pathname))].join(", ")}`);
    if (!r.pageLoaded) console.log("     pagina niet geladen — controle ongeldig");
  }
  process.exit(failed ? 1 : 0);
}
