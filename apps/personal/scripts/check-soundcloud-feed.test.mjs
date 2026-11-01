import test from "node:test";
import assert from "node:assert/strict";
import { parseSoundcloudRss, comparePublicTracks, buildReport } from "./check-soundcloud-feed.mjs";

const feed = `<?xml version="1.0"?><rss><channel>
<item>
  <guid>tag:soundcloud,2010:tracks/2426601855</guid>
  <title><![CDATA[Loop in Control]]></title>
  <link>https://soundcloud.com/jowikroon/loop-in-control</link>
  <pubDate>Tue, 27 Oct 2026 03:17:11 +0000</pubDate>
  <itunes:duration>00:02:20</itunes:duration>
  <itunes:image href="https://i1.sndcdn.com/artworks-example-t500x500.jpg"/>
</item>
<item>
  <guid>tag:soundcloud,2010:tracks/123</guid>
  <title>That Spark &amp; More</title>
  <link>https://soundcloud.com/jowikroon/that-spark</link>
  <pubDate>Sun, 12 Jul 2026 09:06:05 +0000</pubDate>
  <itunes:duration>03:09</itunes:duration>
</item>
</channel></rss>`;

test("parses immutable IDs, SoundCloud upload time, duration, and XML titles", () => {
  const tracks = parseSoundcloudRss(feed);
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].trackId, 2426601855);
  assert.equal(tracks[0].uploadedAt, "2026-10-27T03:17:11.000Z");
  assert.equal(tracks[0].durationSeconds, 140);
  assert.equal(tracks[0].sourceTitle, "Loop in Control");
  assert.match(tracks[0].artwork, /artworks-example/);
  assert.equal(tracks[1].sourceTitle, "That Spark & More");
  assert.equal(tracks[1].durationSeconds, 189);
});

test("diff detects new public recordings and metadata edits without touching source", () => {
  const current = parseSoundcloudRss(feed);
  const expected = [{ ...current[0], sourceTitle: "Earlier title" }];
  const changes = comparePublicTracks(expected, current);
  assert(changes.some((c) => c.kind === "new" && c.id === 123));
  assert(changes.some((c) => c.kind === "changed" && c.id === 2426601855));
});

test("missing RSS entries are explicitly ambiguous, never deletions", () => {
  const tracks = parseSoundcloudRss(feed);
  const changes = comparePublicTracks(tracks, tracks.slice(0, 1));
  assert.deepEqual(changes.map((c) => c.kind), ["missing-from-rss"]);
  assert.match(buildReport(changes), /Do NOT delete/);
});

test("empty or malformed feeds fail safely", () => {
  assert.throws(() => parseSoundcloudRss("<rss><channel></channel></rss>"), /no items/);
  assert.throws(() => parseSoundcloudRss("<html>login</html>"), /no RSS/);
});
