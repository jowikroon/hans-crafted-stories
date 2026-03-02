

## Fix: Make trigger-webhook resilient to missing workflow_runs table

### Problem
The `trigger-webhook` edge function returns HTTP 500 when it can't insert into `workflow_runs` (table doesn't exist in the schema cache). This blocks all `/run` commands like health-check.

### Solution
Update `supabase/functions/trigger-webhook/index.ts` with three changes:

1. **Best-effort insert** -- Wrap the `workflow_runs` insert in a try/catch. If it fails, log the error but continue instead of returning 500.

2. **Fallback run_id** -- When the insert fails, generate a `run_id` using `crypto.randomUUID()` so the response still includes a valid ID.

3. **Conditional updates** -- Only update `workflow_runs` (status to "processing" or "error") when the initial insert actually succeeded. Use a boolean flag `dbAvailable` to track this.

### Technical changes

**File: `supabase/functions/trigger-webhook/index.ts`**

Replace the current insert block (steps 3-4) with:

```text
// Step 3: Best-effort insert
let run_id: string = crypto.randomUUID();
let dbAvailable = false;

try {
  const { data: run, error: insertError } = await supabaseAdmin
    .from("workflow_runs")
    .insert({ user_id: user.id, status: "pending" })
    .select("id")
    .single();

  if (!insertError && run) {
    run_id = run.id;
    dbAvailable = true;
  } else {
    console.warn("[trigger-webhook] workflow_runs insert failed (non-fatal):", insertError);
  }
} catch (dbErr) {
  console.warn("[trigger-webhook] workflow_runs unavailable (non-fatal):", dbErr);
}

// Only update to "processing" if DB insert succeeded
if (dbAvailable) {
  await supabaseAdmin.from("workflow_runs").update({ status: "processing" }).eq("id", run_id);
}
```

Similarly, only update status to "error" inside the n8n fetch error handlers when `dbAvailable` is true.

The final response remains: `{ success: true, run_id, data: { run_id } }` regardless of DB availability.

### Deployment
After updating the file, the edge function will be deployed automatically so the live site gets the fix immediately.

