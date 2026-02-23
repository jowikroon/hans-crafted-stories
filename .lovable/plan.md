
# Add Product-Style Attributes to Tool Cards

## Overview
Transform portal tool cards into rich, product-like entries by creating a new `tool_attributes` table in the database. Each tool (identified by its unique name) can have multiple key-value attributes like SKU, EAN, version, category, URL, etc. These attributes are displayed on the tool cards and in the preview modal.

## Database Changes

### New table: `tool_attributes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| tool_id | uuid (FK) | References `portal_tools.id` ON DELETE CASCADE |
| key | text | Attribute name (e.g. "SKU", "EAN", "Version") |
| value | text | Attribute value |
| created_at | timestamptz | Default `now()` |

- Unique constraint on `(tool_id, key)` -- no duplicate attribute names per tool
- RLS policies mirroring `portal_tools`: users can only CRUD attributes for their own tools (joined via `portal_tools.user_id`)

## UI Changes

### 1. Tool Cards on Portal Dashboard (`Portal.tsx`)
- Show up to 2-3 attributes as small key:value badges below the description on each card
- Truncate gracefully if there are many attributes

### 2. Tool Preview Modal (`ToolPreviewModal.tsx`)
- Display all attributes in a clean list between the description and the webhook config section
- Each attribute shown as a label-value pair in a subtle grid layout

### 3. Tool Settings Modal (`ToolSettingsModal.tsx`)
- Add an "Attributes" section below the existing fields
- List existing attributes with inline edit and delete
- "Add Attribute" row with key + value inputs
- Save/delete attributes via API calls

### 4. Add Tool Modal (`AddToolModal.tsx`)
- Add a simple "Attributes" section where users can add initial key-value pairs during creation

### 5. API Layer (`src/lib/api/portal.ts`)
- Add `ToolAttribute` interface
- Add CRUD functions: `getAttributes(toolId)`, `addAttribute(toolId, key, value)`, `updateAttribute(id, value)`, `deleteAttribute(id)`
- Update `getTools` to optionally fetch attributes alongside tools

## Technical Details

### Data Model
```text
portal_tools (1) ----< (many) tool_attributes
  id                          id
  name (unique identifier)    tool_id (FK)
  description                 key (e.g. "SKU")
  tool_type                   value (e.g. "WH-001")
  config                      created_at
  ...
```

### RLS Policies for `tool_attributes`
- SELECT: `EXISTS (SELECT 1 FROM portal_tools WHERE id = tool_id AND user_id = auth.uid())`
- INSERT: same check
- UPDATE: same check  
- DELETE: same check

### Files Modified
- **Migration**: New `tool_attributes` table with RLS
- `src/lib/api/portal.ts` -- Add `ToolAttribute` type and CRUD functions
- `src/pages/Portal.tsx` -- Fetch and display attributes on cards
- `src/components/portal/ToolPreviewModal.tsx` -- Show full attribute list
- `src/components/portal/ToolSettingsModal.tsx` -- Attribute management UI
- `src/components/portal/AddToolModal.tsx` -- Initial attribute entry during creation
