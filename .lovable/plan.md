

# Central Tools API -- Expose Portal Data to All Systems

## Problem
Right now, tool/card data is only accessible through the frontend Supabase client (which requires browser auth). Your other systems -- Claude Code on VPS, n8n workflows, Cloudflare Workers -- can't read or write tool data. You need a single API endpoint that serves as the central source of truth.

## Solution
Create a new **`portal-api`** edge function that provides a REST-style API for all tool and attribute CRUD operations. Any system with the correct API key can call it.

```
Claude Code (VPS) ──┐
n8n Hostinger    ──┤
n8n Cloud        ──┤──→  /functions/v1/portal-api  ──→  portal_tools + tool_attributes
Cloudflare       ──┤                                     (Supabase DB)
Lovable Frontend ──┘
```

## API Design

**Endpoint:** `POST /functions/v1/portal-api`

All requests use a JSON body with an `action` field:

| Action | Description | Params |
|--------|-------------|--------|
| `list_tools` | Get all tools + attributes | -- |
| `get_tool` | Get one tool by id or name | `id` or `name` |
| `create_tool` | Create a new tool | `name`, `description`, `tool_type`, `icon`, `color`, `config`, `attributes[]` |
| `update_tool` | Update a tool | `id`, fields to update |
| `delete_tool` | Delete a tool | `id` |
| `list_attributes` | Get attributes for a tool | `tool_id` |
| `add_attribute` | Add attribute | `tool_id`, `key`, `value` |
| `update_attribute` | Update attribute | `id`, `value` |
| `delete_attribute` | Delete attribute | `id` |

**Auth:** Uses the `SUPABASE_SERVICE_ROLE_KEY` server-side (bypasses RLS), secured by requiring the anon key in the `Authorization` header so only your systems can call it.

**Example call from n8n / curl:**
```
POST https://oejeojzaakfhculcoqdh.supabase.co/functions/v1/portal-api
Authorization: Bearer <anon_key>
Content-Type: application/json

{ "action": "list_tools" }
```

## Technical Details

### New file: `supabase/functions/portal-api/index.ts`
- Single edge function handling all actions via a switch on `action`
- Uses `SUPABASE_SERVICE_ROLE_KEY` to create a service-role Supabase client (bypasses RLS for server-to-server calls)
- `list_tools` and `get_tool` return tools with their attributes joined
- `create_tool` accepts an optional `attributes` array to create tool + attributes in one call
- CORS headers for browser compatibility
- JWT verification disabled (like other functions) -- relies on anon key in header

### Update: `supabase/config.toml`
- Add `[functions.portal-api]` with `verify_jwt = false`

### No frontend changes needed
- The frontend continues using `portalApi` via the Supabase JS client as before
- This new endpoint is purely for external system access

### Files
| File | Action |
|------|--------|
| `supabase/functions/portal-api/index.ts` | Create |
| `supabase/config.toml` | Add function config |

