/**
 * 2-merge-and-draft.js
 * n8n Code Node — runs AFTER the "Wait for Webhook" node receives
 * Claude's Phase 2 POST with Hans's verified editorial instructions.
 *
 * Input:  $json from the Wait node
 *         Expected fields: { confirmed, updated_brand_voice, final_article_prompt }
 *         Plus category carried forward from Phase 1 via $('Webhook').item.json.category
 *
 * Actions:
 *   1. Prepares the SQL update payload to save updated_brand_voice back to
 *      Supabase `hans_blog_memory`.
 *   2. Merges the updated brand voice context and final prompt into a strict
 *      payload for the downstream LLM node (Anthropic / OpenAI).
 *
 * Output: Two items:
 *   [0] — supabase_update: payload for an n8n "HTTP Request" node (PATCH to Supabase)
 *   [1] — llm_payload: merged prompt payload for the LLM node
 */

const SUPABASE_URL = $env.SUPABASE_URL;
const SUPABASE_ANON_KEY = $env.SUPABASE_ANON_KEY;

// --- Inputs ---
const confirmed = $json.confirmed;
const updatedBrandVoice = $json.updated_brand_voice || '';
const finalArticlePrompt = $json.final_article_prompt || '';

// Category from the original webhook trigger (carried through the execution)
// Adjust the node name reference if your Webhook node has a different name.
const category = $('Webhook').item.json.category?.trim() || $json.category?.trim();

if (!confirmed) {
  return {
    json: {
      status: 'aborted',
      message: 'Hans did not confirm. Execution halted — no draft generated, no memory updated.',
    },
  };
}

if (!category) {
  return {
    json: {
      status: 'error',
      message: 'Category could not be resolved. Check workflow data passthrough.',
    },
  };
}

// --- 1. Supabase UPSERT payload ---
// Uses the PostgREST upsert via Prefer: resolution=merge-duplicates header.
// This handles both new categories (INSERT) and existing ones (UPDATE).

const supabaseUpdate = {
  url: `${SUPABASE_URL}/rest/v1/hans_blog_memory`,
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
  },
  body: JSON.stringify({
    content_category: category,
    brand_voice_context: updatedBrandVoice,
    // narrative_history will be updated AFTER the post is generated,
    // in a downstream node that appends the new post summary.
  }),
};

// --- 2. LLM prompt payload ---
// Strict structure for the Anthropic/OpenAI node downstream.

const llmPayload = {
  system: [
    'You are the ghostwriter for Hans van Leeuwen\'s blog at hansvanleeuwen.com.',
    'Write in the first person as Hans.',
    `Brand voice rules:\n${updatedBrandVoice}`,
    'Output format: Markdown. Include a meta title, meta description, and the full article body.',
    'Do not use motivational fluff, trend-chasing language, or generic advice.',
    'Every claim must be grounded in the provided context or clearly marked as opinion.',
  ].join('\n\n'),
  prompt: finalArticlePrompt,
  category: category,
  max_tokens: 4000,
  temperature: 0.7,
};

// --- Return both payloads for downstream nodes ---
return [
  {
    json: {
      output_type: 'supabase_update',
      ...supabaseUpdate,
    },
  },
  {
    json: {
      output_type: 'llm_payload',
      ...llmPayload,
    },
  },
];
