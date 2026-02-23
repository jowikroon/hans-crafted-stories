#!/bin/bash
# ══════════════════════════════════════════════════════════
# Sovereign AI Empire — Bootstrap Script
# Run on: srv1402218.hstgr.cloud (Primary Capital Hub)
# Usage: curl -sSL https://hansvanleeuwen.com/empire/setup.sh | bash
# ══════════════════════════════════════════════════════════

set -euo pipefail

EMPIRE_ROOT="/opt/hansai"
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sovereign AI Empire — Bootstrap${NC}"
echo -e "${CYAN}══════════════════════════════════════════════${NC}"

# ── Step 1: Create directory structure ───────────────
echo -e "${GREEN}[1/5]${NC} Creating empire directory structure..."
mkdir -p "$EMPIRE_ROOT"/{scripts,mcp-servers,logs,backups}

# ── Step 2: Download CLAUDE.md ───────────────────────
echo -e "${GREEN}[2/5]${NC} Downloading CLAUDE.md..."
curl -sSL https://hansvanleeuwen.com/empire/CLAUDE.md -o "$EMPIRE_ROOT/CLAUDE.md"

# ── Step 3: Download docker-compose.yml ──────────────
echo -e "${GREEN}[3/5]${NC} Downloading docker-compose.yml..."
curl -sSL https://hansvanleeuwen.com/empire/docker-compose.yml -o "$EMPIRE_ROOT/docker-compose.yml"

# ── Step 4: Create safe wrapper scripts ──────────────
echo -e "${GREEN}[4/5]${NC} Creating wrapper scripts..."

cat > "$EMPIRE_ROOT/scripts/claude-run.sh" << 'WRAPPER'
#!/bin/bash
# Safe Claude Code execution wrapper
SESSION_ID="${1:-default}"
PROMPT="${2:-}"
if [ -z "$PROMPT" ]; then
  echo "Usage: claude-run.sh <session-id> <prompt>"
  exit 1
fi
claude -p --session-id "$SESSION_ID" --dangerously-skip-permissions "$PROMPT"
WRAPPER

cat > "$EMPIRE_ROOT/scripts/claude-health.sh" << 'HEALTH'
#!/bin/bash
# Full system health check
echo "=== Sovereign AI Empire Health Check ==="
echo ""
echo "--- n8n ---"
curl -s -o /dev/null -w "Status: %{http_code} | Latency: %{time_total}s\n" https://n8n.hansvanleeuwen.com/healthz
echo ""
echo "--- Portal ---"
curl -s -o /dev/null -w "Status: %{http_code} | Latency: %{time_total}s\n" https://hansvanleeuwen.com
echo ""
echo "--- Docker containers ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not available"
echo ""
echo "--- Disk usage ---"
df -h / | tail -1
echo ""
echo "--- Memory ---"
free -h | head -2
HEALTH

chmod +x "$EMPIRE_ROOT/scripts/"*.sh

# ── Step 5: Initialize tmux session ──────────────────
echo -e "${GREEN}[5/5]${NC} Setting up tmux session..."
if ! tmux has-session -t hansai 2>/dev/null; then
  tmux new-session -d -s hansai -c "$EMPIRE_ROOT"
  echo "  Created tmux session 'hansai'"
else
  echo "  tmux session 'hansai' already exists"
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Empire initialized at $EMPIRE_ROOT${NC}"
echo -e "${CYAN}══════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. tmux attach -t hansai"
echo "  2. cd $EMPIRE_ROOT && docker compose up -d"
echo "  3. Visit https://hansvanleeuwen.com/empire"
