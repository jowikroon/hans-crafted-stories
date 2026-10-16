// Portal gate: the portal login is the only login for the lab tools.
//
// Runs as a Worker route in front of every gated tool host. A request with a
// valid gate cookie (or the Claude service token) passes through to the tunnel
// origin. Without one, a browser is sent to the portal's /portal/launch page,
// which POSTs the user's Supabase access token back to /__portal/auth here.
// That token is checked against Supabase and the portal's own access rules
// (portal_launch_tool for a mapped tool, is_portal_owner otherwise), then
// exchanged for a short-lived, host-bound, HMAC-signed cookie.

export const COOKIE = '__Host-portal_gate';
export const AUTH_PATH = '/__portal/auth';
export const LOGOUT_PATH = '/__portal/logout';
const TTL_SECONDS = 12 * 60 * 60;
const SERVICE_ID_HEADER = 'cf-access-client-id';
const SERVICE_SECRET_HEADER = 'cf-access-client-secret';

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Constant-time compare of two strings via their HMACs, so length leaks nothing either. */
async function safeEqual(secret, a, b) {
  const [x, y] = await Promise.all([hmac(secret, a), hmac(secret, b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function signCookie(secret, claims) {
  const body = b64url(enc.encode(JSON.stringify(claims)));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

export async function verifyCookie(secret, value, host, now = Date.now()) {
  const [body, sig] = (value || '').split('.');
  if (!body || !sig) return null;
  if (!(await safeEqual(secret, b64url(await hmac(secret, body)), sig))) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (claims.host !== host || typeof claims.exp !== 'number' || claims.exp * 1000 <= now) return null;
    return claims;
  } catch {
    return null;
  }
}

export function readCookie(header, name) {
  for (const part of (header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

function withoutCookie(header, name) {
  return (header || '').split(';').filter((p) => p.split('=')[0].trim() !== name).join(';').trim();
}

/** Only same-host relative paths may be returned to, never `//evil` or `/\evil`. */
export function safeReturnPath(value) {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/';
}

function toolHosts(env) {
  try {
    return JSON.parse(env.TOOL_HOSTS || '{}');
  } catch {
    return {};
  }
}

function portalOrigins(env) {
  return (env.PORTAL_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function supabaseHeaders(env, token) {
  return { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/** Returns the user id when the token is valid and the portal rules allow this host, else null. */
export async function authorize(env, token, host) {
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: supabaseHeaders(env, token) });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  if (!user?.id) return null;

  const toolId = toolHosts(env)[host];
  if (toolId) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/portal_launch_tool`, {
      method: 'POST', headers: supabaseHeaders(env, token), body: JSON.stringify({ _tool: toolId }),
    });
    if (!res.ok) return null;
    try {
      return new URL(await res.json()).hostname === host ? user.id : null;
    } catch {
      return null;
    }
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_portal_owner`, {
    method: 'POST', headers: supabaseHeaders(env, token), body: '{}',
  });
  return res.ok && (await res.json()) === true ? user.id : null;
}

function page(status, text) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Portal</title><p>${text}</p>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function handleAuth(request, env, url) {
  if (request.method !== 'POST') return page(405, 'Open deze tool via de portal.');
  if (!portalOrigins(env).includes(request.headers.get('Origin') || '')) return page(403, 'Onbekende herkomst.');
  const form = await request.formData();
  const token = form.get('token');
  if (typeof token !== 'string' || !token) return page(400, 'Geen portal-sessie meegegeven.');
  const sub = await authorize(env, token, url.hostname);
  if (!sub) return page(403, 'Je hebt geen toegang tot deze tool. Vraag Hans om toegang in de portal.');

  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const cookie = await signCookie(env.GATE_SECRET, { sub, host: url.hostname, exp });
  return new Response(null, {
    status: 303,
    headers: {
      Location: safeReturnPath(form.get('return')),
      'Set-Cookie': `${COOKIE}=${cookie}; Path=/; Max-Age=${TTL_SECONDS}; Secure; HttpOnly; SameSite=Lax`,
      'Cache-Control': 'no-store',
    },
  });
}

async function hasServiceToken(request, env) {
  const id = request.headers.get(SERVICE_ID_HEADER);
  const secret = request.headers.get(SERVICE_SECRET_HEADER);
  if (!id || !secret || !env.SERVICE_CLIENT_ID || !env.SERVICE_CLIENT_SECRET) return false;
  const [a, b] = await Promise.all([
    safeEqual(env.GATE_SECRET, id, env.SERVICE_CLIENT_ID),
    safeEqual(env.GATE_SECRET, secret, env.SERVICE_CLIENT_SECRET),
  ]);
  return a && b;
}

function forward(request, mutate) {
  const headers = new Headers(request.headers);
  mutate(headers);
  return fetch(new Request(request, { headers }));
}

export default {
  async fetch(request, env) {
    if (!env.GATE_SECRET) return page(503, 'Portal-gate is niet geconfigureerd.');
    const url = new URL(request.url);

    if (url.pathname === AUTH_PATH) return handleAuth(request, env, url);
    if (url.pathname === LOGOUT_PATH) {
      return new Response(null, {
        status: 303,
        headers: { Location: `${portalOrigins(env)[0] || ''}/portal`, 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax` },
      });
    }

    if (await hasServiceToken(request, env)) {
      return forward(request, (h) => { h.delete(SERVICE_ID_HEADER); h.delete(SERVICE_SECRET_HEADER); });
    }

    const cookieHeader = request.headers.get('Cookie');
    if (await verifyCookie(env.GATE_SECRET, readCookie(cookieHeader, COOKIE), url.hostname)) {
      return forward(request, (h) => {
        const rest = withoutCookie(cookieHeader, COOKIE);
        if (rest) h.set('Cookie', rest); else h.delete('Cookie');
      });
    }

    const isPageLoad = request.method === 'GET'
      && (request.headers.get('Sec-Fetch-Mode') === 'navigate' || (request.headers.get('Accept') || '').includes('text/html'));
    if (isPageLoad && portalOrigins(env)[0]) {
      const launch = new URL('/portal/launch', portalOrigins(env)[0]);
      launch.searchParams.set('host', url.hostname);
      launch.searchParams.set('return', url.pathname + url.search);
      return Response.redirect(launch.href, 302);
    }
    return new Response('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  },
};
