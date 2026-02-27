# Monday.com MCP setup

Connect Cursor (and other AI tools) to monday.com via the **remote MCP** — no servers to run, OAuth-based access, full GraphQL API.

**Official docs:** [github.com/mondaycom/mcp](https://github.com/mondaycom/mcp)  
**MCP server URL:** `https://mcp.monday.com/mcp`

---

## 1. Install the Monday MCP app (monday.com)

Your admin must install the remote MCP app and grant access to the workspaces the AI should use.

- [Monday MCP app in the marketplace](https://monday.com/marketplace/listing/10000806/monday-mcp)
- Click **Install** and follow the instructions.

---

## 2. Connect in Cursor

- In Cursor chat, run: **`/mcp auth monday`**
- Or use the connection link from the [official MCP docs](https://github.com/mondaycom/mcp) (Cursor section).
- Complete the OAuth flow; approve access when prompted.

---

## 3. What you can do (from a prompt)

| Example prompt | Action |
|----------------|--------|
| “Add a design-review task and assign to me” | Create items, assign owners |
| “Set all due-today items to in progress” | Update columns |
| “Assign this task to Alex and set due date to Friday” | Assign owners & dates |
| “Add an update with a link to the latest draft” | Post updates |
| “Summarize this sprint board in one line” | Summarize boards |
| “Show me deals closing this week assigned to me” | Pull insights |

You can also use **slash commands:** type `/monday:` and choose e.g. `/monday:create-item`, `/monday:analyze-board`, `/monday:sprint-summary`.

---

## 4. Verify connection

- In Cursor chat run **`/mcp list`** — you should see `monday` (or `monday-mcp`) in the list.
- Run **`/mcp desc monday`** — lists tools (e.g. `create_item`, `get_board_schema`, `list_users_and_teams`).
- Ask the AI: *“List users and teams in my monday account”* or *“What’s the schema of board 123?”* — if the agent can call Monday tools, the connection works.

If `monday` does not appear in `/mcp list`, add the server in Cursor MCP settings (`url: "https://mcp.monday.com/mcp"`) and run **`/mcp auth monday`** again.

---

## 5. Automation ideas (once connected)

Use these as prompts or building blocks for AI + Monday workflows:

| Idea | Example prompt / use |
|------|----------------------|
| **Daily standup prep** | “List my assigned items due this week from board X and summarize status.” |
| **Bulk status updates** | “Set all items in group ‘Backlog’ on board 123 to status ‘In progress’.” |
| **Sprint rollover** | “Create items on the next sprint board for every ‘Not done’ item in current sprint.” |
| **Deal/CRM summary** | “Show deals closing this week assigned to me; summarize in one line each.” |
| **Design-review pipeline** | “Add a design-review task, assign to [name], set due date to Friday, add link to Figma in updates.” |
| **Board summaries** | “Summarize this sprint board in one line.” / “Analyze board 456 and suggest bottlenecks.” |
| **Comment/update from AI** | “Add an update to item 789 with a link to the latest draft and a short summary.” |
| **New board from template** | “Create a board for project [name] with columns: Status, Owner, Due date, Priority.” |
| **Assignee balancing** | “List items by assignee on board X and flag anyone with more than 5 open items.” |
| **Due-date triage** | “List all items due today across boards I have access to; set overdue ones to ‘Needs review’.” |
| **Form → board** | “Create a form for feedback and map submissions to board 123.” |
| **Cross-board report** | “Pull items from boards A and B where status is ‘Done’ this week and summarize.” |

Combine with **n8n** (your Brain on VPS 1) to trigger these from Slack, email, or schedules.

---

## Troubleshooting

- **Auth fails:** Ensure the MCP app is installed and your account has access to the boards you need.
- **Check connection:** `/mcp list` (is `monday` connected?), `/mcp desc monday` (available tools).
