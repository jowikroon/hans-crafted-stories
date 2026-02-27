# Cursor Skills Discovery — Reference

## Primary sources

| Source | URL | What to use |
|--------|-----|-------------|
| **Agent Skill Source** | https://agentskillsource.com/browse?runtime=cursor | Skills for Cursor. Sort: **Trending**, **Most Popular**, **Newest**, **Highest Rated**. Filter: runtime=Cursor, optionally Verified. |
| **Cursor Directory** | https://cursor.directory | Rules, MCP servers, news, learning. Community hub. |
| **Agent Skill (alternate)** | https://agentskill.sh/for/cursor | Cursor-specific skill listings. |

## GitHub collections (curated packs)

- **aussiegingersnap/cursor-skills** — Core (feature-build, documentation, versioning), UI/frontend (Next.js, design systems), backend (PostgreSQL, REST), infrastructure.
- **daniel-scrivner/cursor-skills** — PRD generation, task breakdown, PR management, AI workflows.

Install from GitHub: clone or copy skill folders into `.cursor/skills/` (project) or `~/.cursor/skills/` (personal). Do **not** create skills under `~/.cursor/skills-cursor/` (reserved).

## Install syntax (Agent Skill Source)

- Typical pattern: `/learn @owner/skill-name` (confirm on the skill’s page; format may vary).
- Always read the skill’s page for the exact install command.

## Matching criteria for “best match”

1. **Tags/description** — Match project stack (e.g. React, TypeScript, Vite, Supabase, Cloudflare, Tailwind, n8n).
2. **Outcome** — Match current work: code review, tests, security, API design, frontend, backend, infra, docs.
3. **Popularity** — Prefer skills with higher view/rating counts and “Trending” or “Most Popular” placement.
4. **Stability** — Prefer Verified, recently updated, or from the GitHub collections above.

## Subagents / command templates

- Cursor’s built-in subagents (e.g. explore, shell, generalPurpose) are documented in Cursor; no separate “skill install” for those.
- Command templates and rule packs may appear in Cursor Directory or in GitHub repos; treat them like skills for discovery (match to project, prefer popular/curated).
