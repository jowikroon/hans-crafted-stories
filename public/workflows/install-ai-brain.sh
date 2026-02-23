#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AI Brain — Ollama + Open WebUI Installer
# Target: VPS 2 (srv1411336.hstgr.cloud / 187.124.2.66)
# Run as root: bash install-ai-brain.sh
# ============================================================

VPS1_IP="187.124.1.75"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  AI Brain — Ollama + Open WebUI Install  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System Update ─────────────────────────────────────
echo "[1/7] Updating system..."
apt-get update -qq > /dev/null 2>&1
apt-get upgrade -y -qq > /dev/null 2>&1
apt-get install -y -qq docker.io docker-compose-v2 ufw curl > /dev/null 2>&1
systemctl enable --now docker > /dev/null 2>&1
echo "  ✓ System updated, Docker installed"

# ── 2. Swap Space ────────────────────────────────────────
echo "[2/7] Configuring swap space (critical for 8GB RAM)..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Optimize for LLM workloads
    sysctl vm.swappiness=10 > /dev/null
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "  ✓ 4GB swap created, swappiness set to 10"
else
    echo "  ✓ Swap already exists"
fi

# ── 3. Firewall ──────────────────────────────────────────
echo "[3/7] Configuring firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1                                    # SSH
ufw allow from $VPS1_IP to any port 11434 > /dev/null 2>&1           # Ollama from VPS 1 only
ufw allow 3000/tcp > /dev/null 2>&1                                  # Open WebUI (restrict later)
ufw --force enable > /dev/null 2>&1
echo "  ✓ Firewall: SSH open, Ollama locked to VPS 1, Open WebUI on :3000"

# ── 4. Deploy Directory ─────────────────────────────────
echo "[4/7] Setting up deployment..."
mkdir -p /opt/ai-brain
cd /opt/ai-brain

# Write docker-compose.yml inline
cat > docker-compose.yml << 'COMPOSE_EOF'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_KEEP_ALIVE=10m
      - OLLAMA_MAX_LOADED_MODELS=1
      - OLLAMA_NUM_CTX=8192
    deploy:
      resources:
        limits:
          memory: 7G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    restart: unless-stopped
    ports:
      - "3000:8080"
    volumes:
      - openwebui_data:/app/backend/data
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - ENABLE_SIGNUP=true
      - ENABLE_RAG_WEB_SEARCH=true
      - RAG_WEB_SEARCH_ENGINE=duckduckgo
      - RAG_EMBEDDING_ENGINE=ollama
      - RAG_EMBEDDING_MODEL=nomic-embed-text
      - RAG_CHUNK_SIZE=1000
      - RAG_CHUNK_OVERLAP=200
      - ENABLE_OLLAMA_API=true
      - ENABLE_OPENAI_API=true
      - TASK_MODEL=llama3.2:3b
      - TITLE_GENERATION_PROMPT_TEMPLATE="Create a concise 3-5 word title. Only the title. {{prompt}}"
    depends_on:
      ollama:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_SCHEDULE=0 0 4 * * *
      - WATCHTOWER_SCOPE=ai-brain
      - WATCHTOWER_CLEANUP=true
    labels:
      - "com.centurylinklabs.watchtower.scope=ai-brain"

volumes:
  ollama_data:
  openwebui_data:
COMPOSE_EOF

echo "  ✓ docker-compose.yml written"

# ── 5. Start Containers ─────────────────────────────────
echo "[5/7] Starting containers (this takes 1-2 minutes)..."
docker compose up -d 2>&1 | grep -E "Created|Started|Running" || true
echo "  ✓ Containers starting"

# Wait for Ollama to be healthy
echo "  Waiting for Ollama to initialize..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "  ✓ Ollama is ready"
        break
    fi
    sleep 2
done

# ── 6. Pull Models ───────────────────────────────────────
echo "[6/7] Pulling AI models (this takes 5-15 minutes on first run)..."
echo "  Pulling embedding model (nomic-embed-text, ~274MB)..."
docker exec ollama ollama pull nomic-embed-text 2>&1 | tail -1
echo "  ✓ Embedding model ready"

echo "  Pulling fast model (llama3.2:3b, ~2GB)..."
docker exec ollama ollama pull llama3.2:3b 2>&1 | tail -1
echo "  ✓ Fast model ready"

echo "  Pulling primary model (qwen2.5:7b-instruct-q4_K_M, ~4.7GB)..."
echo "  (This is the big one — ~5 minutes on a good connection)"
docker exec ollama ollama pull qwen2.5:7b-instruct-q4_K_M 2>&1 | tail -1
echo "  ✓ Primary model ready"

# ── 7. Verify ────────────────────────────────────────────
echo "[7/7] Verification..."
echo ""

# Check Ollama
MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('models',[])))" 2>/dev/null || echo "0")
echo "  Ollama: $MODELS models loaded"

# Check Open WebUI
sleep 5
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    echo "  Open WebUI: ✓ Accessible"
else
    echo "  Open WebUI: Starting (may take 30s more)..."
fi

# Quick inference test
echo ""
echo "  Running quick inference test..."
RESPONSE=$(curl -s http://localhost:11434/api/generate \
    -d '{"model":"llama3.2:3b","prompt":"Say hello in one sentence.","stream":false}' \
    2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('response','FAILED')[:80])" 2>/dev/null || echo "PENDING")
echo "  Test response: $RESPONSE"

echo ""
echo "═══════════════════════════════════════════"
echo "  AI BRAIN — DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════"
echo ""
echo "  Open WebUI:  http://$(hostname -I | awk '{print $1}'):3000"
echo "  Ollama API:  http://$(hostname -I | awk '{print $1}'):11434"
echo ""
echo "  NEXT STEPS:"
echo "  1. Open WebUI in browser → create admin account"
echo "  2. Disable public signup: Admin → Settings → General"
echo "  3. Set default model: Admin → Settings → Models"
echo "  4. Upload knowledge base docs for RAG"
echo ""
echo "  MODELS INSTALLED:"
docker exec ollama ollama list 2>/dev/null || echo "  (check with: docker exec ollama ollama list)"
echo ""
echo "  FROM VPS 1 (n8n), call Ollama at:"
echo "  http://187.124.2.66:11434/api/generate"
echo ""
