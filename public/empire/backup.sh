#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Sovereign AI Empire — Docker Volume Backup
# Run on VPS 1 (Capital Hub): bash backup.sh
# Schedule via cron: 0 3 * * * /opt/hansai/backup.sh >> /var/log/hansai-backup.log 2>&1
# ============================================================

BACKUP_DIR="/opt/hansai/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
VPS2_IP="187.124.2.66"

echo ""
echo "═══════════════════════════════════════"
echo "  BACKUP — ${DATE}"
echo "═══════════════════════════════════════"

mkdir -p "${BACKUP_DIR}"

# ── 1. n8n data (VPS 1) ──────────────────────────────────────
echo "[1/4] Backing up n8n data..."
if docker volume inspect n8n_data > /dev/null 2>&1; then
    docker run --rm \
        -v n8n_data:/source:ro \
        -v "${BACKUP_DIR}":/backup \
        alpine tar czf "/backup/n8n_data_${DATE}.tar.gz" -C /source .
    echo "  ✓ n8n_data → n8n_data_${DATE}.tar.gz"
elif [ -d /root/n8n_data ]; then
    tar czf "${BACKUP_DIR}/n8n_data_${DATE}.tar.gz" -C /root/n8n_data .
    echo "  ✓ /root/n8n_data → n8n_data_${DATE}.tar.gz"
else
    echo "  ⚠ No n8n data volume or directory found, skipping"
fi

# ── 2. MCP Gateway + configs (VPS 1) ─────────────────────────
echo "[2/4] Backing up Empire configs..."
if [ -d /opt/hansai ]; then
    tar czf "${BACKUP_DIR}/hansai_configs_${DATE}.tar.gz" \
        --exclude='backups' \
        --exclude='node_modules' \
        -C /opt hansai
    echo "  ✓ /opt/hansai → hansai_configs_${DATE}.tar.gz"
else
    echo "  ⚠ /opt/hansai not found, skipping"
fi

# ── 3. Observability data (VPS 1) ────────────────────────────
echo "[3/4] Backing up Loki + Grafana volumes..."
for vol in loki-data grafana-data; do
    if docker volume inspect "${vol}" > /dev/null 2>&1; then
        docker run --rm \
            -v "${vol}":/source:ro \
            -v "${BACKUP_DIR}":/backup \
            alpine tar czf "/backup/${vol}_${DATE}.tar.gz" -C /source .
        echo "  ✓ ${vol} → ${vol}_${DATE}.tar.gz"
    fi
done

# ── 4. Remote: Ollama models list (VPS 2) ────────────────────
echo "[4/4] Recording Ollama model inventory on VPS 2..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no industrial \
    "docker exec ollama ollama list" > "${BACKUP_DIR}/ollama_models_${DATE}.txt" 2>/dev/null; then
    echo "  ✓ Model list saved to ollama_models_${DATE}.txt"
else
    echo "  ⚠ Could not reach VPS 2 (industrial), skipping Ollama inventory"
fi

# ── 5. Rotate old backups ────────────────────────────────────
echo ""
echo "Rotating backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
DELETED_TXT=$(find "${BACKUP_DIR}" -name "*.txt" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "  Removed $((DELETED + DELETED_TXT)) old backup files"

# ── Summary ──────────────────────────────────────────────────
echo ""
TOTAL=$(du -sh "${BACKUP_DIR}" 2>/dev/null | awk '{print $1}')
COUNT=$(find "${BACKUP_DIR}" -type f | wc -l)
echo "═══════════════════════════════════════"
echo "  BACKUP COMPLETE"
echo "  Location: ${BACKUP_DIR}"
echo "  Files: ${COUNT} | Size: ${TOTAL}"
echo "═══════════════════════════════════════"
echo ""
