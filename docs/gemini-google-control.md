# Gemini access to control Google (Gmail, Sheets, Drive)

This doc describes how to add **Gemini-backed control of your Google side** (Gmail, Google Sheets, Drive, Calendar) from the Command Center and n8n.

---

## Current state

| Layer | What you have |
|-------|----------------|
| **AI models** | Command Center and edge functions use **Gemini** (e.g. `google/gemini-2.5-flash`, `google/gemini-3-flash-preview`) via the **Lovable AI gateway** (`LOVABLE_API_KEY`). No direct Google Gemini API key in the project. |
| **Google apps** | **Gmail** and **Google Sheets** are used only inside **n8n** via OAuth2 (Prod - Gmail, Prod - Google Sheets). No single “control everything on Google” entry point from the app. |

So: Gemini is used for chat/classification; Google services are used via n8n workflows and OAuth. There is no unified “Gemini + Google” control yet.

---

## Goal: “Gemini access to control everything on our Google side”

Two complementary directions:

1. **Direct Gemini API (optional)**  
   Use a **Google Gemini API key** (from [Google AI Studio](https://aistudio.google.com/) or Vertex AI) so you can call Gemini yourself instead of (or in addition to) the Lovable gateway. Useful for tool-calling and future Google Workspace integrations.

2. **Unified Google control from Command Center**  
   Let users say things like “summarize my last 10 emails”, “add a row to my SEO sheet”, or “list my Drive files for project X”. That requires:
   - **Gemini** (or another LLM) to understand intent and choose actions.
   - **Google APIs** (Gmail, Sheets, Drive) with **OAuth** for the user’s account.
   - A **backend** (Supabase Edge Function or n8n) that:
     - Receives the user’s request,
     - Calls Gemini (with tool/function definitions for Gmail, Sheets, Drive),
     - Executes the chosen actions via Google APIs using the user’s OAuth tokens.

---

## Option A: Add a direct Gemini API key (recommended first step)

- **Where:** [Google AI Studio](https://aistudio.google.com/) → Get API key, or use Vertex AI in Google Cloud.
- **In the project:** Add to `config/all-credentials.export.env` (and Supabase Edge secrets if an edge function will call Gemini):
  - `GEMINI_API_KEY=<your-key>`
- **Use:**  
  - Edge functions can call `https://generativelanguage.googleapis.com/v1beta/models/...` with this key instead of (or as fallback to) the Lovable gateway.  
  - Enables future **Gemini with function calling** so the model can “decide” to send an email, update a sheet, or list Drive files; your backend then runs the corresponding Google API calls.

**Secrets manifest:** Add `GEMINI_API_KEY` to `n8n/secrets.manifest.yml` as optional, scope e.g. `edge-functions`, `google-control`.

---

## Option B: Unified “Google control” flow (Command Center → Gemini + Google APIs)

High-level architecture:

1. **Intent:** User says “Check my Gmail for support requests” or “Add a row to the SEO sheet” in Command Center (or HansAI).
2. **Routing:** Either a dedicated “Google” intent/workflow or the existing intent router classifies the request as “Google action”.
3. **Backend (new Edge Function or n8n workflow):**
   - Has access to the user’s **Google OAuth tokens** (stored after a one-time “Connect Google” in the app, e.g. in Supabase or n8n credentials).
   - Calls **Gemini** with a system prompt and **tools** (e.g. `gmail_list_messages`, `gmail_send`, `sheets_append_row`, `drive_list_files`).
   - Gemini returns tool calls (e.g. “call `gmail_list_messages` with query X”).
   - Backend executes those calls via **Gmail API**, **Sheets API**, **Drive API** using the user’s OAuth.
   - Response is sent back to the user (e.g. summary of emails, “Row added”, list of files).

**What you need:**

- **OAuth for “our Google”:**  
  You already have an OAuth client for n8n (Gmail/Sheets). For the app, you can either:
  - Reuse the same client and add a redirect URI for your app (e.g. `https://your-app.com/auth/google/callback`), and store tokens in Supabase (e.g. `user_google_tokens` table), or  
  - Use a separate OAuth client for the web app and store tokens there.
- **Scopes:** Request at least `gmail.readonly` / `gmail.modify`, `spreadsheets`, `drive.readonly` (or `drive`) depending on what you want to allow.
- **Backend:** New Supabase Edge Function (e.g. `google-agent`) or an n8n workflow triggered by the Command Center that:
  - Loads the user’s Google tokens,
  - Calls Gemini with tool definitions,
  - Maps Gemini’s tool calls to Gmail/Sheets/Drive API calls and returns the result.

This gives you “Gemini access to control everything on our Google side” from one place (Command Center).

---

## Option C: Use only n8n + existing OAuth (no new backend)

- Keep using **n8n** for all Gmail/Sheets (and optionally Drive) actions.
- Add **n8n workflows** that are triggered by the Command Center (e.g. “Run Gmail summary” or “Append to sheet”) and that use your existing **Prod - Gmail** and **Prod - Google Sheets** credentials.
- **Gemini** can still be used in the Command Center (or in n8n via a Gemini node if available) to interpret the user’s request and then trigger the right n8n workflow with parameters.

Here “Gemini” is the brain that decides what to do; “control” is still executed by n8n with your current Google OAuth.

---

## Recommended order

1. **Add `GEMINI_API_KEY`** to the project (config + secrets manifest) and optionally wire one edge function to use it. No product change yet, but ready for next steps.
2. **Design the “Google” intent** in the Command Center (e.g. keywords, or LLM classification) and a single entry point (e.g. “Google” workflow or `google-agent` edge function).
3. **Implement Option B** (unified flow with Gemini + Google APIs and stored OAuth) for the best “control everything on our Google side” experience, or **Option C** (n8n-only) for a faster path reusing current OAuth in n8n.

---

---

## Implemented: google-agent with Connect Google

The **google-agent** Edge Function and OAuth flow are implemented:

1. **Token storage:** `user_google_tokens` table (migration) with RLS.
2. **OAuth flow:** `google-oauth-start` and `google-oauth-callback` Edge Functions.
3. **Frontend:** "Connect Google" button in Command Center; sends `Authorization` when invoking the Google workflow.
4. **google-agent:** Requires auth, loads/refreshes tokens, uses Gemini with function calling (Gmail, Sheets, Drive).

### Env vars (Supabase Edge secrets)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Direct Gemini API for function calling (required for tools; Lovable gateway does not support tools) |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_OAUTH_STATE_SECRET` | (Optional) Sign OAuth state; if unset, a default is used |
| `APP_ORIGIN` | App origin for OAuth redirect (e.g. `https://your-app.com` or `http://localhost:5173`) |

### Google Cloud Console — add redirect URI

If reusing the n8n OAuth client (or using a dedicated one), add this **Authorized redirect URI**:

```
https://<project-ref>.supabase.co/functions/v1/google-oauth-callback
```

Replace `<project-ref>` with your Supabase project reference (e.g. `oejeojzaakfhculcoqdh`).

### Config files

- `config/all-credentials.export.env.example` — template with `GOOGLE_OAUTH_*`, `APP_ORIGIN`
- `n8n/secrets.manifest.yml` — `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_STATE_SECRET`

---

## References

- [Automate Google Workspace tasks with the Gemini API](https://codelabs.developers.google.com/codelabs/gemini-workspace) (function calling, Gmail/Sheets/Drive).
- [Google AI Studio](https://aistudio.google.com/) for API keys.
- Project: `docs/n8n-credentials-setup.md` (Google OAuth for n8n); `docs/empire-n8n-flow.md` (edge functions, n8n).
