#!/usr/bin/env node
/**
 * Daily, read-only check of Jowikroon's publicly available SoundCloud RSS.
 * Never removes entries or publishes private/follower-only recordings.
 * RSS omissions are ambiguous: a track may simply have RSS disabled.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const FEED_URL = "https://feeds.soundcloud.com/users/soundcloud:users:1360496058/sounds.rss";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(scriptDir, "../src/data/soundcloud-public.json");
const cataloguePath = path.resolve(scriptDir, "../src/data/music.ts");

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeXml(value) {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/gi, (_, key) => entities[key.toLowerCase()] ?? "");
}
function xmlTag(item, tag) {
  const re = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i");
  const match = re.exec(item);
  return match ? decodeXml(match[1].trim()) : "";
}
function durationInSeconds(value) {
  const parts = value.split(":").map(Number);
  if (!parts.length || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error("Invalid RSS duration: " + value);
  }
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  throw new Error("Unexpected RSS duration: " + value);
}
export function parseSoundcloudRss(xml) {
  if (!/<rss\b/i.test(xml)) throw new Error("SoundCloud returned no RSS document");
  const blocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  if (!blocks.length) throw new Error("SoundCloud RSS contains no items; refusing an empty-catalogue interpretation");
  const items = blocks.map((block) => {
    const guid = xmlTag(block, "guid");
    const idMatch = /tag:soundcloud,2010:tracks\/(\d+)/.exec(guid);
    if (!idMatch) throw new Error("RSS item has no stable SoundCloud track ID");
    const uploaded = new Date(xmlTag(block, "pubDate"));
    if (Number.isNaN(uploaded.getTime())) throw new Error("RSS item has no valid publication timestamp");
    const itunesImage = /<itunes:image\b[^>]*\bhref=["']([^"']+)["']/i.exec(block);
    const mediaImage = /<media:thumbnail\b[^>]*\burl=["']([^"']+)["']/i.exec(block);
    const url = xmlTag(block, "link");
    if (!/^https:\/\/soundcloud\.com\/jowikroon\//.test(url)) throw new Error("Unexpected SoundCloud URL for track " + idMatch[1]);
    return {
      trackId: Number(idMatch[1]),
      sourceTitle: xmlTag(block, "title"),
      url,
      uploadedAt: uploaded.toISOString(),
      durationSeconds: durationInSeconds(xmlTag(block, "itunes:duration")),
      // RSS serves t3000 artwork while the site deliberately uses lighter t500.
      artwork: decodeXml((itunesImage ?? mediaImage)?.[1] ?? "").replace(/-t\d+x\d+\.jpg(?=$|\?)/, "-t500x500.jpg"),
    };
  });
  if (new Set(items.map((item) => item.trackId)).size !== items.length) throw new Error("Duplicate SoundCloud IDs in RSS");
  return items;
}

export function comparePublicTracks(expected, current) {
  const changes = [];
  const found = new Map(current.map((track) => [track.trackId, track]));
  const saved = new Map(expected.map((track) => [track.trackId, track]));
  for (const live of current) {
    const old = saved.get(live.trackId);
    if (!old) {
      changes.push({ kind: "new", id: live.trackId, name: live.sourceTitle, detail: live.url });
      continue;
    }
    for (const field of ["sourceTitle", "url", "uploadedAt", "durationSeconds"]) {
      if (live[field] !== old[field]) {
        changes.push({ kind: "changed", id: live.trackId, name: old.sourceTitle, detail: field + ": " + JSON.stringify(old[field]) + " => " + JSON.stringify(live[field]) });
      }
    }
    // SoundCloud may re-encode thumbnail sizes. Compare only when RSS supplies an image.
    if (live.artwork && live.artwork !== old.artwork) {
      changes.push({ kind: "changed", id: live.trackId, name: old.sourceTitle, detail: "artwork updated: " + live.artwork });
    }
  }
  for (const old of expected) {
    if (!found.has(old.trackId)) {
      changes.push({ kind: "missing-from-rss", id: old.trackId, name: old.sourceTitle, detail: "Not in public RSS. Verify visibility, RSS setting and public timeline manually. Do NOT delete." });
    }
  }
  return changes;
}

function catalogueIds() {
  const source = fs.readFileSync(cataloguePath, "utf8");
  return [...source.matchAll(/^\s*soundcloudTrackId:\s*(\d+),/gm)].map((match) => Number(match[1]));
}
function cleanMarkdown(value) {
  return String(value).replace(/[<>]/g, "").replace(/\r?\n/g, " ").slice(0, 600);
}
export function buildReport(changes) {
  if (!changes.length) return "";
  return [
    "## Jowikroon public SoundCloud catalogue drift",
    "",
    "Source: " + FEED_URL,
    "Verified on: " + new Date().toISOString(),
    "",
    "This is a review queue only. Never auto-publish private masters, overwrite artist-written copy, or remove a track solely because RSS omits it.",
    "",
    ...changes.map((c) => "- **" + cleanMarkdown(c.kind) + "** · " + cleanMarkdown(c.name) + " (SoundCloud ID " + c.id + "): " + cleanMarkdown(c.detail)),
    "",
    "Review the public SoundCloud profile and individual page, then update music.ts and soundcloud-public.json together after verifying the source.",
    "",
  ].join("\n");
}
export async function runCheck({ xml, output } = {}) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.artist !== "Jowikroon" || manifest.schemaVersion !== 1) throw new Error("Unexpected inventory format");
  const ids = catalogueIds();
  const inventoryIds = manifest.tracks.map((track) => track.trackId);
  if (ids.length !== inventoryIds.length || ids.some((id) => !inventoryIds.includes(id))) {
    throw new Error("The curated SoundCloud inventory and music.ts IDs disagree; fix code before checking RSS");
  }
  let rss = xml;
  if (!rss) {
    const response = await fetch(FEED_URL, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error("SoundCloud RSS fetch failed with HTTP " + response.status);
    rss = await response.text();
  }
  const changes = comparePublicTracks(manifest.tracks, parseSoundcloudRss(rss));
  const report = buildReport(changes);
  if (output) fs.writeFileSync(output, report, "utf8");
  process.stdout.write(changes.length ? report : "SoundCloud public RSS matches all " + manifest.tracks.length + " curated recordings.\n");
  return changes;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--output");
  const output = i >= 0 ? process.argv[i + 1] : undefined;
  runCheck({ output }).catch((error) => {
    console.error("[soundcloud-catalogue-check] " + error.message);
    process.exitCode = 1;
  });
}
