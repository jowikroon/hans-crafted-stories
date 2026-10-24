import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkImages, checkRemoteImage, imageReferences, srcsetUrls } from './image-guard.mjs';

test('missing hashed image fails; references from several pages deduplicate', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-guard-'));
  try {
    fs.mkdirSync(path.join(dir, 'writing'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<img src="/assets/missing.jpg">');
    fs.writeFileSync(path.join(dir, 'writing/index.html'), '<img src="/assets/missing.jpg">');
    const result = await checkImages(dir, { remote: false });
    assert.equal(result.pages, 2);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].pages.length, 2);
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.writeFileSync(path.join(dir, 'assets/missing.jpg'), 'fixture');
    assert.equal((await checkImages(dir, { remote: false })).failures.length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('402 JSON and soft-404 HTML fail even when an image URL looks valid', async () => {
  await assert.rejects(checkRemoteImage('https://example.com/cover.png', async () => new Response('{}', { status: 402 })), /HTTP 402/);
  await assert.rejects(checkRemoteImage('https://example.com/missing.png', async () => new Response('<html>fallback</html>', { headers: { 'content-type': 'text/html' } })), /not an image/);
  await assert.doesNotReject(checkRemoteImage('https://example.com/cover.png', async () => new Response('image', { headers: { 'content-type': 'image/png' } })));
});

test('srcset, share metadata, relative URLs, inline images and invalid protocols', async () => {
  assert.deepEqual(srcsetUrls('/a.png 1x, /b.png 2x'), ['/a.png', '/b.png']);
  assert.deepEqual(srcsetUrls('data:image/png;base64,AAAA 1x, /b.png 2x'), ['data:image/png;base64,AAAA', '/b.png']);
  assert.deepEqual(imageReferences('<meta property="og:image" content="/og.png"><picture><source srcset="/a.png 1x, /b.png 2x"><img src="../c.png"></picture>'), ['../c.png', '/a.png', '/b.png', '/og.png']);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-guard-'));
  try {
    fs.mkdirSync(path.join(dir, 'writing'));
    fs.writeFileSync(path.join(dir, 'ok.svg'), '<svg/>');
    fs.writeFileSync(path.join(dir, 'writing/index.html'), '<img src="../ok.svg?version=1"><img src="data:image/png;base64,AAAA"><img src="javascript:bad"><img src="">');
    const result = await checkImages(dir, { remote: false });
    assert.equal(result.failures.length, 2);
    assert.match(result.failures.map(x => x.error).join(','), /invalid image protocol/);
    assert.match(result.failures.map(x => x.error).join(','), /empty image reference/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// 2026-10-23: een onbereikbare of rate-limitende CDN mag de Vercel-deploy niet blokkeren; een echte 404 wel.
test('network errors, timeouts, 403/429/5xx only warn after one retry; 404/410 and soft-404 still fail', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-guard-'));
  try {
    const hosts = ['down', 'timeout', 'ratelimit', 'unavailable', 'forbidden', 'gone', 'missing', 'soft404', 'flaky'];
    fs.writeFileSync(path.join(dir, 'index.html'), hosts.map((h) => `<img src="https://${h}.example.com/a.png">`).join(''));
    const calls = new Map();
    const fetchImage = async (url) => {
      const host = new URL(url).host.split('.')[0];
      calls.set(host, (calls.get(host) || 0) + 1);
      if (host === 'down') throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
      if (host === 'timeout') throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
      if (host === 'ratelimit') return new Response('', { status: 429 });
      if (host === 'unavailable') return new Response('', { status: 503 });
      if (host === 'forbidden') return new Response('', { status: 403 });
      if (host === 'gone') return new Response('', { status: 410 });
      if (host === 'missing') return new Response('', { status: 404 });
      if (host === 'soft404') return new Response('<html></html>', { headers: { 'content-type': 'text/html' } });
      // flaky: eerste poging 502, tweede lukt
      return calls.get(host) === 1 ? new Response('', { status: 502 }) : new Response('img', { headers: { 'content-type': 'image/png' } });
    };
    const result = await checkImages(dir, { remote: true, fetchImage, retryDelayMs: 0 });
    const hostOf = (x) => new URL(x.url).host.split('.')[0];
    assert.deepEqual(result.failures.map(hostOf).sort(), ['gone', 'missing', 'soft404']);
    assert.deepEqual(result.warnings.map(hostOf).sort(), ['down', 'forbidden', 'ratelimit', 'timeout', 'unavailable']);
    assert.match(result.warnings.find((w) => hostOf(w) === 'down').error, /network error: ENOTFOUND/);
    for (const h of ['down', 'timeout', 'ratelimit', 'unavailable', 'forbidden', 'flaky']) assert.equal(calls.get(h), 2, `${h}: één retry`);
    for (const h of ['gone', 'missing', 'soft404']) assert.equal(calls.get(h), 1, `${h}: geen retry`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('CLI exits 0 on network-only warnings and 1 on a real 404', async () => {
  const { execFileSync } = await import('node:child_process');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-guard-'));
  const script = fileURLToPath(new URL('./image-guard.mjs', import.meta.url));
  try {
    // .invalid-TLD resolvet nooit (RFC 2606): echte netwerkfout zonder uitgaand verkeer.
    fs.writeFileSync(path.join(dir, 'index.html'), '<img src="https://cdn.image-guard-test.invalid/a.png">');
    const out = execFileSync(process.execPath, [script, `--dist=${dir}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.match(out, /0 failures, 1 network warnings/);
    fs.writeFileSync(path.join(dir, 'index.html'), '<img src="/assets/missing.png">');
    assert.throws(() => execFileSync(process.execPath, [script, `--dist=${dir}`], { stdio: 'pipe' }), (e) => e.status === 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
