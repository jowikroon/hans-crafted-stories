#!/usr/bin/env node
/**
 * vaultctl — CLI for the vault adapter store.
 *
 * Usage:
 *   vaultctl set <name> <value>   Store a secret
 *   vaultctl get <name>           Print secret value to stdout (no logs)
 *   vaultctl has <name>           Exit 0 if exists, 1 if not
 *   vaultctl list                 Print secret names (one per line)
 *   vaultctl remove <name>        Delete a secret
 *
 * Env:
 *   VAULT_MASTER_KEY  — required (64 hex chars)
 *   VAULT_FILE        — path to store file
 */

const store = require("./store");

const [, , cmd, ...args] = process.argv;

function usage() {
  console.error("Usage: vaultctl <set|get|has|list|remove> [name] [value]");
  process.exit(2);
}

try {
  switch (cmd) {
    case "set": {
      if (args.length < 2) usage();
      const [name, ...rest] = args;
      store.set(name, rest.join(" "));
      process.stderr.write(`Stored: ${name}\n`);
      break;
    }
    case "get": {
      if (!args[0]) usage();
      const val = store.get(args[0]);
      if (val === null) {
        process.stderr.write(`Not found: ${args[0]}\n`);
        process.exit(1);
      }
      process.stdout.write(val);
      break;
    }
    case "has": {
      if (!args[0]) usage();
      process.exit(store.has(args[0]) ? 0 : 1);
    }
    case "list": {
      const names = store.list();
      if (names.length) process.stdout.write(names.join("\n") + "\n");
      break;
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
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
