---
name: cursor-skills-discovery
description: Discovers and suggests Cursor skills, subagents, and command templates from community sources. Checks for new and trending stable skills, matches to project context, and recommends by popularity. Use when the user asks for skill suggestions, self-improvement for Cursor, new skills to try, daily or weekly skill check, or trending agent skills.
---

# Cursor Skills Discovery

Recommends best-matching Cursor skills, subagents, and command templates from curated sources. Prefer **trending** and **popular** when suggesting; match suggestions to the project stack and existing skills.

## When to Use This Skill

- User asks for new skills to install, self-improvement ideas, or "what skills should I add?"
- User wants a daily or periodic check for new/trending skills
- User mentions Agent Skill Source, Cursor Directory, or community skills

## Discovery Workflow

1. **Identify context**  
   From the project (e.g. `.cursor/rules/project-context.mdc` or repo): tech stack, main tasks (frontend, backend, infra, AI). Note existing skills in `.cursor/skills/` or `~/.cursor/skills/` if visible.

2. **Check primary sources** (see [reference.md](reference.md) for URLs and details):
   - **Agent Skill Source** (agentskillsource.com) — sort by **Trending** or **Most Popular**; filter runtime **Cursor**. Use view/rating numbers to rank. Prefer **Verified** when available.
   - **Cursor Directory** (cursor.directory) — rules, MCP servers, news.
   - **GitHub collections** — e.g. `aussiegingersnap/cursor-skills`, `daniel-scrivner/cursor-skills` for curated packs.

3. **Match and rank**  
   - **Best match**: skills whose tags/description align with project stack (e.g. React, TypeScript, Supabase, Cloudflare) or current task.  
   - **Popularity**: prefer higher views/ratings and "Trending" or "Most Popular" sort.  
   - **Stability**: prefer skills that are verified, recently updated, or from known collections.

4. **Suggest with install hint**  
   For each suggestion give: name, one-line purpose, why it fits (project/task match), and how to install if known (e.g. `/learn @owner/skill-name` or repo install steps from [reference.md](reference.md)).

## Output Format

Present suggestions in a short list:

```markdown
## Suggested skills (by relevance + popularity)

1. **[Skill Name]** — One-line description.  
   *Why*: Matches [project stack / current task].  
   *Install*: [command or link]

2. ...
```

If the user asked for a "daily check", add one line: *Tip: Run this again periodically or set a reminder to catch new skills.*

## Frequency

- **Daily check**: When the user asks for a "daily" or "every day" check, run this workflow once and remind them they can re-run or schedule a recurring reminder.
- No automatic daily execution; the agent runs this when invoked (e.g. "check for new Cursor skills today").

## Additional Resources

- Full source URLs, install commands, and matching criteria: [reference.md](reference.md)
- Sample prompts and example output: [examples.md](examples.md)
