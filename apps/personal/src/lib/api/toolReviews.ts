import { supabase } from '@/integrations/supabase/client';
export interface ToolReview { tool_id: string; user_id: string; rating: number; verdict: string; notes: string }
export const toolReviewsApi = {
  async get(toolId: string, userId: string): Promise<ToolReview | null> {
    const { data, error } = await supabase.from('portal_tool_reviews' as never).select('*').eq('tool_id', toolId).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data as unknown as ToolReview | null;
  },
  async save(review: ToolReview) {
    const { error } = await supabase.from('portal_tool_reviews' as never).upsert(review as never, { onConflict: 'user_id,tool_id' });
    if (error) throw error;
  },
};
