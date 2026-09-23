// deno test supabase/functions-draft/contact-submit/  — geen netwerk: fetch is geïnjecteerd.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { handle, validate, type Env } from "./handler.ts";

const ORIGIN = "https://hansvanleeuwen.com";
const ENV: Env = { SUPABASE_URL: "https://example.supabase.co", CONTACT_DB_KEY: "sb_secret_test", TURNSTILE_SECRET_KEY: "ts_secret" };
const VALID = { name: "Test", email: "Test@Example.invalid ", reason: "general", message: "Hallo", turnstileToken: "tok", website: "" };

type Call = { url: string; init?: RequestInit };
function fakeFetch(opts: { captcha?: Record<string, unknown> | "http500" | "throw"; rpc?: { status: number; body?: unknown } | "throw" } = {}) {
  const calls: Call[] = [];
  const f = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes("turnstile")) {
      if (opts.captcha === "throw") throw new TypeError("network");
      if (opts.captcha === "http500") return new Response("x", { status: 500 });
      return Response.json(opts.captcha ?? { success: true, hostname: "hansvanleeuwen.com", action: "contact" });
    }
    if (opts.rpc === "throw") throw new TypeError("network");
    const r = opts.rpc ?? { status: 204 };
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status });
  }) as typeof fetch;
  return { f, calls };
}

function req(body: unknown, { origin = ORIGIN as string | null, method = "POST" } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (origin) headers.set("origin", origin);
  return new Request("https://fn.local/contact-submit", { method, headers, body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined });
}

async function run(body: unknown, o: Parameters<typeof fakeFetch>[0] = {}, env: Env = ENV, r = {}) {
  const { f, calls } = fakeFetch(o);
  const logs: string[] = [];
  const res = await handle(req(body, r), { env, fetch: f, log: (x) => logs.push(x) });
  return { res, calls, logs, json: res.status === 204 ? null : await res.json() };
}

Deno.test("geldige inzending: captcha geverifieerd, RPC met genormaliseerde velden, 200", async () => {
  const { res, calls } = await run(VALID);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), ORIGIN);
  assertEquals(calls.length, 2);
  const verify = new URLSearchParams(String(calls[0].init?.body));
  assertEquals(verify.get("secret"), "ts_secret");
  assertEquals(verify.get("response"), "tok");
  assert(calls[1].url.endsWith("/rest/v1/rpc/contact_submit"));
  const h = new Headers(calls[1].init?.headers);
  assertEquals(h.get("apikey"), "sb_secret_test");
  assertEquals(h.get("authorization"), null, "sb_secret_ hoort niet als Bearer");
  assertEquals(JSON.parse(String(calls[1].init?.body)), { p_name: "Test", p_email: "test@example.invalid", p_reason: "general", p_message: "Hallo" });
});

Deno.test("legacy JWT-sleutel gaat ook als Bearer mee", async () => {
  const { calls } = await run(VALID, {}, { ...ENV, CONTACT_DB_KEY: "eyJhbGciOi.test.sig" });
  assertEquals(new Headers(calls[1].init?.headers).get("authorization"), "Bearer eyJhbGciOi.test.sig");
});

Deno.test("fail-closed zonder Turnstile-geheim of dbsleutel: 503 en geen enkele fetch", async () => {
  for (const env of [{ ...ENV, TURNSTILE_SECRET_KEY: undefined }, { ...ENV, CONTACT_DB_KEY: undefined }, { ...ENV, SUPABASE_URL: "" }]) {
    const { res, calls } = await run(VALID, {}, env);
    assertEquals(res.status, 503);
    assertEquals(calls.length, 0);
  }
});

Deno.test("captcha ontbreekt, faalt, verkeerde host/actie, siteverify-fout: 403 en geen RPC", async () => {
  const cases: Parameters<typeof fakeFetch>[0][] = [
    { captcha: { success: false } },
    { captcha: { success: true, hostname: "evil.example" } },
    { captcha: { success: true, hostname: "hansvanleeuwen.com", action: "other" } },
    { captcha: "http500" },
    { captcha: "throw" },
  ];
  for (const c of cases) {
    const { res, calls } = await run(VALID, c);
    assertEquals(res.status, 403);
    assert(!calls.some((x) => x.url.includes("/rpc/")));
  }
  const { res, calls } = await run({ ...VALID, turnstileToken: "" });
  assertEquals(res.status, 403);
  assertEquals(calls.length, 0);
});

Deno.test("honeypot gevuld: neutraal 200, niets geverifieerd of opgeslagen", async () => {
  const { res, calls, json } = await run({ ...VALID, website: "http://spam" });
  assertEquals(res.status, 200);
  assertEquals(json, { ok: true });
  assertEquals(calls.length, 0);
});

Deno.test("ongeldige invoer: 400 zonder captcha- of RPC-call", async () => {
  for (const bad of [{ ...VALID, reason: "x" }, { ...VALID, email: "geen" }, { ...VALID, message: " " }, { ...VALID, name: "x".repeat(101) }, "{niet-json", [1]]) {
    const { res, calls } = await run(bad);
    assertEquals(res.status, 400);
    assertEquals(calls.length, 0);
  }
});

Deno.test("te grote body: 413", async () => {
  const { res, calls } = await run({ ...VALID, message: "x".repeat(20_000) });
  assertEquals(res.status, 413);
  assertEquals(calls.length, 0);
});

Deno.test("limiter P4291/P4292 -> 429; CHECK 23514 -> 400; andere fout/netwerk -> 502", async () => {
  assertEquals((await run(VALID, { rpc: { status: 400, body: { code: "P4291" } } })).res.status, 429);
  assertEquals((await run(VALID, { rpc: { status: 400, body: { code: "P4292" } } })).res.status, 429);
  assertEquals((await run(VALID, { rpc: { status: 400, body: { code: "23514" } } })).res.status, 400);
  assertEquals((await run(VALID, { rpc: { status: 401, body: { code: "42501" } } })).res.status, 502);
  assertEquals((await run(VALID, { rpc: { status: 500 } })).res.status, 502);
  assertEquals((await run(VALID, { rpc: "throw" })).res.status, 502);
});

Deno.test("vreemde of ontbrekende Origin: 403 zonder calls en zonder CORS-header", async () => {
  for (const origin of ["https://evil.example", "https://preview-hans.vercel.app", null]) {
    const { res, calls } = await run(VALID, {}, ENV, { origin });
    assertEquals(res.status, 403);
    assertEquals(calls.length, 0);
    assertEquals(res.headers.get("access-control-allow-origin"), null);
  }
});

Deno.test("preflight en methodes", async () => {
  const { f } = fakeFetch();
  const ok = await handle(req(null, { method: "OPTIONS" }), { env: ENV, fetch: f });
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  const bad = await handle(req(null, { method: "OPTIONS", origin: "https://evil.example" }), { env: ENV, fetch: f });
  assertEquals(bad.status, 403);
  const get = await handle(req(null, { method: "GET" }), { env: ENV, fetch: f });
  assertEquals(get.status, 405);
});

Deno.test("logs bevatten nooit PII of token", async () => {
  const all: string[] = [];
  for (const o of [{}, { captcha: { success: false } }, { rpc: { status: 400, body: { code: "P4291" } } }] as const) {
    all.push(...(await run(VALID, o)).logs);
  }
  const joined = all.join("|");
  for (const secret of ["Test", "example.invalid", "Hallo", "tok", "sb_secret_test", "ts_secret"]) {
    assert(!joined.includes(secret), `log lekt ${secret}: ${joined}`);
  }
});

Deno.test("validate normaliseert e-mail en trimt", () => {
  assertEquals(validate({ name: " A ", email: " A@B.nl ", reason: "job", message: " m " }), { name: "A", email: "a@b.nl", reason: "job", message: "m" });
  assertEquals(validate(null), null);
});
