

# Make Delivery Options Real

The current delivery system is entirely simulated -- selecting any option just shows a fake success message after 1.6 seconds. This plan replaces the fake `pickDelivery` handler with real execution paths that use the infrastructure already available.

---

## What Actually Works Today

Before wiring delivery, here's what the system can really do:

- **AI chat** (hansai-chat edge function) -- streaming text responses
- **n8n webhooks** (trigger-webhook edge function) -- fire n8n workflows (autoseo, product-titles, scraper, campaign, etc.)
- **Google Agent** (google-agent edge function) -- Gmail/Sheets read via OAuth
- **Health check** (empire-health edge function) -- infrastructure status
- **Slack connector** -- available but not yet wired
- **Firecrawl connector** -- available for site audits

---

## New Delivery Model: Only Real Options

Replace the 6 delivery type groups (18 options) with options that map to real capabilities. Remove anything that would fake success.

### Revised `DELIVERY_OPTIONS`

**data** (pricing scans, keyword gaps, product lists):
- "Show in Chat" -- render results as formatted markdown in the message area (uses AI or n8n response)
- "CSV Download" -- generate a CSV blob from the response data and trigger browser download (client-side, no backend needed)
- "Send to n8n" -- forward the command + data to the relevant n8n webhook for further processing

**alert** (price drops, stock alerts):
- "Send to Slack" -- post alert config to Slack via the connected Slack connector gateway
- "Create n8n Monitor" -- trigger n8n to create a scheduled monitoring workflow
- "Show in Chat" -- display the alert setup confirmation

**report** (rankings, traffic, audits):
- "Show in Chat" -- render the full report as markdown with tables/charts
- "CSV Download" -- export tabular data as downloadable CSV
- "Email via n8n" -- trigger an n8n workflow that sends the report by email (n8n handles Gmail)

**content** (SEO titles, descriptions, product copy):
- "Show in Chat" -- preview generated content inline for review and editing
- "CSV Download" -- export as spreadsheet-ready CSV
- "Send to n8n" -- push to n8n for Channable/store integration

**action** (deploy, schedule, create board):
- "Execute via n8n" -- trigger the relevant n8n webhook immediately
- "Show Plan" -- have the AI explain what will happen before executing

**comms** (emails, drafts):
- "Show Draft" -- render the email/message in chat for copy-paste
- "Send via n8n" -- trigger n8n Gmail workflow to create the draft

---

## Implementation Changes

### 1. `commandCenterData.ts` -- Rewrite delivery options

Replace all 6 delivery groups with the realistic options above. Each option gets a new `action` field that tells the handler what to actually do:

```typescript
interface DeliveryOption {
  icon: string;
  label: string;
  note: string;
  best?: boolean;
  action: "show_chat" | "csv_download" | "send_n8n" | "send_slack" | "show_plan";
}
```

### 2. `useCommandCenter.ts` -- Real `pickDelivery` handler

Replace the fake delay with actual logic branching on `action`:

- **"show_chat"**: Take the picked action's `cmd`, send it through `sendToAI()` or `streamAI()` (depending on mode), and render the AI's response as the result. This is the simplest real path -- the AI interprets the command and returns formatted content.

- **"csv_download"**: Same as show_chat, but after the AI response arrives, parse any table/list data from the response and generate a CSV Blob, then create a temporary download link (`URL.createObjectURL`) and click it programmatically.

- **"send_n8n"**: Match the picked action's category to a workflow from `WORKFLOWS` config (e.g., pricing actions map to the autoseo or product-titles workflow). Call `triggerWorkflow()` with the action's `cmd` as the message payload. Display the n8n response in chat.

- **"send_slack"**: Check if Slack connector is available (SLACK_API_KEY secret). If yes, call the Slack connector gateway via a new edge function to post the message. If not connected, show a message asking the user to connect Slack.

- **"show_plan"**: Send the action's `cmd` to AI with a modified prompt prefix ("Explain what this will do step-by-step, don't execute yet"), render the explanation, then offer an "Execute" button.

### 3. CSV Download utility (new helper)

Add a small utility function `downloadCSV(content: string, filename: string)` that:
- Parses markdown tables or JSON arrays from AI responses
- Converts to CSV string
- Creates Blob and triggers download
- Lives in `src/lib/utils/csv.ts`

### 4. Update action-to-workflow mapping

Create a mapping function that connects category actions to real n8n workflows:
- `pricing` actions -> could use `autoseo` or `product-titles` webhook
- `seo` actions -> `autoseo` webhook
- `product` actions -> `product-titles` webhook
- `automate` actions -> `n8n-agent` (AI builds the workflow)
- `infra` actions -> `empire-health` (direct)
- `comms` actions -> `google-agent`
- Others -> fall through to `sendToAI()` for AI-powered response

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/command-center/commandCenterData.ts` | Rewrite `DELIVERY_OPTIONS` with real action-mapped options, add `action` field to `DeliveryOption` type |
| `src/hooks/useCommandCenter.ts` | Replace fake `pickDelivery` with real execution branching on delivery action type |
| `src/lib/utils/csv.ts` | New -- CSV generation and download utility |

---

## What This Does NOT Include (Honest Boundaries)

- No PDF generation (would need a library or external service)
- No direct Magento/Shopify push (no store API keys configured)
- No Google Sheets write (OAuth write scope not set up)
- No direct email sending (routes through n8n which has Gmail credentials)
- Monday.com board creation only works if n8n has the Monday credential wired

Every option shown to the user will either work immediately or clearly explain what's needed to make it work (e.g., "Connect Slack to enable this").

