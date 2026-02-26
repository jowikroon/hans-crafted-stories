

# Fix User Delete & Re-Create Flow

## Problem
When you delete a user and try to re-create them, errors occur because:
1. **Incomplete deletion** -- only the `portal_profiles` row is deleted, leaving orphaned records in `user_roles`, `user_tool_access`, `user_content_access`, and `user_ai_access`
2. **Auth user persists** -- the authentication account is never removed, triggering "already registered" on re-creation
3. **Upsert conflict mismatch** -- the `user_roles` upsert uses `onConflict: "user_id"` but the actual unique constraint is `(user_id, role)`, causing SQL errors

## Solution

### 1. Add `delete_user` action to the backend function

Add a new `delete_user` case in `portal-api/index.ts` that properly cleans up everything in the correct order:
- Delete from `user_tool_access` (by user_id)
- Delete from `user_content_access` (by user_id)
- Delete from `user_ai_access` (by user_id)
- Delete from `user_roles` (by user_id)
- Delete from `portal_profiles` (by user_id)
- Delete the auth user via `supabase.auth.admin.deleteUser(userId)`

### 2. Fix the `create_user` upsert conflict

Change the `user_roles` upsert from `onConflict: "user_id"` to `onConflict: "user_id,role"` to match the actual database unique constraint.

### 3. Update the frontend delete handler

Update `PortalUsersManager.tsx` to call the new `delete_user` edge function action (passing `user_id`) instead of the client-side `usersApi.deleteProfile()` which only deletes the profile row.

## Files to Change

- **`supabase/functions/portal-api/index.ts`** -- add `delete_user` action, fix `user_roles` upsert conflict key
- **`src/components/portal/PortalUsersManager.tsx`** -- update `handleDeleteUser` to call edge function

