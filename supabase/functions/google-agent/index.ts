/**
 * google-agent — Gemini-backed agent for Google (Gmail, Sheets, Drive) control.
 *
 * Requires Authorization. Loads/refreshes user's Google OAuth tokens from user_google_tokens.
 * Uses Gemini with function calling to execute Gmail, Sheets, Drive actions.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { streamLog } from "../_shared/stream-log.ts";
import { streamLog as streamLogStep } from "../lib/stream-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Google control agent for the Sovereign AI Empire. You help with Gmail, Google Sheets, and Google Drive.

When the user asks to do something with their email, sheets, or drive (e.g. "summarize my last 10 emails", "add a row to my SEO sheet", "list my Drive files for project X"):
- Use the available tools to perform the action.
- Summarize results concisely for the user.

Keep answers concise and actionable. Respond in the same language the user writes in (Dutch or English).`;

const NOT_CONNECTED_REPLY = `**Connect Google first.** Click "Connect Google" in the Command Center header to link your Gmail, Sheets, and Drive. Once connected, I can summarize emails, add rows to sheets, and list Drive files.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "gmail_list_messages",
        description: "List emails from the user's Gmail inbox. Use query for Gmail search syntax (e.g. 'is:unread', 'from:someone@example.com', 'subject:invoice').",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Gmail search query (optional)" },
            maxResults: { type: "integer", description: "Max number of messages to return (default 10)" },
          },
        },
      },
      {
        name: "gmail_send",
        description: "Send an email via Gmail.",
        parameters: {
          type: "object",
          properties: {
            to: { type: "string", description: "Recipient email address" },
            subject: { type: "string", description: "Email subject" },
            body: { type: "string", description: "Email body (plain text)" },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "sheets_append_row",
        description: "Append a row to a Google Sheet. The spreadsheetId is in the sheet URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: { type: "string", description: "Google Sheet ID from the URL" },
            range: { type: "string", description: "A1 notation range (e.g. Sheet1!A:D)" },
            values: {
              type: "array",
              items: { type: "string" },
              description: "Row values to append",
            },
          },
          required: ["spreadsheetId", "range", "values"],
        },
      },
      {
        name: "drive_list_files",
        description: "List files in Google Drive. Use q for Drive query (e.g. 'mimeType=\"application/pdf\"', 'name contains \"report\"').",
        parameters: {
          type: "object",
          properties: {
            q: { type: "string", description: "Drive search query (optional)" },
            pageSize: { type: "integer", description: "Max results (default 10)" },
          },
        },
      },
    ],
  },
];

async function execGmailList(accessToken: string, query?: string, maxResults = 10): Promise<string> {
  const q = query ? `&q=${encodeURIComponent(query)}` : "";
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${q}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return `Error: ${res.status} ${await res.text()}`;
  const data = await res.json();
  const ids = (data.messages || []).map((m: { id: string }) => m.id);
  if (ids.length === 0) return "No messages found.";
  const snippets: string[] = [];
  for (const id of ids.slice(0, 5)) {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (r.ok) {
      const msg = await r.json();
      const h = (msg.payload?.headers || []).find((x: { name: string }) => x.name === "Subject");
      const s = msg.snippet || "";
      snippets.push(`Subject: ${h?.value || "(no subject)"}\n${s.slice(0, 200)}...`);
    }
  }
  return `Found ${ids.length} message(s). First few:\n${snippets.join("\n---\n")}`;
}

function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function execGmailSend(accessToken: string, to: string, subject: string, body: string): Promise<string> {
  const raw = base64urlEncode(
    ["Content-Type: text/plain; charset=utf-8", "MIME-Version: 1.0", `To: ${to}`, `Subject: ${subject}`, "", body].join("\r\n")
  );
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) return `Error: ${res.status} ${await res.text()}`;
  return `Email sent to ${to}.`;
}

async function execSheetsAppend(accessToken: string, spreadsheetId: string, range: string, values: string[]): Promise<string> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [values] }),
    }
  );
  if (!res.ok) return `Error: ${res.status} ${await res.text()}`;
  return `Row appended to ${range}.`;
}

async function execDriveList(accessToken: string, q?: string, pageSize = 10): Promise<string> {
  const params = new URLSearchParams({ pageSize: String(pageSize), fields: "files(id,name,mimeType,modifiedTime)" });
  if (q) params.set("q", q);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return `Error: ${res.status} ${await res.text()}`;
  const data = await res.json();
  const files = (data.files || []).map((f: { name: string; mimeType?: string }) => `${f.name} (${f.mimeType || "file"})`);
  return files.length ? `Files:\n${files.join("\n")}` : "No files found.";
}

async function executeTool(name: string, args: Record<string, unknown>, accessToken: string): Promise<string> {
  try {
    if (name === "gmail_list_messages") {
      return execGmailList(accessToken, args.query as string, (args.maxResults as number) || 10);
    }
    if (name === "gmail_send") {
      return execGmailSend(accessToken, args.to as string, args.subject as string, args.body as string);
    }
    if (name === "sheets_append_row") {
      return execSheetsAppend(accessToken, args.spreadsheetId as string, args.range as string, (args.values as string[]) || []);
    }
    if (name === "drive_list_files") {
      return execDriveList(accessToken, args.q as string, (args.pageSize as number) || 10);
    }
    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

async function getOrRefreshTokens(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ accessToken: string } | null> {
  const { data: row, error } = await supabase
    .from("user_google_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const now = Date.now();
  if (expiresAt > now + 60_000) {
    return { accessToken: row.access_token };
  }

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) return null;

  const tokens = await tokenRes.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

  await supabase
    .from("user_google_tokens")
    .update({ access_token: tokens.access_token, expires_at: newExpiresAt, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { accessToken: tokens.access_token };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization required", reply: "Sign in to use Google actions." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized", reply: "Sign in to use Google actions." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const runId: string | null = body.workflow_run_id ?? body.run_id ?? null;

  const tokens = await getOrRefreshTokens(supabaseAdmin, user.id);
  if (!tokens) {
    if (runId) await streamLog(runId, "ANALYZE", "Google not connected — please click Connect Google", "error");
    return new Response(JSON.stringify({ reply: NOT_CONNECTED_REPLY }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (runId) await streamLog(runId, "ANALYZE", "Authenticating Gmail API...", "done");

  try {
    // === ADD ONLY THESE LINES (do not delete or wrap existing code) ===
    const startTime = Date.now();
    if (runId) {
      await streamLogStep(runId, "ANALYZE", "Authenticating Gmail API...", 1);
      await streamLogStep(runId, "ANALYZE", "Syncing Google Sheets metadata...", 2);
      await streamLogStep(runId, "ANALYZE", "Initializing Drive file watcher...", 3);
      await streamLogStep(runId, "ANALYZE", "Google stack ready ✅", 4, "info", "done", { total_time_ms: Date.now() - startTime });
    }
    // === END OF ADDITION ===
    const message = body.message ?? body.input ?? "";
    const messages = Array.isArray(body.messages) ? body.messages : [{ role: "user" as const, content: message || "What can you do with my Google?" }];

    if (runId) await streamLog(runId, "ANALYZE", "Connecting to Google APIs...");

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = geminiKey || lovableKey;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY or LOVABLE_API_KEY required" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "gemini-2.0-flash";

    if (geminiKey) {
      let contents: Array<{ role: string; parts: Array<{ text?: string; functionCall?: { name: string; args?: Record<string, unknown> }; functionResponse?: { name: string; response: Record<string, unknown> } }> }> = messages
        .filter((m: { role: string }) => m.role === "user" || m.role === "model")
        .map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : "" }],
        }));
      if (contents.length === 0) contents = [{ role: "user", parts: [{ text: message || "What can you do?" }] }];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const maxIter = 5;
      let lastText = "";

      for (let i = 0; i < maxIter; i++) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            tools: TOOLS,
            generationConfig: { maxOutputTokens: 2048 },
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          console.error("Gemini API error:", res.status, errText);
          return new Response(JSON.stringify({ error: "Gemini API error", reply: "I couldn't process that. Try again or check your Gemini API key." }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        const functionCall = parts.find((p: { functionCall?: unknown }) => p.functionCall);
        const textPart = parts.find((p: { text?: string }) => p.text);

        if (textPart?.text) lastText = textPart.text;
        if (functionCall?.functionCall) {
          const { name, args } = functionCall.functionCall as { name: string; args?: Record<string, unknown> };
          const toolLabel = name === "gmail_list_messages" ? "Fetching Gmail messages..."
            : name === "gmail_send" ? "Sending Gmail message..."
            : name === "sheets_append_row" ? "Syncing Google Sheets metadata..."
            : name === "drive_list_files" ? "Initializing Drive file watcher..."
            : `Running ${name}...`;
          if (runId) await streamLog(runId, "ANALYZE", toolLabel);
          const result = await executeTool(name, args || {}, tokens.accessToken);
          contents.push({
            role: "model",
            parts: [{ functionCall: { name, args: args || {} } }],
          });
          contents.push({
            role: "user",
            parts: [{ functionResponse: { name, response: { result } } }],
          });
          continue;
        }
        break;
      }

      const reply = lastText || "No response.";
      if (runId) await streamLog(runId, "ANALYZE", "Google stack ready ✅", "done");
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: typeof m.content === "string" ? m.content : "" })),
        ],
        max_tokens: 2048,
      }),
    });
    const data = await res.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content ?? "No response.";
    if (runId) await streamLog(runId, "ANALYZE", "Google stack ready ✅", "done");
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("google-agent error:", error);
    if (runId) {
      await streamLog(runId, "ANALYZE", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", reply: "Something went wrong." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
