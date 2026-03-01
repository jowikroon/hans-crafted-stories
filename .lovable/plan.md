

# Enable Google Sign-In with Lovable Cloud

## Current State
The `useAuth.tsx` file currently calls `supabase.auth.signInWithOAuth()` directly. The project already has the Lovable Cloud auth module generated at `src/integrations/lovable/index.ts` with a `lovable.auth.signInWithOAuth()` function, but it's not being used.

## Changes

### File: `src/hooks/useAuth.tsx`
- Import `lovable` from `@/integrations/lovable/index`
- Replace the `supabase.auth.signInWithOAuth()` call with `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- The Lovable Cloud module handles the OAuth flow and automatically sets the Supabase session via `supabase.auth.setSession()`
- Keep the existing `AUTH_REDIRECT_KEY` logic for post-login navigation -- the `onAuthStateChange` listener will still fire after `setSession` and redirect the user

### Google OAuth Client ID
Your custom Client ID (`773115162300-...`) can be configured through Lovable Cloud's Authentication Settings (Users -> Authentication Settings -> Sign In Methods -> Google). This is where you paste your own Client ID and Secret for branding/control purposes.

### Redirect URLs
- **Google Cloud Console** authorized redirect URI: `https://oejeojzaakfhculcoqdh.supabase.co/auth/v1/callback` (this is the backend callback)
- **App redirect after login**: handled by the `onAuthStateChange` listener which reads the saved path from `localStorage` and navigates there (defaults to `/portal`)
- The `redirect_uri` passed to `lovable.auth.signInWithOAuth` should be `window.location.origin` (the Lovable Cloud module handles the rest)

### No database changes needed

