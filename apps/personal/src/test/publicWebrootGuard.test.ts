import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// @ts-expect-error — .mjs-buildscript zonder type-declaraties
import { scanWebroot } from "../../scripts/lib/publicWebrootGuard.mjs";

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
    write("a.txt", "-----BEGIN RSA PRIVATE KEY-----");
    write("b.js", "token = 'ghp_" + "a".repeat(36) + "'");
    expect(scanWebroot(dir).map((f: { kind: string }) => f.kind).sort()).toEqual(["github-token", "private-key"]);
  });

  it("passes on the real apps/personal/public after the cleanup", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "webroot-")); // voor afterEach
    const publicDir = path.resolve(__dirname, "../../public");
    expect(scanWebroot(publicDir)).toEqual([]);
  });
});
