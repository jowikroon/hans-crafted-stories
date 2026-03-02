import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function streamLog(
  runId: string,
  step: string,
  substep: string,
  sequence: number,
  level: 'info' | 'warn' | 'error' = 'info',
  status: 'running' | 'done' | 'error' = 'running',
  metadata: Record<string, unknown> = {}
) {
  const payload: Record<string, unknown> = {
    workflow_run_id: runId,
    step,
    substep,
    sequence_number: sequence,
    log_level: level,
    status,
    metadata: { ...metadata, started_at: new Date().toISOString() },
    ...(status !== 'running' && { completed_at: new Date().toISOString() }),
  };
  if (level === 'error') payload.error_message = (metadata?.error as string) || 'Unknown error';

  await supabase.from('workflow_logs').insert(payload);
}
