const DEFAULT_BASE_URL = "https://hansvanleeuwen.com";
const DEFAULT_CANONICAL_BASE_URL = "https://hansvanleeuwen.com";

const baseUrl = normalizeBaseUrl(process.env.SMOKE_BASE_URL || DEFAULT_BASE_URL);
const canonicalBaseUrl = normalizeBaseUrl(process.env.SMOKE_CANONICAL_BASE_URL || DEFAULT_CANONICAL_BASE_URL);

const blogSlugs = [
  "freelance-e-commerce-manager-inhuren",
  "ux-unit-economics",
  "amazon-vs-bol-com-2026-nederland",
  "designing-with-llms",
];

const failures = [];

for (const slug of blogSlugs) {
  const path = `/writing/${slug}/`;
  const html = await fetchHtml(path);
  const expectedCanonical = `${canonicalBaseUrl}/writing/${slug}`;

  assert(html.status === 200, `${path} returned HTTP ${html.status}`);
  assert(getMeta(html.body, "title")?.length > 0, `${path} is missing a title`);
  assert(getLink(html.body, "canonical") === expectedCanonical, `${path} canonical mismatch`);
  assert(getMeta(html.body, "og:url") === expectedCanonical, `${path} og:url mismatch`);
  assert(hasBlogPostingJsonLd(html.body), `${path} is missing BlogPosting JSON-LD`);
  assert(!html.body.includes("Hans van Leeuwen | Human-AI Experience Designer"), `${path} leaks homepage H1/content`);
  assert(hasSafePreloadedJson(html.body), `${path} has missing or unsafe __PRELOADED__ JSON`);
}

const writingIndex = await fetchHtml("/writing");
assert(writingIndex.status === 200, `/writing returned HTTP ${writingIndex.status}`);
for (const slug of blogSlugs) {
  assert(writingIndex.body.includes(`/writing/${slug}`), `/writing is missing link for ${slug}`);
}

const writeCms = await fetchHtml("/write");
assert(writeCms.status === 200, `/write returned HTTP ${writeCms.status}`);
for (const label of ["WRITE", "MANAGE", "ANALYTICS", "PUBLISH"]) {
  assert(writeCms.body.toUpperCase().includes(label), `/write is missing ${label}`);
}

if (failures.length > 0) {
  console.error(`Smoke suite failed against ${baseUrl}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Smoke suite passed against ${baseUrl}`);

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function fetchHtml(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "User-Agent": "hans-smoke-site/1.0",
    },
    redirect: "follow",
  });
  return {
    status: response.status,
    body: await response.text(),
  };
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function getMeta(html, nameOrProperty) {
  if (nameOrProperty === "title") {
    return html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() ?? null;
  }
  const escaped = escapeRegExp(nameOrProperty);
  const propertyMatch = html.match(new RegExp(`<meta\\s+property=["']${escaped}["']\\s+content=["']([^"']+)["']`, "i"));
  if (propertyMatch) return propertyMatch[1];
  return html.match(new RegExp(`<meta\\s+name=["']${escaped}["']\\s+content=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function getLink(html, rel) {
  const escaped = escapeRegExp(rel);
  return html.match(new RegExp(`<link\\s+rel=["']${escaped}["']\\s+href=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function hasBlogPostingJsonLd(html) {
  return html.includes('"@type":"BlogPosting"') || html.includes("\\u0022@type\\u0022:\\u0022BlogPosting\\u0022");
}

function hasSafePreloadedJson(html) {
  const match = html.match(/<script id=["']__PRELOADED__["'] type=["']application\/json["']>([\s\S]*?)<\/script>/i);
  return Boolean(match?.[1]) && !match[1].includes("</script>");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
