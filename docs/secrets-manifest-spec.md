# Secrets Manifest Spec

Specification for `n8n/secrets.manifest.yml`. Safe to commit — the manifest contains **no secret values**, only metadata (names, purposes, sources, policies).

---

## Overview

The manifest is the single source of truth for:

- **Variables** — non-secret configuration (URLs, ports, timezone).
- **Secrets** — canonical names, sources, required flag, environments, rotation, scopes.
- **Per-workflow matrix** — which secrets and variables each workflow needs, and which n8n credentials (by name/type).
- **Policy** — redaction patterns, allowed secret sources, and forbidden patterns (e.g. no `Bearer ` in logs).

Validation: `node n8n/scripts/validate-manifest.cjs [path]`. Unit tests: `node n8n/scripts/validate-manifest.test.cjs`.

---

## Top-Level Fields

| Field      | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `version` | string | yes      | Schema version, e.g. `"1.0"`. |
| `variables` | array | yes    | List of non-secret configuration variables. |
| `secrets` | array  | yes      | List of secret definitions. |
| `workflows` | array | yes    | Per-workflow requirements matrix. |
| `policy`  | object | yes      | Redaction and security policy (Gate 2). |

---

## Variables

Each item in `variables` describes a **non-secret** value (URLs, ports, timezone).

| Field     | Type   | Required | Description |
|----------|--------|----------|-------------|
| `name`   | string | yes      | Env var or config key name (e.g. `N8N_BASE_URL`). |
| `default`| string | no       | Default value. Safe to commit. |
| `purpose`| string | no       | Human-readable purpose. |

Example:

```yaml
variables:
  - name: N8N_BASE_URL
    default: "https://n8n.srv1402218.hstgr.cloud"
    purpose: "n8n instance URL for API calls and webhook base"
```

---

## Secrets

Each item in `secrets` defines one canonical secret.

| Field            | Type           | Required | Description |
|-----------------|----------------|----------|-------------|
| `name`          | string         | yes      | Canonical secret name (e.g. `N8N_API_KEY`). |
| `canonical_name`| string         | no       | If present, must equal `name`. |
| `source`        | string         | yes      | One of: `ENV`, `VAULT_REF`, `N8N_CRED`. |
| `purpose`       | string         | no       | Human-readable purpose. |
| `required`      | boolean        | yes      | Whether the secret is required for the system to operate. |
| `environments`  | array of string| no       | Where the secret is used: `local`, `vps`. |
| `rotation_days`| number or null | no       | Recommended rotation interval; `null` = do not rotate. |
| `scopes`        | array of string| no       | Logical scopes (e.g. `n8n-api`, `commander`). |
| `owners`        | array of string| no       | Optional owner identifiers. |

**Source semantics:**

- **ENV** — secret is read from environment (e.g. `config/all-credentials.export.env` or server ENV).
- **VAULT_REF** — secret is stored in the vault adapter; only existence is checked, value never read by verify.
- **N8N_CRED** — secret is an n8n credential; presence is checked via n8n API (by name/type only).

Example:

```yaml
secrets:
  - name: N8N_API_KEY
    canonical_name: N8N_API_KEY
    source: ENV
    purpose: "n8n REST API authentication"
    required: true
    environments:
      - local
      - vps
    rotation_days: 90
    scopes: ["n8n-api", "commander"]
```

---

## Workflows (Per-Workflow Matrix)

Each item in `workflows` ties a workflow to its required secrets, variables, and n8n credentials.

| Field               | Type  | Required | Description |
|--------------------|-------|----------|-------------|
| `name`             | string| yes      | Workflow identifier (e.g. `secrets-registry-verify`). |
| `file`             | string| yes      | Path to workflow JSON (e.g. `n8n/workflows/secrets_registry_verify.json`). |
| `required_secrets` | array | no       | List of canonical secret names. |
| `required_variables` | array | no     | List of variable names. |
| `n8n_credentials`  | array | no       | List of `{ type, name }` for n8n credentials (names only, no values). |

Example:

```yaml
workflows:
  - name: secrets-registry-verify
    file: "n8n/workflows/secrets_registry_verify.json"
    required_secrets:
      - N8N_API_KEY
      - COMMANDER_WEBHOOK_TOKEN
    required_variables:
      - N8N_BASE_URL
      - VAULT_BASE_URL
    n8n_credentials: []
```

---

## Policy (Gate 2)

The `policy` section defines security and redaction rules. All values are safe to commit (no secret data).

| Field                 | Type  | Required | Description |
|-----------------------|-------|----------|-------------|
| `redaction_patterns`  | array | yes      | Substrings or pattern names to redact in logs (e.g. `API_KEY`, `Bearer `). |
| `allowed_sources`     | array | yes      | Allowed `source` values for secrets: `ENV`, `VAULT_REF`, `N8N_CRED`. |
| `forbidden_patterns`  | array | yes      | Patterns that must never appear in committed content (e.g. `Bearer `, `sk-`, `ghp_`). |

Example:

```yaml
policy:
  redaction_patterns:
    - "API_KEY"
    - "TOKEN"
    - "SECRET"
    - "PASSWORD"
    - "Bearer "
    - "Authorization"
    - "Cookie"
  allowed_sources:
    - ENV
    - VAULT_REF
    - N8N_CRED
  forbidden_patterns:
    - "Bearer "
    - "sk-"
    - "ghp_"
    - "xoxb-"
    - "AKIA"
```

---

## Validation Rules (Summary)

- `version` must be present.
- `variables` must be an array; each item must have `name`.
- `secrets` must be an array; each item must have `name`, `source` (in allowed list), and `required`.
- If `canonical_name` is present on a secret, it must equal `name`.
- If `environments` is present, each value must be `local` or `vps`.
- `workflows` must be an array; each item must have `name` and `file`.
- `policy` must be present with non-empty arrays: `redaction_patterns`, `allowed_sources`, `forbidden_patterns`.
- `policy.allowed_sources` may only contain `ENV`, `VAULT_REF`, `N8N_CRED` (and legacy `VAULT`).

---

## Files and Scripts

| Item | Path | Purpose |
|------|------|---------|
| Manifest | `n8n/secrets.manifest.yml` | The manifest file (safe to commit). |
| Validator | `n8n/scripts/validate-manifest.cjs` | Schema validator; exit 0/1. |
| Unit tests | `n8n/scripts/validate-manifest.test.cjs` | Unit tests for validator and manifest. |
| Spec (this doc) | `docs/secrets-manifest-spec.md` | Field reference. |

**Commands:**

- `npm run secrets:validate-manifest` — validate default manifest.
- `node n8n/scripts/validate-manifest.cjs path/to/manifest.yml` — validate given path.
- `npm run test:secrets-unit` — run manifest unit tests.

---

## Next (Gate 3+)

Gate 2 does not change runtime behavior. Gate 3 adds the vault adapter; Gate 4 ensures workflows use the manifest and policy; Gate 5/6 add Commander CLI and security sweep.
