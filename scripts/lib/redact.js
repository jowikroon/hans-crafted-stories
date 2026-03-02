/**
 * Log redaction helper.
 * Masks values of known secret patterns before they reach stdout/stderr.
 */

const SECRET_PATTERNS = [
  /API_KEY/i, /TOKEN/i, /SECRET/i, /PASSWORD/i,
  /SERVICE_ROLE/i, /ENCRYPTION/i, /MASTER_KEY/i,
];

function isSecretName(name) {
  return SECRET_PATTERNS.some((p) => p.test(name));
}

function mask(value) {
  if (!value || typeof value !== "string") return "***";
  if (value.length <= 8) return "***";
  return value.slice(0, 4) + "***" + value.slice(-4);
}

function redactEnvValue(name, value) {
  return isSecretName(name) ? mask(value) : value;
}

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    if (u.searchParams.has("key")) u.searchParams.set("key", "***");
    if (u.searchParams.has("token")) u.searchParams.set("token", "***");
    if (u.searchParams.has("apiKey")) u.searchParams.set("apiKey", "***");
    return u.toString();
  } catch {
    return url;
  }
}

function redactObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isSecretName(k) && typeof v === "string") {
      out[k] = mask(v);
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function safeLog(...args) {
  const redacted = args.map((a) =>
    typeof a === "object" && a !== null ? JSON.stringify(redactObject(a)) : String(a)
  );
  console.log("[secrets]", ...redacted);
}

function safeError(...args) {
  const redacted = args.map((a) =>
    typeof a === "object" && a !== null ? JSON.stringify(redactObject(a)) : String(a)
  );
  console.error("[secrets]", ...redacted);
}

module.exports = {
  isSecretName,
  mask,
  redactEnvValue,
  redactUrl,
  redactObject,
  safeLog,
  safeError,
};
