#!/bin/bash
# SessionStart hook (Claude Code on the web only).
# 1. Installs the repo MCP servers' dependencies (health-guardian,
#    workflow-orchestrator); without them both fail with ERR_MODULE_NOT_FOUND.
# 2. Installs the monorepo workspaces so lint, typecheck and tests run.
# Idempotent: mcp-setup skips servers that already have node_modules, and
# npm install is a no-op on a warm, cached container.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

npm run --silent mcp:setup
npm install --no-audit --no-fund
