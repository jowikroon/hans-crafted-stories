

# Add User Activity Log to Portal Users

## Overview
Add a per-user "Activity" event log section within each user's expanded panel in the Portal Users manager. This will track and display actions like logins, permission changes, tool usage, and content edits for each user.

## Database Changes

### New table: `user_activity_log`
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | The user the event belongs to |
| action | text | NOT NULL | e.g. "login", "tool_used", "permission_changed" |
| description | text | '' | Human-readable detail |
| metadata | jsonb | '{}' | Extra context (tool name, IP, etc.) |
| created_at | timestamptz | now() | When it happened |

RLS policies:
- Admins can read/insert/delete all activity logs
- Users can view their own activity

Enable realtime so the log updates live when viewing.

## Frontend Changes

### 1. Add "Activity" section to user panel (`PortalUsersManager.tsx`)
- Add a 5th section to the `accessSections` array: `{ id: "activity", label: "Activity", icon: Activity, description: "Recent user actions" }`
- Update the `AccessSection` type to include `"activity"`
- Render a scrollable event log when the "Activity" section is selected, showing the most recent 50 events for that user in reverse chronological order
- Each row shows: timestamp, action badge (color-coded by type), and description
- Include a refresh button

### 2. Add API layer (`src/lib/api/users.ts`)
- Add `getActivityLog(userId: string)` method to fetch recent activity for a user
- Add `logActivity(userId, action, description, metadata)` method for recording events

### 3. Auto-log key actions
Insert activity log entries automatically when:
- A user's permissions are changed (tab access, tool access, content access, AI access toggles)
- A user is activated/deactivated
- A user is created

These inserts will be added inline to the existing handler functions in `PortalUsersManager.tsx`.

## Technical Details

- The activity log panel will reuse the same card/badge styling as the existing permission sections
- Events will be color-coded: green for grants/activations, amber for revocations/deactivations, blue for general actions
- No new components needed -- the log renders inline within the existing expanded panel structure
- The `user_activity_log` table uses `user_id` (not a FK to auth.users) consistent with the existing pattern

