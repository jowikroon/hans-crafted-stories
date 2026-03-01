#!/usr/bin/env node
/**
 * vaultctl — CLI for the vault adapter store (Gate 3).
 *
 * Usage:
 *   vaultctl list              Print secret names (one per line)
 *   vaultctl set <name>        Read value from stdin (no echo); do not log value
 *   vaultctl get <name>        Print secret value to stdout only; do not log
 *   vaultctl has <name>         Exit 0 if exists, 1 if not
 *   vaultctl remove <name>      Delete a secret
 *
 * Env:
 *   VAULT_MASTER_KEY  — required (64 hex chars)
 *   VAULT_FILE       — path to store file (default ./data/secrets.vault)
 *   VAULT_BASE_URL   — optional; for remote vault (not used when using local store)
 */

const store = require("./store.cjs");

const [, , cmd, ...args] = process.argv;

function usage() {
  process.stderr.write("Usage: vaultctl <list|set|get|has|remove> [name]\n");
  process.stderr.write("  list         — list secret names\n");
  process.stderr.write("  set <name>   — read value from stdin (no echo)\n");
  process.stderr.write("  get <name>   — print value to stdout only\n");
  process.stderr.write("  has <name>   — exit 0 if exists\n");
  process.stderr.write("  remove <name> — delete secret\n");
  process.exit(2);
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(chunks.join("").trim()));
  });
}

// Read one line from TTY without echoing (no-echo)
function readStdinNoEcho() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve("");
    process.stderr.write("Value (hidden): ");
    const buf = [];
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = (c) => {
      if (c[0] === 3 || c[0] === 4) {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(wasRaw);
        process.stderr.write("\n");
        resolve(buf.join(""));
        return;
      }
      if (c[0] === 13 || c[0] === 10) {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(wasRaw);
        process.stderr.write("\n");
        resolve(buf.join(""));
        return;
      }
      buf.push(c.toString());
    };
    process.stdin.on("data", onData);
  });
}

async function run() {
  switch (cmd) {
    case "list": {
      const names = store.list();
      if (names.length) process.stdout.write(names.join("\n") + "\n");
      return;
    }
    case "set": {
      if (!args[0]) usage();
      const name = args[0];
      const value = process.stdin.isTTY ? await readStdinNoEcho() : (await readStdin());
      if (!value) {
        process.stderr.write("Error: empty value\n");
        process.exit(1);
      }
      store.set(name, value);
      process.stderr.write(`Stored: ${name}\n`);
      return;
    }
    case "get": {
      if (!args[0]) usage();
      const val = store.get(args[0]);
      if (val === null) {
        process.stderr.write(`Not found: ${args[0]}\n`);
        process.exit(1);
      }
      process.stdout.write(val);
      return;
    }
    case "has": {
      if (!args[0]) usage();
      process.exit(store.has(args[0]) ? 0 : 1);
    }
    case "remove": {
      if (!args[0]) usage();
      const ok = store.remove(args[0]);
      process.stderr.write(ok ? `Removed: ${args[0]}\n` : `Not found: ${args[0]}\n`);
      process.exit(ok ? 0 : 1);
    }
    default:
      usage();
  }
}

run().catch((e) => {
  process.stderr.write(`Error: ${e.message}\n`);
  process.exit(1);
});
