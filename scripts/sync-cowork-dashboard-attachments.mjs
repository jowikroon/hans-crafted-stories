import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const project = 'pesfakewujjwkyybwaom';
const base = `https://${project}.supabase.co`;
const dryRun = process.argv.includes('--dry-run');
const sources = [
  'C:/Users/Malle Flappie/Documents/SecondBrainVault/_cowork/ccp-ebay-de',
  'C:/Users/Malle Flappie/.claude-mem/observer-sessions/marketplacegrowth-remote/public/cowork/ccp-ebay-de',
  'C:/Users/Malle Flappie/.claude-mem/observer-sessions/hans-crafted-stories/apps/personal/public/cowork/ccp-ebay-de',
];
const allowed = new Set(['.html', '.pdf', '.md', '.xlsx', '.txt']);
function scan(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink() || /(^\.|SKILL\.md$|~$|\.tmp$|\.bak$|^~\$)/i.test(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? scan(file) : allowed.has(path.extname(file).toLowerCase()) ? [file] : [];
  });
}
const files = new Map();
for (const [index, source] of sources.entries()) for (const file of scan(source)) {
  const name = path.basename(file), current = files.get(name);
  // The old checkout is recovery-only: never let Git checkout timestamps
  // replace an actual source document with an older archived copy.
  if (!current || (index < 2 && statSync(file).mtimeMs > statSync(current).mtimeMs)) files.set(name, file);
}
if (!files.size) throw new Error('No source files found; nothing changed.');
if (process.argv.includes('--inventory')) {
  console.log(JSON.stringify({ discovered: files.size, availableSources: sources.filter(existsSync).length }));
  process.exit(0);
}
let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key && process.env.SUPABASE_MGMT_TOKEN) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/api-keys`, { headers: { Authorization: `Bearer ${process.env.SUPABASE_MGMT_TOKEN}` } });
  if (!response.ok) throw new Error(`Credential lookup failed: ${response.status}`);
  key = (await response.json()).find(item => item.name === 'service_role')?.api_key;
}
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_MGMT_TOKEN required.');
const headers = { apikey: key, Authorization: `Bearer ${key}` };
async function request(url, options = {}) {
  const response = await fetch(base + url, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`Sync request failed (${response.status}) for ${url.split('?')[0]}`);
  return response;
}
const existing = new Map();
for (let offset = 0; ; offset += 1000) {
  const rows = await (await request(`/rest/v1/cowork_attachments?select=name,sha256&order=name&offset=${offset}&limit=1000`)).json();
  rows.forEach(row => existing.set(row.name, row));
  if (rows.length < 1000) break;
}
let changed = 0;
for (const [name, file] of files) {
  const bytes = readFileSync(file), sha256 = createHash('sha256').update(bytes).digest('hex');
  if (existing.get(name)?.sha256 === sha256) continue;
  changed++;
  if (dryRun) continue;
  const storage_path = `${sha256}${path.extname(name).toLowerCase()}`;
  await request(`/storage/v1/object/cowork-attachments/${storage_path}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-upsert': 'true' }, body: bytes });
  const verified = await (await request(`/storage/v1/object/authenticated/cowork-attachments/${storage_path}`)).arrayBuffer();
  if (createHash('sha256').update(Buffer.from(verified)).digest('hex') !== sha256) throw new Error('Uploaded content verification failed');
  await request('/rest/v1/cowork_attachments?on_conflict=name', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ name, size: bytes.length, modified: statSync(file).mtime.toISOString(), sha256, storage_path }) });
}
console.log(JSON.stringify({ discovered: files.size, changed, unchanged: files.size - changed, dryRun, storage: 'private', verified: !dryRun }, null, 2));
// --commit is accepted for old automation callers. Documents now sync directly
// to private storage; no public copies, deletions, Git commits or pushes occur.
