
# Replace Mock Tools with Real External Tools

## Overview
Remove all mock/placeholder tool cards from the portal and replace them with 6 real tools that open their URLs in a new browser tab when clicked.

## The 6 Real Tools

| Tool | URL | Category |
|------|-----|----------|
| Product Page Optimizer | prod-analyzr-jxfz5rfa.manus.space | SEO |
| Brake Parts Aftermarket Analysis | brakeanalyz-hvwkapnb.manus.space | Data |
| Automotive Parts SEO | ecomseo-jiyf4by2.manus.space | SEO |
| Samantha AI Installer | lxoikquq.manus.space | AI |
| Explore the Universe | zxuvekje.manus.space | General |
| Personal Finance Dashboard | finadvisor-l6m9fwie.manus.space | Data |

## Technical Plan

### 1. Database: Clear old tools and insert real ones
- Delete all existing portal_tools rows (they are mock/test data)
- Insert the 6 real tools with `tool_type: "external"` and their URLs stored in `config.external_url`

### 2. Add "external" tool type support
- **AddToolModal.tsx**: Add "External App (opens in new tab)" to the tool type selector with a URL input field
- **PortalToolsTab.tsx**: Remove the `defaultTools` array entirely (no more auto-seeding of mock data). Update `handleOpenTool` to detect `tool_type === "external"` and call `window.open(url, '_blank')` instead of opening a modal
- **ToolPreviewModal.tsx**: When tool is external, the "Open Tool" button opens the URL in a new tab via `window.open`
- **SortableToolCard.tsx**: Add `"external"` to the `toolTypeLabel` map (label: "External App") and to `punchyDescriptions`

### 3. Flow when user clicks an external tool card
1. Click card -> opens the ToolPreviewModal showing tool details
2. Click "Open Tool" -> `window.open(config.external_url, '_blank')` opens the app in a new browser tab
3. Alternatively: direct click behavior can bypass the preview and go straight to the URL (configurable)

### 4. Keep existing tool types working
All existing types (webhook, iframe, keyword, site-audit, workflow, ai-agent) continue to function as before. Only mock seed data is removed.
