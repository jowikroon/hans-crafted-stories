# Context Keeper — Agent #1

Audits and repairs all CLAUDE.md files in the hans-crafted-stories empire.
Run after any infrastructure change, new environment variable, or file structure update.

## Trigger

```bash
# Manual
claude skill context-keeper

# Via n8n (automated, after git push)
POST https://n8n.srv1402218.hstgr.cloud/webhook/context-keeper
```

## What This Skill Does

1. **Scans** all CLAUDE.md files across the repo
2. **Diffs** them against actual codebase state (packages, env vars, ports, scripts)
3. **Scores** each file (A–F) on: commands, architecture, patterns, conciseness, currency
4. **Reports** gaps and drift as a structured quality report
5. **Proposes** targeted additions (never deletes existing content)
6. **Applies** updates after user confirmation

## Workflow

### Phase 1 — Discovery
```bash
find . -name "CLAUDE.md" -o -name ".claude.md" -o -name ".claude.local.md" | sort
```

### Phase 2 — Codebase State Snapshot
```bash
# Check actual ports in use
grep -r "port" docker-compose.yml .env.* --include="*.json" | grep -v node_modules

# Check actual env vars defined
grep -rh "^VITE_" .env.example | cut -d= -f1 | sort

# Check apps in monorepo
ls apps/

# Check recent git changes
git log --oneline -10
git diff HEAD~5 --name-only | grep -E "\.(ts|tsx|json|yml|sh)$" | head -20
```

### Phase 3 — Drift Detection

For each CLAUDE.md, check:
- [ ] All `VITE_*` vars from `.env.example` are documented
- [ ] All `apps/*` directories are mentioned
- [ ] All Docker service ports match `docker-compose.yml`
- [ ] SSH hosts match `.env.*` VPS variables
- [ ] All 4 agents are listed with current commands
- [ ] Quick Start commands are copy-paste ready and correct

### Phase 4 — Quality Report

Output scoring table then propose diffs. Wait for approval before writing.

**Score weights:**
| Criterion | Weight |
|-----------|--------|
| Commands present & runnable | 20 |
| Architecture matches reality | 20 |
| Non-obvious patterns documented | 15 |
| Conciseness (no fluff) | 15 |
| Currency (reflects latest git) | 15 |
| Actionability (copy-paste ready) | 15 |

### Phase 5 — Apply Updates

Use Edit tool with targeted additions only. Never delete existing sections.

## Files This Skill Manages

| File | Grade Target |
|------|-------------|
| `./CLAUDE.md` | A (90+) |
| `./apps/personal/CLAUDE.md` | B+ (75+) |
| `./apps/saas/CLAUDE.md` | B+ (75+) |
| `./apps/personal/public/empire/CLAUDE.md` | A (90+) |

## Supabase Logging

After each run, log to `empire_events`:
```json
{
  "event_type": "context-keeper-run",
  "files_audited": 4,
  "avg_score": 85,
  "updates_applied": 2,
  "timestamp": "ISO8601"
}
```

## Tips

- Press `#` in Claude Code to instantly add learnings to CLAUDE.md mid-session
- Use `.claude.local.md` for personal prefs not shared with team
- Keep commands under 80 chars per line for readability
