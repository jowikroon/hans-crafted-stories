// Contract tests for the actual public Edge Function using synthetic concerts.
// No Supabase writes, external HTTP, purchases, checkout sessions or real users.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(__dirname, "../../../supabase/functions/artist-radar-public-events/index.ts");
const source = fs.readFileSync(filename, "utf8").replace(/^import \{ createClient \} from [^\n]+\n/m, "");
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
  .replace("Deno.serve(async (req", "globalThis.__captureRadar(async (req");
if (!compiled.includes("__captureRadar")) throw new Error("Could not capture the real Edge handler");

const state = { rows: [], dbError: false };
const query = {
  select() { return this; }, eq() { return this; }, gte() { return this; }, order() { return this; },
  async limit() { return state.dbError ? { data: null, error: { message: "simulated outage" } } : { data: state.rows, error: null }; },
};
globalThis.createClient = () => ({ from(table) { assert.equal(table, "artist_radar_concerts"); return query; } });
globalThis.Deno = { env: { get(key) { return key === "SUPABASE_URL" ? "https://example.invalid" : key === "SUPABASE_SERVICE_ROLE_KEY" ? "fake" : null; } } };
globalThis.__captureRadar = (handler) => { globalThis.__radarHandler = handler; };
vm.runInThisContext(compiled, { filename: "artist-radar-public-events-contract.js" });

const fresh = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();
const event = (overrides = {}) => ({
  id: "123e4567-e89b-42d3-a456-426614174000",
  artist_id: "froukje", artist_name: "Froukje", venue: "AFAS Live", city: "Amsterdam",
  country: "NL", event_date: "2026-12-14", sort_key: 20261214,
  status: "available", urgent: true, updated_at: fresh(), source: "venue",
  source_event_id: null, source_checked_at: fresh(),
  official_ticket_url: "https://www.ticketmaster.nl/event/verified-123",
  ticket_seller: "Ticketmaster", ticket_verified_source: "https://www.afaslive.nl/agenda/froukje",
  ticket_verified_at: fresh(),
  ...overrides,
});
async function run(rows, method = "GET") {
  state.rows = rows; state.dbError = false;
  const result = await globalThis.__radarHandler(new Request("https://example.invalid/functions/v1/artist-radar-public-events", { method }));
  return { status: result.status, headers: result.headers, data: await result.json() };
}

test("verified, recent official HTTPS ticket offer is disclosed as a seller link, not an order", async () => {
  const { data } = await run([event()]);
  assert.equal(data.ok, true);
  assert.equal(data.events[0].event_key, event().id);
  assert.equal(data.events[0].ticket.seller, "Ticketmaster");
  assert.equal(data.events[0].ticket.url, "https://www.ticketmaster.nl/event/verified-123");
  assert.equal(data.events[0].order_id, undefined);
});

test("seller allowlist blocks lookalikes, arbitrary sites, non-HTTPS, userinfo and bad ports", async () => {
  for (const url of [
    "https://ticketmaster.nl.evil.example/", "http://ticketmaster.nl/", "https://www.randomtickets.example/",
    "https://ticketmaster.nl@evil.example/", "javascript:alert(1)",
    "https://ticketmaster.nl:8443/event", "https://attacker@ticketmaster.nl/event",
  ]) {
    const { data } = await run([event({ official_ticket_url: url })]);
    assert.equal(data.events[0].ticket, null, url);
  }
});

test("an untrusted evidence link cannot activate the CTA", async () => {
  const { data } = await run([event({ ticket_verified_source: "https://someunknown.example/announcement" })]);
  assert.equal(data.events[0].ticket, null);
});

test("old or missing source/ticket verification blocks purchase links", async () => {
  const old = new Date(Date.now() - 10 * 86400000).toISOString();
  for (const overrides of [
    { ticket_verified_at: old }, { source_checked_at: old },
    { ticket_verified_source: null }, { ticket_verified_at: null }, { official_ticket_url: null },
  ]) {
    const { data } = await run([event(overrides)]);
    assert.equal(data.events[0].ticket, null);
  }
});

test("sold out, announced and rumor signals never expose ticket checkout links", async () => {
  for (const status of ["sold_out", "announced", "rumored"]) {
    const { data } = await run([event({ status })]);
    assert.equal(data.events[0].ticket, null);
  }
});

test("distinct venues in the same city and day are preserved", async () => {
  const { data } = await run([
    event(), event({ id: "123e4567-e89b-42d3-a456-426614174001", venue: "Ziggo Dome" }),
  ]);
  assert.equal(data.events.length, 2);
  assert.deepEqual(data.events.map((row) => row.venue).sort(), ["AFAS Live", "Ziggo Dome"]);
});

test("two performances at the same venue on the same date are never merged without an external event ID", async () => {
  const { data } = await run([
    event(), event({ id: "123e4567-e89b-42d3-a456-426614174003" }),
  ]);
  assert.equal(data.events.length, 2);
  assert.notEqual(data.events[0].event_key, data.events[1].event_key);
});

test("matching source event IDs dedupe the same concert, and sold-out wins a timestamp tie", async () => {
  const updated = fresh();
  const { data } = await run([
    event({ id: "123e4567-e89b-42d3-a456-426614174000", source_event_id: "official-123", updated_at: updated }),
    event({ id: "123e4567-e89b-42d3-a456-426614174002", source_event_id: "official-123", updated_at: updated, status: "sold_out" }),
  ]);
  assert.equal(data.events.length, 1);
  assert.equal(data.events[0].status, "sold_out");
  assert.equal(data.events[0].ticket, null);
});

test("opaque raw import source identifiers are not disclosed publicly", async () => {
  const { data } = await run([event({ source: "internal-processor-with-private-details" })]);
  assert.equal(data.events[0].source, null);
  assert.equal(data.events[0].ticket?.seller, "Ticketmaster");
});

test("seed records do not surface as verified concert/ticket data", async () => {
  const { data } = await run([event({ source: "seed" })]);
  assert.deepEqual(data.events, []);
});

test("public endpoint is GET-only and never leaks subscriber data", async () => {
  const { status, data } = await run([], "POST");
  assert.equal(status, 405); assert.equal(data.error, "method_not_allowed");
  const get = await run([event()]);
  assert.equal(JSON.stringify(get.data).includes("@"), false);
});

test("anonymous browser clients can preflight Supabase GET headers", async () => {
  const response = await globalThis.__radarHandler(new Request("https://example.invalid/functions/v1/artist-radar-public-events", {
    method: "OPTIONS",
    headers: {
      Origin: "https://hansvanleeuwen.com",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization, apikey, x-client-info, content-type",
    },
  }));
  assert.equal(response.status, 204);
  const allowed = response.headers.get("Access-Control-Allow-Headers") ?? "";
  for (const name of ["authorization", "apikey", "x-client-info", "content-type"]) {
    assert.ok(allowed.includes(name), `${name} must be CORS-allowed`);
  }
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
});

test("upstream database failure fails closed", async () => {
  state.rows = [event()]; state.dbError = true;
  const response = await globalThis.__radarHandler(new Request("https://example.invalid/functions/v1/artist-radar-public-events"));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "temporarily_unavailable");
  state.dbError = false;
});
