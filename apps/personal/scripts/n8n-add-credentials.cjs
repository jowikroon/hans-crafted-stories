#!/usr/bin/env node
/**
 * Add n8n credentials via the n8n REST API.
 *
 * Prerequisites:
 * 1. n8n API enabled (e.g. N8N_API_ENABLED=true) and an API key created in n8n: Settings → n8n API.
 * 2. Env loaded from config/all-credentials.export.env (or .env) including:
 *    - N8N_BASE_URL or N8N_URL = your n8n instance (e.g. https://n8n.srv1402218.hstgr.cloud)
 *    - N8N_API_KEY (from n8n Settings → API)
 *    - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *    - ANTHROPIC_API_KEY, OPENAI_API_KEY, MONDAY_API_TOKEN (optional: FIRECRAWL_API_KEY)
 *
 * Run (from project root):
 *   node scripts/n8n-add-credentials.js
 * Or with explicit env file:
 *   npx dotenv -e config/all-credentials.export.env -- node scripts/n8n-add-credentials.js
 *
 * Google Sheets and Gmail require OAuth and cannot be added via this script — add them in the n8n UI.
 */

const { safeLog, safeError, redactEnvValue } = require('./lib/redact.cjs');

const baseUrl = process.env.N8N_BASE_URL || process.env.N8N_URL;
const apiKey = process.env.N8N_API_KEY;

if (!baseUrl || !apiKey) {
  safeError('Missing N8N_BASE_URL (or N8N_URL) or N8N_API_KEY. Load config/all-credentials.export.env or set them in the environment.');
  process.exit(1);
}

safeLog('n8n base URL:', baseUrl);
safeLog('N8N_API_KEY:', redactEnvValue('N8N_API_KEY', apiKey));

const apiBase = baseUrl.replace(/\/$/, '') + '/api/v1';

async function request(method, path, body = null) {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  const opts = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || res.statusText || `HTTP ${res.status}`);
  }
  return data;
}

async function createCredential(name, type, data) {
  const payload = { name, type, data };
  return request('POST', '/credentials', payload);
}

async function main() {
  const errors = [];
  const created = [];

  // Supabase — type from n8n: supabaseApi (Supabase node uses "Supabase API" credential)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      await createCredential('Prod - Supabase Service Role', 'supabaseApi', {
        host: supabaseUrl.replace(/\/$/, ''),
        serviceRoleSecret: supabaseServiceKey,
      });
      created.push('Prod - Supabase Service Role');
    } catch (e) {
      errors.push({ name: 'Supabase', error: e.message });
    }
  } else {
    console.warn('Skip Supabase: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.');
  }

  // Anthropic — type: anthropicApi (LangChain/Anthropic node)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      await createCredential('Prod - Anthropic Claude', 'anthropicApi', { apiKey: anthropicKey });
      created.push('Prod - Anthropic Claude');
      // Also create "AnthropicApi" if workflows expect that exact name
      await createCredential('AnthropicApi', 'anthropicApi', { apiKey: anthropicKey });
      created.push('AnthropicApi');
    } catch (e) {
      errors.push({ name: 'Anthropic', error: e.message });
    }
  } else {
    console.warn('Skip Anthropic: ANTHROPIC_API_KEY not set.');
  }

  // OpenAI — type: openAiApi; some n8n versions want headerName/headerValue
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      await createCredential('Prod - OpenAI', 'openAiApi', {
        apiKey: openAiKey,
        headerName: 'Authorization',
        headerValue: `Bearer ${openAiKey}`,
      });
      created.push('Prod - OpenAI');
    } catch (e) {
      errors.push({ name: 'OpenAI', error: e.message });
    }
  } else {
    console.warn('Skip OpenAI: OPENAI_API_KEY not set.');
  }

  // Monday.com — type: mondayComApi (or mondayApi)
  const mondayToken = process.env.MONDAY_API_TOKEN;
  if (mondayToken) {
    try {
      await createCredential('Prod - Monday.com', 'mondayComApi', { apiToken: mondayToken });
      created.push('Prod - Monday.com');
    } catch (e) {
      errors.push({ name: 'Monday.com', error: e.message });
    }
  } else {
    console.warn('Skip Monday.com: MONDAY_API_TOKEN not set.');
  }

  // Firecrawl (optional) — generic HTTP auth; n8n may use httpHeaderAuth or similar
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (firecrawlKey) {
    try {
      await createCredential('Prod - Firecrawl', 'httpHeaderAuth', {
        headerName: 'Authorization',
        headerValue: `Bearer ${firecrawlKey}`,
      });
      created.push('Prod - Firecrawl');
    } catch (e) {
      errors.push({ name: 'Firecrawl', error: e.message });
    }
  }

  console.log('\nCreated:', created.length ? created.join(', ') : 'none');
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach(({ name, error }) => console.error(`  ${name}: ${error}`));
    process.exit(1);
  }
  console.log('\nDone. Google Sheets and Gmail must be added in the n8n UI (OAuth).');
}

main();
