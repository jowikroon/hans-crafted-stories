import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
