#!/usr/bin/env node
/**
 * Manifest schema validator for n8n/secrets.manifest.yml.
 * Can be run standalone or imported by tests.
 *
 * Usage: node n8n/scripts/validate-manifest.js [path-to-manifest]
 */

const fs = require("node:fs");
const path = require("node:path");

const ALLOWED_SOURCES = ["ENV", "VAULT", "N8N_CRED"];

function parseYamlSimple(text) {
  // Minimal YAML-subset parser for our flat manifest structure.
  // For production, use a real YAML library. This handles our specific format.
  const lines = text.split("\n");
  const result = { variables: [], secrets: [], workflows: [] };
  let currentSection = null;
  let currentItem = null;
  let currentList = null;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("#") || line.trim() === "") continue;

    // Top-level keys
    if (/^version:/.test(line)) {
      result.version = line.split(":").slice(1).join(":").trim().replace(/"/g, "");
      continue;
    }
    if (/^variables:/.test(line)) { currentSection = "variables"; currentItem = null; currentList = null; continue; }
    if (/^secrets:/.test(line)) { currentSection = "secrets"; currentItem = null; currentList = null; continue; }
    if (/^workflows:/.test(line)) { currentSection = "workflows"; currentItem = null; currentList = null; continue; }

    // List item start
    if (/^  - name:/.test(line) || /^  - file:/.test(line)) {
      currentItem = {};
      const key = line.trim().replace(/^- /, "").split(":")[0].trim();
      const val = line.split(":").slice(1).join(":").trim().replace(/"/g, "");
      currentItem[key] = val;
      currentList = null;
      if (currentSection) result[currentSection].push(currentItem);
      continue;
    }

    // Nested scalar
    if (currentItem && /^    \w/.test(line) && !line.trim().startsWith("-")) {
      const parts = line.trim().split(":");
      const key = parts[0].trim();
      let val = parts.slice(1).join(":").trim().replace(/"/g, "");
      if (val === "true") val = true;
      if (val === "false") val = false;
      if (val === "null") val = null;
      if (/^\d+$/.test(val)) val = parseInt(val, 10);
      currentItem[key] = val;
      currentList = null;
      continue;
    }

    // Nested list key (e.g. required_secrets:)
    if (currentItem && /^    \w.*:\s*$/.test(line)) {
      const key = line.trim().replace(/:.*/, "");
      currentItem[key] = [];
      currentList = key;
      continue;
    }

    // Nested list items
    if (currentList && currentItem && /^\s+- /.test(line)) {
      const val = line.trim().replace(/^- /, "").replace(/"/g, "");
      // Handle object items like { type: ..., name: ... }
      if (val.includes("type:")) {
        const obj = {};
        const pairs = val.replace(/[{}]/g, "").split(",");
        for (const p of pairs) {
          const [k, ...v] = p.split(":");
          if (k && v.length) obj[k.trim()] = v.join(":").trim().replace(/"/g, "");
        }
        currentItem[currentList].push(obj);
      } else {
        currentItem[currentList].push(val);
      }
      continue;
    }

    // Sub-item in list (e.g. n8n_credentials entries)
    if (currentList && currentItem && /^\s+\w+:/.test(line)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) {
        // new sub-item
        const obj = {};
        const parts = trimmed.replace(/^- /, "").split(":");
        obj[parts[0].trim()] = parts.slice(1).join(":").trim().replace(/"/g, "");
        currentItem[currentList].push(obj);
      } else if (Array.isArray(currentItem[currentList]) && currentItem[currentList].length > 0) {
        const last = currentItem[currentList][currentItem[currentList].length - 1];
        if (typeof last === "object") {
          const parts = trimmed.split(":");
          last[parts[0].trim()] = parts.slice(1).join(":").trim().replace(/"/g, "");
        }
      }
    }
  }

  return result;
}

function validate(manifestPath) {
  const errors = [];

  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: [`File not found: ${manifestPath}`] };
  }

  const text = fs.readFileSync(manifestPath, "utf8");
  let manifest;
  try {
    manifest = parseYamlSimple(text);
  } catch (e) {
    return { valid: false, errors: [`Parse error: ${e.message}`] };
  }

  // Version
  if (!manifest.version) errors.push("Missing 'version' field");

  // Variables
  if (!Array.isArray(manifest.variables)) {
    errors.push("Missing or invalid 'variables' array");
  } else {
    for (const v of manifest.variables) {
      if (!v.name) errors.push(`Variable missing 'name': ${JSON.stringify(v)}`);
    }
  }

  // Secrets
  if (!Array.isArray(manifest.secrets)) {
    errors.push("Missing or invalid 'secrets' array");
  } else {
    for (const s of manifest.secrets) {
      if (!s.name) errors.push(`Secret missing 'name': ${JSON.stringify(s)}`);
      if (!s.source) errors.push(`Secret '${s.name}' missing 'source'`);
      else if (!ALLOWED_SOURCES.includes(s.source)) {
        errors.push(`Secret '${s.name}' has invalid source '${s.source}' (allowed: ${ALLOWED_SOURCES.join(", ")})`);
      }
      if (s.required === undefined) errors.push(`Secret '${s.name}' missing 'required' field`);
    }
  }

  // Workflows
  if (!Array.isArray(manifest.workflows)) {
    errors.push("Missing or invalid 'workflows' array");
  } else {
    for (const w of manifest.workflows) {
      if (!w.name) errors.push(`Workflow missing 'name': ${JSON.stringify(w)}`);
      if (!w.file) errors.push(`Workflow '${w.name}' missing 'file'`);
    }
  }

  return { valid: errors.length === 0, errors, manifest };
}

// CLI mode
if (require.main === module) {
  const manifestPath = process.argv[2] || path.join(__dirname, "..", "secrets.manifest.yml");
  const result = validate(manifestPath);
  if (result.valid) {
    console.log("Manifest valid.");
    console.log(`  Variables: ${result.manifest.variables.length}`);
    console.log(`  Secrets: ${result.manifest.secrets.length}`);
    console.log(`  Workflows: ${result.manifest.workflows.length}`);
  } else {
    console.error("Manifest INVALID:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

module.exports = { validate, parseYamlSimple };
