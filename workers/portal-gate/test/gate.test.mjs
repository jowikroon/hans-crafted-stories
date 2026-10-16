// Run: node --test workers/portal-gate/test/*.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import gate, { COOKIE, signCookie, verifyCookie, safeReturnPath, readCookie } from '../src/index.js';

const HOST = 'lab-canvas.hansvanleeuwen.com';
const TOOL = '2f249690-274b-4cdd-8aa9-b9f3ec8453f7';
const env = {
  GATE_SECRET: 'test-secret',
  SUPABASE_URL: 'https://sb.test',
  SUPABASE_ANON_KEY: 'anon',
  PORTAL_ORIGINS: 'https://hansvanleeuwen.com',
  TOOL_HOSTS: JSON.stringify({ [HOST]: TOOL }),
  SERVICE_CLIENT_ID: 'svc-id',
  SERVICE_CLIENT_SECRET: 'svc-secret',
};

let calls;
let supabase;
beforeEach(() => {
  calls = [];
  supabase = { user: { id: 'u1' }, launch: `https://${HOST}/`, owner: false };
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(input, init);
    calls.push(req);
    const u = new URL(req.url);
    if (u.origin === 'https://sb.test') {
      if (req.headers.get('authorization') !== 'Bearer good') return new Response('{}', { status: 401 });
      if (u.pathname === '/auth/v1/user') return Response.json(supabase.user);
      if (u.pathname === '/rest/v1/rpc/portal_launch_tool') {
        return supabase.launch ? Response.json(supabase.launch) : Response.json({ message: 'Geen gebruikstoegang' }, { status: 403 });
      }
      if (u.pathname === '/rest/v1/rpc/is_portal_owner') return Response.json(supabase.owner);
    }
    return new Response('origin ok', { status: 200 });
  };
});

const authPost = (host, fields, origin = 'https://hansvanleeuwen.com') => new Request(`https://${host}/__portal/auth`, {
  method: 'POST', headers: { Origin: origin }, body: new URLSearchParams(fields),
});

test('page load without cookie redirects to the portal launch page', async () => {
  const res = await gate.fetch(new Request(`https://${HOST}/app?x=1`, { headers: { 'Sec-Fetch-Mode': 'navigate' } }), env);
  assert.equal(res.status, 302);
  const loc = new URL(res.headers.get('Location'));
  assert.equal(loc.origin + loc.pathname, 'https://hansvanleeuwen.com/portal/launch');
  assert.equal(loc.searchParams.get('host'), HOST);
  assert.equal(loc.searchParams.get('return'), '/app?x=1');
  assert.equal(calls.length, 0);
});

test('api call without cookie is 401 and never reaches the origin', async () => {
  const res = await gate.fetch(new Request(`https://${HOST}/api/x`), env);
  assert.equal(res.status, 401);
  assert.equal(calls.length, 0);
});

test('valid portal token for a granted tool sets a cookie that opens the origin', async () => {
  const res = await gate.fetch(authPost(HOST, { token: 'good', return: '/deep/link' }), env);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), '/deep/link');
  const setCookie = res.headers.get('Set-Cookie');
  assert.match(setCookie, /^__Host-portal_gate=.+; Path=\/; Max-Age=43200; Secure; HttpOnly; SameSite=Lax$/);

  calls = [];
  const value = setCookie.split(';')[0].split('=').slice(1).join('=');
  const ok = await gate.fetch(new Request(`https://${HOST}/`, { headers: { Cookie: `a=1; ${COOKIE}=${value}` } }), env);
  assert.equal(ok.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.get('Cookie'), 'a=1', 'gate cookie is stripped before the origin');
});

test('denied tool access, bad token and foreign origin get no cookie', async () => {
  supabase.launch = null;
  assert.equal((await gate.fetch(authPost(HOST, { token: 'good' }), env)).status, 403);
  supabase.launch = `https://${HOST}/`;
  assert.equal((await gate.fetch(authPost(HOST, { token: 'bad' }), env)).status, 403);
  assert.equal((await gate.fetch(authPost(HOST, { token: 'good' }, 'https://evil.example'), env)).status, 403);
  assert.equal((await gate.fetch(new Request(`https://${HOST}/__portal/auth`), env)).status, 405);
});

test('launch URL for another host does not authorize this host', async () => {
  supabase.launch = 'https://lab-browser.hansvanleeuwen.com/';
  assert.equal((await gate.fetch(authPost(HOST, { token: 'good' }), env)).status, 403);
});

test('unmapped host requires the portal owner', async () => {
  const other = 'lab-notes.hansvanleeuwen.com';
  assert.equal((await gate.fetch(authPost(other, { token: 'good' }), env)).status, 403);
  supabase.owner = true;
  assert.equal((await gate.fetch(authPost(other, { token: 'good' }), env)).status, 303);
});

test('cookie is bound to its host, expiry and signature', async () => {
  const exp = Math.floor(Date.now() / 1000) + 60;
  const c = await signCookie('test-secret', { sub: 'u1', host: HOST, exp });
  assert.ok(await verifyCookie('test-secret', c, HOST));
  assert.equal(await verifyCookie('test-secret', c, 'lab-browser.hansvanleeuwen.com'), null);
  assert.equal(await verifyCookie('other-secret', c, HOST), null);
  assert.equal(await verifyCookie('test-secret', c, HOST, (exp + 1) * 1000), null);
  assert.equal(await verifyCookie('test-secret', `${c.split('.')[0]}x.${c.split('.')[1]}`, HOST), null);
  assert.equal(await verifyCookie('test-secret', 'garbage', HOST), null);
});

test('service token passes and its headers are stripped', async () => {
  const res = await gate.fetch(new Request(`https://${HOST}/api`, {
    headers: { 'CF-Access-Client-Id': 'svc-id', 'CF-Access-Client-Secret': 'svc-secret' },
  }), env);
  assert.equal(res.status, 200);
  assert.equal(calls[0].headers.get('CF-Access-Client-Secret'), null);
  const wrong = await gate.fetch(new Request(`https://${HOST}/api`, {
    headers: { 'CF-Access-Client-Id': 'svc-id', 'CF-Access-Client-Secret': 'nope' },
  }), env);
  assert.equal(wrong.status, 401);
});

test('return path only allows same-host relative paths', () => {
  assert.equal(safeReturnPath('/a?b=1'), '/a?b=1');
  assert.equal(safeReturnPath('//evil.example'), '/');
  assert.equal(safeReturnPath('/\\evil.example'), '/');
  assert.equal(safeReturnPath('https://evil.example'), '/');
  assert.equal(safeReturnPath(null), '/');
  assert.equal(readCookie('a=1; b=2=3', 'b'), '2=3');
});

test('logout clears the gate cookie', async () => {
  const bg = await gate.fetch(new Request(`https://${HOST}/__portal/logout`), env);
  assert.equal(bg.status, 204);
  assert.match(bg.headers.get('Set-Cookie'), /^__Host-portal_gate=; Path=\/; Max-Age=0;/);
  const nav = await gate.fetch(new Request(`https://${HOST}/__portal/logout`, { headers: { 'Sec-Fetch-Mode': 'navigate' } }), env);
  assert.equal(nav.status, 303);
  assert.equal(nav.headers.get('Location'), 'https://hansvanleeuwen.com/portal');
  assert.equal(calls.length, 0);
});

test('missing secret fails closed', async () => {
  const res = await gate.fetch(new Request(`https://${HOST}/`), { ...env, GATE_SECRET: '' });
  assert.equal(res.status, 503);
  assert.equal(calls.length, 0);
});
