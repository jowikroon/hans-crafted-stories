

# N8N Workflow Selector on Tool Cards

## What We're Building
Adding the ability to configure and select N8N webhook workflows directly from the tool card preview popup -- so you can set a webhook URL, give it a name, and trigger it without needing to dig into settings each time.

## Changes

### 1. Enhance the Tool Preview Modal (`ToolPreviewModal.tsx`)
- For webhook-type tools, show the currently configured webhook URL (or a prompt to set one if none exists)
- Add a "Configure Webhook" inline section that lets you paste/edit the n8n webhook URL right from the preview
- Show a quick-trigger button that sends a POST to the configured webhook with a default or custom payload
- Display a status indicator (configured vs. not configured)

### 2. Update the Webhook Trigger Modal (`WebhookTriggerModal.tsx`)
- Pre-fill the webhook URL from the tool's saved config (already partially done via `defaultWebhookUrl`)
- After a successful trigger, save the webhook URL back to the tool's config if it was changed
- Add a helper text section explaining the n8n setup steps (HTTP Method: POST, Response Mode, etc.)

### 3. Update Tool Settings Modal (`ToolSettingsModal.tsx`)
- Add a dedicated "Webhook Configuration" section for webhook-type tools with:
  - Webhook URL field (already exists)
  - A "Test Webhook" button that sends a test POST and shows success/failure inline
  - Helper text explaining expected n8n webhook format

### 4. Update Portal Page (`Portal.tsx`)
- When opening a webhook tool from the preview, pass the saved webhook URL from config
- After editing/triggering, persist the webhook URL back to the tool's config in the database via `portalApi.updateTool`

## Technical Details

### Data Flow
The webhook URL is stored in `portal_tools.config` as `{ webhook_url: "https://...", enabled: true }`. The preview modal reads it, the trigger modal uses it, and any changes get saved back via `portalApi.updateTool`.

### Files Modified
- `src/components/portal/ToolPreviewModal.tsx` -- Add webhook URL display and inline config for webhook tools
- `src/components/portal/WebhookTriggerModal.tsx` -- Add save-back logic and n8n setup guidance
- `src/components/portal/ToolSettingsModal.tsx` -- Add "Test Webhook" button
- `src/pages/Portal.tsx` -- Wire up save-back after webhook URL changes

### No Database Changes Required
All configuration is stored in the existing `config` JSONB column on `portal_tools`.

