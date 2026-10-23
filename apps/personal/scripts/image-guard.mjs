/** Check the rendered output, not just source imports. No credentials are sent. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const SITE = 'https://hansvanleeuwen.com';

export function srcsetUrls(value) {
  const urls = [];
  // A data URL contains commas; only trailing commas separate its candidates.
  let rest = value.trim();
  while (rest) {
    rest = rest.replace(/^[\s,]+/, '');
    const match = rest.match(/^\S+/);
    if (!match) break;
    const token = match[0];
    if (!token.startsWith('data:') && token.includes(',')) {
      const end = rest.indexOf(',');
      urls.push(rest.slice(0, end));
      rest = rest.slice(end + 1);
      continue;
    }
    urls.push(token.replace(/,+$/, ''));
    rest = rest.slice(token.length);
    if (!token.endsWith(',')) {
      const end = rest.indexOf(',');
      rest = end === -1 ? '' : rest.slice(end + 1);
    }
  }
  return urls;
}

export function imageReferences(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const refs = [];
  for (const img of doc.querySelectorAll('img')) {
    if (img.hasAttribute('src') || !img.hasAttribute('srcset')) refs.push(img.getAttribute('src') ?? '');
  }
  for (const el of doc.querySelectorAll('img[srcset], picture source[srcset]')) {
    refs.push(...srcsetUrls(el.getAttribute('srcset')));
  }
  for (const el of doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')) {
    refs.push(el.getAttribute('content') ?? '');
  }
  for (const el of doc.querySelectorAll('[style]')) {
    for (const match of el.getAttribute('style').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(match[1]);
  }
  dom.window.close();
  return refs;
}

export function resolveImage(ref, pageUrl, distDir) {
  if (!ref.trim()) throw new Error('empty image reference');
  const url = new URL(ref, pageUrl);
  if (url.protocol === 'data:') {
    if (!/^data:image\/[a-z0-9.+-]+[;,].+/i.test(ref)) throw new Error('invalid inline image');
    return { inline: true };
  }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`invalid image protocol ${url.protocol}`);
  if (url.origin !== new URL(SITE).origin) return { url: url.href };
  const file = path.resolve(distDir, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(path.resolve(distDir) + path.sep)) throw new Error('image path outside dist');
  return { file, url: url.href };
}

// Fail-safe op netwerk (2026-10-23): de Vercel-build moet niet falen omdat een externe CDN (Supabase
// Storage, sndcdn, scdn) even onbereikbaar is, rate-limit of de build-IP weert. Alleen een definitief
// antwoord dat het beeld kapot is (404/410/402/overige 4xx, of 2xx zonder image-content-type = soft-404)
// faalt de build. Netwerkfout, timeout, 403, 408, 429 en 5xx: één nieuwe poging, daarna een waarschuwing.
const TRANSIENT_STATUS = new Set([403, 408, 429]);
export function isTransientStatus(status) {
  return status >= 500 || TRANSIENT_STATUS.has(status);
}

class TransientImageError extends Error {
  constructor(message) { super(message); this.transient = true; }
}

async function fetchOnce(url, fetchImage) {
  let response;
  try {
    // GET rather than HEAD: several image CDNs handle HEAD differently. Only read
    // headers, cancel the body, and deduplicate URLs to keep egress small.
    response = await fetchImage(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Range: 'bytes=0-1023' },
      redirect: 'follow',
    });
  } catch (error) {
    throw new TransientImageError(`network error: ${error?.cause?.code || error?.name || ''} ${error?.message || error}`.trim());
  }
  const type = response.headers.get('content-type') || '';
  try { await response.body?.cancel(); } catch { /* body al gesloten */ }
  if (!response.ok) {
    if (isTransientStatus(response.status)) throw new TransientImageError(`HTTP ${response.status}`);
    throw new Error(`HTTP ${response.status}`);
  }
  if (!/^image\//i.test(type)) throw new Error(`not an image (${type || 'no content-type'})`);
  return { status: response.status, type };
}

export async function checkRemoteImage(url, fetchImage = fetch, { retryDelayMs = 2000 } = {}) {
  try {
    return await fetchOnce(url, fetchImage);
  } catch (error) {
    if (!error.transient) throw error;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return fetchOnce(url, fetchImage);
  }
}

export async function checkImages(distDir, { remote = true, fetchImage = fetch, retryDelayMs = 2000 } = {}) {
  const failures = [];
  const warnings = [];
  const images = new Map();
  let pages = 0;
  // The public React pages are index.html files plus the custom 404. Standalone
  // tools and private dashboard exports have their own publishing pipelines.
  const excluded = new Set(['assets', '__edit', 'tools', 'extensions', 'artist-radar', 'dashboards', 'cowork', 'cases', 'img']);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) walk(file);
      } else if (entry.name === 'index.html' || file === path.join(distDir, '404.html')) {
        pages++;
        const route = '/' + path.relative(distDir, file).split(path.sep).join('/').replace(/index\.html$/, '');
        for (const ref of imageReferences(fs.readFileSync(file, 'utf8'))) {
          try {
            const target = resolveImage(ref, SITE + route, distDir);
            if (target.inline) continue;
            const key = target.file || target.url;
            if (!images.has(key)) images.set(key, { ...target, pages: new Set() });
            images.get(key).pages.add(route);
          } catch (error) { failures.push({ page: route, ref, error: error.message }); }
        }
      }
    }
  }
  walk(distDir);
  if (!pages) failures.push({ error: 'no rendered pages found' });
  const queue = [...images.values()];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < queue.length) {
      const image = queue[next++];
      try {
        if (image.file) {
          if (!fs.existsSync(image.file) || !fs.statSync(image.file).isFile() || fs.statSync(image.file).size === 0) {
            throw new Error('missing or empty local image');
          }
        } else if (remote) await checkRemoteImage(image.url, fetchImage, { retryDelayMs });
      } catch (error) {
        (error.transient ? warnings : failures).push({ url: image.url, pages: [...image.pages], error: error.message });
      }
    }
  }));
  return { pages, images: images.size, failures, warnings, remote };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv.find(arg => arg.startsWith('--dist='))?.slice(7)
    || fileURLToPath(new URL('../dist/', import.meta.url));
  const result = await checkImages(path.resolve(dist), { remote: !process.argv.includes('--local-only') });
  for (const warning of result.warnings) console.warn('[image-guard] waarschuwing (netwerk, faalt de build niet):', JSON.stringify(warning));
  for (const failure of result.failures) console.error('[image-guard]', JSON.stringify(failure));
  console.log(`[image-guard] ${result.pages} pages, ${result.images} unique images, ${result.failures.length} failures, ${result.warnings.length} network warnings (${result.remote ? 'local + HTTP' : 'local only'})`);
  if (result.failures.length) process.exitCode = 1;
}
