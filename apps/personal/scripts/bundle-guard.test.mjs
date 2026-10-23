import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { checkBundle, eagerChunks } from './bundle-guard.mjs';

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-guard-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<script type="module" crossorigin src="/assets/index-a.js"></script><link rel="modulepreload" crossorigin href="/assets/runtime-b.js">');
  for (const [name, code] of Object.entries(files)) fs.writeFileSync(path.join(dir, 'assets', name), code);
  return dir;
}
const base = {
  'index-a.js': 'import{a}from"./runtime-b.js";import("./App-c.js").then(()=>{});',
  'runtime-b.js': 'export const a=1;',
  'App-c.js': 'import{x}from"./shared-d.js";const W=()=>import("./WriteCMS-e.js");',
  'shared-d.js': 'export const x=2;',
  'WriteCMS-e.js': 'const pm="ProseMirror-hideselection"; const c="recharts-wrapper";',
};

test('lazy route code (editor, charts) outside the eager closure passes', () => {
  const dir = fixture(base);
  try {
    assert.deepEqual(eagerChunks(dir).sort(), ['App-c.js', 'index-a.js', 'runtime-b.js', 'shared-d.js']);
    assert.deepEqual(checkBundle(dir).failures, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('editor or recharts statically reachable from App fails', () => {
  const dir = fixture({ ...base, 'shared-d.js': 'export const x=2; const pm="ProseMirror-gapcursor"; const k="recharts-surface";' });
  try {
    const f = checkBundle(dir).failures;
    assert.equal(f.length, 2);
    assert.match(f.join('\n'), /shared-d\.js: bevat Tiptap\/ProseMirror/);
    assert.match(f.join('\n'), /shared-d\.js: bevat recharts/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('eager JS over the gzip budget fails; missing App chunk or entry is an error', () => {
  const big = crypto.randomBytes(64 * 1024).toString('base64'); // niet comprimeerbaar
  const dir = fixture({ ...base, 'shared-d.js': `export const x="${big}";` });
  try {
    assert.match(checkBundle(dir, { budgetKb: 10 }).failures.join(), /eager JS \d+ kB gzip > budget 10 kB/);
    assert.deepEqual(checkBundle(dir, { budgetKb: 1000 }).failures, []);
    fs.writeFileSync(path.join(dir, 'assets/index-a.js'), 'export{}');
    assert.throws(() => eagerChunks(dir), /App-chunk niet gevonden/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the guard flags the real pre-fix shape: App statically importing Portal code', () => {
  const dir = fixture({ ...base, 'App-c.js': 'import{x}from"./shared-d.js";import{P}from"./Portal-f.js";', 'Portal-f.js': 'const pm="ProseMirror-separator";export const P=1;' });
  try {
    assert.match(checkBundle(dir).failures.join(), /Portal-f\.js: bevat Tiptap\/ProseMirror/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the bare word ProseMirror in text is not editor code (Vercel false alarm 2026-10-23)', () => {
  const dir = fixture({ ...base, 'shared-d.js': 'export const x="Schrijf met de ProseMirror-editor in /write";' });
  try { assert.deepEqual(checkBundle(dir).failures, []); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an inlined import.meta.env object fails, in eager and lazy chunks; static env values pass', () => {
  const envObj = 'const e={BASE_URL:`/`,DEV:!1,MODE:`production`,PROD:!0,SSR:!1,VITE_ADMIN_EMAILS:`a@b.c`,VITE_SUPABASE_URL:`https://x.supabase.co`};';
  const eager = fixture({ ...base, 'index-a.js': base['index-a.js'] + envObj });
  const lazy = fixture({ ...base, 'WriteCMS-e.js': envObj });
  const ok = fixture({ ...base, 'index-a.js': base['index-a.js'] + 'const u=`https://x.supabase.co`,r=Object.entries({VITE_SUPABASE_URL:`https://x.supabase.co`,VITE_SUPABASE_PUBLISHABLE_KEY:`sb_publishable_x`});' });
  try {
    assert.match(checkBundle(eager).failures.join(), /index-a\.js: bevat het volledige import\.meta\.env-object/);
    assert.match(checkBundle(lazy).failures.join(), /WriteCMS-e\.js: bevat het volledige import\.meta\.env-object/);
    assert.deepEqual(checkBundle(ok).failures, []);
  } finally { for (const d of [eager, lazy, ok]) fs.rmSync(d, { recursive: true, force: true }); }
});
