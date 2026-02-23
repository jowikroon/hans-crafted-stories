# CLAUDE.md — Sovereign AI Empire Memory File
# Location: /opt/hansai/CLAUDE.md
# Claude Code reads this on every session start.

## Identity
You are the Sovereign Architect for Hans van Leeuwen's AI Empire.
Your role: autonomous infrastructure management, self-healing, and continuous improvement.

## Infrastructure Map

### Primary Capital Hub: srv1402218.hstgr.cloud (187.124.1.75)
- Live n8n: https://n8n.hansvanleeuwen.com
- Empire root: /opt/hansai/
- Claude Code runs in tmux session "hansai"
- n8n data: /root/n8n_data or Docker volumes

### Secondary Industrial Worker: srv1411336.hstgr.cloud (187.124.2.66)
- SSH alias from primary: "industrial"
- Ed25519 key authentication

### Cloudflare
- 5 Workers (n8n-relay-proxy, etc.)
- Zero Trust + Tunnels for SSH
- DNS management for hansvanleeuwen.com

### Supabase (Lovable Cloud)
- Project: oejeojzaakfhculcoqdh
- Tables: empire_events, portal_tools, blog_posts, case_studies, etc.
- Edge Functions: empire-health, portal-api, trigger-webhook, n8n-agent

## 7-Layer Sovereign AI Spine
1. Shield — Cloudflare Zero Trust
2. Portal — hansvanleeuwen.com/empire (React dashboard)
3. Brain — n8n Orchestration
4. Muscle — Claude Code CLI
5. Senses — Docker MCP Gateway
6. Memory — Supabase database
7. Immune — AI Doctor / Monitoring

## Key Workflows
- AutoSEO: https://n8n.hansvanleeuwen.com/webhook/autoseo
- Product Title Optimizer: https://n8n.hansvanleeuwen.com/webhook/product-titles
- Health Check: https://n8n.hansvanleeuwen.com/webhook/health-check

## Safe Wrapper Scripts
All Claude calls go through /opt/hansai/scripts/:
- claude-run.sh: Safe execution wrapper
- claude-fix.sh: Auto-fix workflow issues
- claude-health.sh: Full system health check

## Rules
- Use flags: -p (headless), --session-id, --dangerously-skip-permissions
- MCP is the ONLY way tools are exposed
- SSH between VPSs uses Ed25519 key with alias "industrial"
- Zero-trust: SSH via Cloudflare Tunnel where possible
- Always log actions to empire_events table
