# Deploy all Supabase Edge Functions from this repo.
# Run from repo root after: npx supabase login && npx supabase link --project-ref <NEW_REF>
# See docs/migrate-supabase-to-own-org.md (Path B).

$ErrorActionPreference = "Stop"
$functions = @(
    "trigger-webhook",
    "hansai-chat",
    "intent-router",
    "portal-api",
    "n8n-agent",
    "empire-health",
    "site-audit",
    "keyword-research",
    "monday-webhook",
    "monday-trigger-agent",
    "ai-content-suggest",
    "llm-resume",
    "n8n-create-workflow",
    "n8n-filter-proxy",
    "create-workflow-run",
    "google-agent",
    "google-oauth-start",
    "google-oauth-callback",
    "universal-router",
    "connector-status"
)

$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root "supabase\functions"))) {
    Write-Error "Run from repo root or ensure supabase/functions exists. Root: $root"
}
Set-Location $root

foreach ($fn in $functions) {
    $dir = Join-Path (Join-Path "supabase" "functions") $fn
    if (Test-Path $dir) {
        Write-Host "Deploying $fn ..."
        npx supabase functions deploy $fn
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } else {
        Write-Warning "Skip $fn (no $dir)"
    }
}
Write-Host "All functions deployed."
