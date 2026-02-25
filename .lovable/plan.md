

# Central Hub: Connect All Real Tools

## What We're Building
Transform the portal into the **single command center** that connects every piece of your infrastructure -- the 6 Manus apps already there, plus your Chrome extensions, n8n hub, Claude Code terminal, and Ollama AI server.

## New Tool Cards to Add

| Tool | Type | URL / Action | Category |
|------|------|-------------|----------|
| Product Page Analyzer | Chrome Extension | Download ZIP + install instructions | SEO |
| CCP Crawler | Chrome Extension | Download ZIP + install instructions | Data |
| n8n Orchestration Hub | External (iframe-capable) | n8n.hansvanleeuwen.com | Automation |
| Claude Code Terminal | External | terminal.hansvanleeuwen.com | AI |
| Ollama Local AI | External | ollama.hansvanleeuwen.com | AI |

Total: **11 tool cards** (6 existing Manus apps + 5 new infrastructure tools)

## Technical Changes

### 1. New tool type: `chrome-extension`
- Add `chrome-extension` to the database constraint alongside existing types
- When clicked, opens a preview modal showing:
  - Extension description and features
  - "Download Extension" button that downloads the ZIP from `/public/extensions/`
  - Step-by-step Chrome install instructions (chrome://extensions -> Developer mode -> Load unpacked)
- Card label: "Chrome Extension" with a Chrome-style icon

### 2. Copy extension ZIPs to project
- Copy `product-analyzer-extension-enhanced.zip` to `public/extensions/product-page-analyzer.zip`
- Copy `ccp_crawler_chrome_extension.zip` to `public/extensions/ccp-crawler.zip`
- These become downloadable assets from the portal

### 3. Database: Insert 5 new tools
Insert into `portal_tools` with proper categories, descriptions, icons and configs:
- Chrome extensions get `config.download_url` pointing to the ZIP path
- n8n gets `config.external_url` = `https://n8n.hansvanleeuwen.com`
- Claude Code gets `config.external_url` = `https://terminal.hansvanleeuwen.com`
- Ollama gets `config.external_url` = `https://ollama.hansvanleeuwen.com`

### 4. Update SortableToolCard
- Add `chrome-extension` to `toolTypeLabel` map (label: "Chrome Extension")
- Add punchy description: "Install once, analyze everywhere. Right-click any product page for instant insights."
- Add a download icon indicator for chrome-extension cards

### 5. Update ToolPreviewModal
- For `chrome-extension` type: show "Download Extension" as primary button + install instructions
- Download triggers a file download of the ZIP from `/public/extensions/`

### 6. Update AddToolModal
- Add "Chrome Extension (downloadable)" to tool type selector
- Add download URL input field when chrome-extension is selected

### 7. Update PortalToolsTab
- Add handler for `chrome-extension` type in `handleOpenTool` -- triggers ZIP download

### 8. Add "infrastructure" category
- New category in `categoryConfig`: label "Infra", purple/indigo accent
- n8n, Claude Code, and Ollama get this category for visual grouping
- Alternatively keep them in their logical categories (automation, ai) for better filtering

## Click Flow Summary

```text
External App card -> Preview Modal -> "Launch App" -> window.open(url)
Chrome Extension card -> Preview Modal -> "Download Extension" -> downloads ZIP
                                       -> Shows install steps below button
```

## Files Modified
- `supabase/migrations/` -- new migration for constraint + tool inserts
- `src/components/portal/SortableToolCard.tsx` -- chrome-extension labels
- `src/components/portal/ToolPreviewModal.tsx` -- download button + install guide
- `src/components/portal/PortalToolsTab.tsx` -- chrome-extension handler
- `src/components/portal/AddToolModal.tsx` -- chrome-extension type option
- `public/extensions/` -- 2 ZIP files copied here

