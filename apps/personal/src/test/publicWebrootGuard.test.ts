import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanWebroot, scanText } from "../../scripts/lib/publicWebrootGuard.mjs";
import { execFileSync } from "node:child_process";
import zlib from "node:zlib";

/** Minimale zip-schrijver voor de tests (CRC niet nodig: de guard controleert die niet). */
function makeZip(files: { name: string; content: string | Buffer; deflate?: boolean; encrypted?: boolean }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const f of files) {
    const raw = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content);
    const data = f.deflate ? zlib.deflateRawSync(raw) : raw;
    const name = Buffer.from(f.name);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(f.encrypted ? 1 : 0, 6); lh.writeUInt16LE(f.deflate ? 8 : 0, 8);
    lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(f.encrypted ? 1 : 0, 8); ch.writeUInt16LE(f.deflate ? 8 : 0, 10);
    ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, name, data);
    centrals.push(ch, name);
    offset += lh.length + name.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}
// Opgebouwd zodat dit testbestand zelf geen hardcoded-token-regel bevat.
const fakeToken = ["Ab12Cd34", "Ef56Gh78", "Ij90Kl12"].join("");

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const fakeJwt = (role: string) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ iss: "supabase", ref: "testproject00000000", role })}.c2lnbmF0dXJlLW5vdC1yZWFsLXRlc3Q`;

let dir: string;
const write = (rel: string, content: string) => {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
};

describe("public webroot guard", () => {
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("flags internal documents, dashboards and the SSR bundle by path", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-"));
    write("cowork/ccp-ebay-de/plan.md", "intern");
    write("ccp-dashboard.html", "<html></html>");
    write("dashboards/index.html", "<html></html>");
    write("entry-server.js", "export {}");
    write("index.html", "<html>ok</html>");
    const kinds = scanWebroot(dir).map((f: { kind: string }) => f.kind).sort();
    expect(kinds).toEqual(["internal-dashboard", "internal-dashboard", "internal-workdocs", "ssr-bundle"]);
  });

  it("flags a service_role JWT but allows the public anon key", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-"));
    write("assets/app.js", `const anon="${fakeJwt("anon")}";`);
    write("tools/x.html", `<script>const k="${fakeJwt("service_role")}"</script>`);
    const findings = scanWebroot(dir);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ file: "tools/x.html", kind: "jwt-service_role", line: 1 });
    // de gemelde bevinding bevat nooit de sleutel zelf
    expect(JSON.stringify(findings)).not.toContain("eyJ");
  });

  it("flags private keys and known secret prefixes", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-"));
    write("a.txt", "-----BEGIN RSA " + "PRIVATE KEY-----"); // opgesplitst zodat dit testbestand zelf niet matcht
    write("b.js", "token = 'ghp_" + "a".repeat(36) + "'");
    expect(scanWebroot(dir).map((f: { kind: string }) => f.kind).sort()).toEqual(["github-token", "private-key"]);
  });

  it("scans zip archives (stored and deflated) for hard-coded tokens without reporting the value", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-"));
    const assign = ["const TO", "KEN = \"", fakeToken, "\";"].join("");
    const header = ['headers: { "X-Runner-To', 'ken": "', fakeToken, '" }'].join("");
    fs.mkdirSync(path.join(dir, "extensions"));
    fs.writeFileSync(path.join(dir, "extensions/runner.zip"), makeZip([
      { name: "ext/", content: "" },
      { name: "ext/popup.js", content: `const BASE = "http://127.0.0.1:8787";\n${assign}\n`, deflate: true },
      { name: "ext/bg.js", content: `fetch(u, { ${header} });` },
      { name: "ext/icon.png", content: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0]) },
    ]));
    fs.writeFileSync(path.join(dir, "extensions/clean.zip"), makeZip([
      { name: "ok/popup.js", content: "const TOKEN = import.meta.env.VITE_RUNNER_TOKEN; const API_KEY = \"\";", deflate: true },
    ]));
    const findings = scanWebroot(dir);
    expect(findings).toEqual([
      { file: "extensions/runner.zip!/ext/popup.js", line: 2, kind: "hardcoded-token" },
      { file: "extensions/runner.zip!/ext/bg.js", line: 1, kind: "hardcoded-token" },
    ]);
    expect(JSON.stringify(findings)).not.toContain(fakeToken);
  });

  it("refuses archives it cannot scan: other formats, broken or encrypted zips", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-"));
    write("a.tar.gz", "x");
    write("b.7z", "x");
    write("broken.zip", "not a zip");
    fs.writeFileSync(path.join(dir, "enc.zip"), makeZip([{ name: "x.js", content: "y", encrypted: true }]));
    fs.writeFileSync(path.join(dir, "nested.zip"), makeZip([{ name: "inner.zip", content: "z" }]));
    expect(scanWebroot(dir).map((f: { file: string; kind: string }) => `${f.file} ${f.kind}`).sort()).toEqual([
      "a.tar.gz archive-unscannable",
      "b.7z archive-unscannable",
      "broken.zip archive-unscannable",
      "enc.zip archive-unscannable",
      "nested.zip!/inner.zip archive-unscannable",
    ]);
  });

  it("passes on the real apps/personal/public after the cleanup", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-")); // voor afterEach
    const publicDir = path.resolve(__dirname, "../../public");
    expect(scanWebroot(publicDir)).toEqual([]);
  });

  it("no tracked file in the repository contains a privileged Supabase key or known secret prefix", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-")); // voor afterEach
    const repoRoot = path.resolve(__dirname, "../../../..");
    const files = execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" }).split(/\r?\n/).filter(Boolean)
      .filter((f) => !/\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf|mp3|mp4|xlsx|zip|lock)$/i.test(f) && !f.endsWith("package-lock.json"));
    const findings = files.flatMap((f) => {
      const full = path.join(repoRoot, f);
      if (!fs.existsSync(full)) return [];
      return scanText(fs.readFileSync(full, "utf8"), f);
    });
    expect(findings).toEqual([]);
  }, 60_000);
});
