/**
 * 1-lookup-brand-voice.js
 * n8n Code Node — runs inside the "hans-blog-init" webhook workflow.
 *
 * Input:  $json from the Webhook trigger node
 *         Expected fields: { category, raw_idea_or_data, proposed_angle }
 *
 * Action: Queries Supabase `hans_blog_memory` for the matching content_category.
 *         Formats the result so the next "Respond to Webhook" node can
 *         instantly return editorial history + the execution resume URL to Claude.
 *
 * Output: Single item with the response payload for "Respond to Webhook".
 */

const SUPABASE_URL = $env.SUPABASE_URL;        // e.g. https://pesfakewujjwkyybwaom.supabase.co
const SUPABASE_ANON_KEY = $env.SUPABASE_ANON_KEY;
const category = $json.category?.trim();

if (!category) {
  return {
    json: {
      status: 'error',
      message: 'Missing required field: category',
    },
  };
}

// --- Query Supabase for editorial memory ---
const endpoint = `${SUPABASE_URL}/rest/v1/hans_blog_memory?content_category=eq.${encodeURIComponent(category)}&select=brand_voice_context,narrative_history,updated_at`;

const response = await fetch(endpoint, {
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

if (!response.ok) {
  return {
    json: {
      status: 'error',
      message: `Supabase query failed: ${response.status} ${response.statusText}`,
    },
  };
}

const rows = await response.json();
const memory = rows.length > 0 ? rows[0] : null;

// --- Build the response payload for "Respond to Webhook" node ---
// $execution.resumeUrl is injected by n8n when using a "Wait" node downstream.
// The workflow must have a "Wait for Webhook" node AFTER this Code node +
// "Respond to Webhook" node so that n8n generates the resume URL.

const resumeUrl = $execution.resumeUrl;

return {
  json: {
    status: 'verify_editorial_history',
    brand_voice: memory?.brand_voice_context || '',
    recent_posts: memory?.narrative_history || '',
    memory_exists: !!memory,
    memory_last_updated: memory?.updated_at || null,
    category: category,
    raw_idea_or_data: $json.raw_idea_or_data || '',
    proposed_angle: $json.proposed_angle || '',
    resume_url: resumeUrl,
  },
};
