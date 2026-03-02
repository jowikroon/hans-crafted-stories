# Fix n8n.hansvanleeuwen.com DNS so it points to Hostinger VPS (fixes 502).
# Requires: CLOUDFLARE_API_TOKEN (and optionally CLOUDFLARE_ZONE_ID).
# Usage: .\scripts\fix-n8n-dns-cloudflare.ps1

$ErrorActionPreference = "Stop"
$base = "https://api.cloudflare.com/client/v4"
$token = $env:CLOUDFLARE_API_TOKEN
$zoneId = $env:CLOUDFLARE_ZONE_ID
$targetIp = "187.124.1.75"
$zoneName = "hansvanleeuwen.com"
$recordName = "n8n"

if (-not $token) {
  Write-Host "CLOUDFLARE_API_TOKEN is not set." -ForegroundColor Red
  Write-Host "  Set it: `$env:CLOUDFLARE_API_TOKEN = 'your-token'"
  Write-Host "  Or add to .env / config and source it."
  Write-Host "  Create token at: https://dash.cloudflare.com/profile/api-tokens (Zone.DNS Edit)"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# Resolve zone ID if not set
if (-not $zoneId) {
  Write-Host "Resolving zone ID for $zoneName..."
  $zonesRes = Invoke-RestMethod -Uri "$base/zones?name=$zoneName" -Headers $headers -Method Get
  if (-not $zonesRes.result -or $zonesRes.result.Count -eq 0) {
    Write-Host "Zone $zoneName not found or token has no access." -ForegroundColor Red
    exit 1
  }
  $zoneId = $zonesRes.result[0].id
  Write-Host "  Zone ID: $zoneId"
}

# List DNS records for n8n
$listRes = Invoke-RestMethod -Uri "$base/zones/$zoneId/dns_records?name=$recordName.$zoneName&per_page=10" -Headers $headers -Method Get
$records = $listRes.result
if (-not $records -or $records.Count -eq 0) {
  # Try type A or any record with 'n8n' in name
  $listRes = Invoke-RestMethod -Uri "$base/zones/$zoneId/dns_records?per_page=100" -Headers $headers -Method Get
  $records = @($listRes.result | Where-Object { $_.name -like "*n8n*" })
}

if (-not $records -or $records.Count -eq 0) {
  Write-Host "No DNS record found for n8n in zone. Creating A record..."
  $body = @{
    type    = "A"
    name    = $recordName
    content = $targetIp
    ttl     = 1
    proxied = $true
  } | ConvertTo-Json
  $createRes = Invoke-RestMethod -Uri "$base/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $body
  Write-Host "Created: $($createRes.result.name) -> $($createRes.result.content) (proxied: $($createRes.result.proxied))" -ForegroundColor Green
  exit 0
}

$record = $records[0]
$recId = $record.id
$current = $record.content
$currentProxied = $record.proxied

if ($record.type -ne "A" -and $record.type -ne "AAAA") {
  Write-Host "Record $($record.name) is type $($record.type). Patching content to $targetIp (keeping type $($record.type) may fail; prefer A)."
}

if ($current -eq $targetIp) {
  Write-Host "n8n record already points to $targetIp. No change."
  exit 0
}

Write-Host "Updating $($record.name) from $current to $targetIp (proxied: $currentProxied -> true)..."
$body = @{
  type    = "A"
  name    = $recordName
  content = $targetIp
  ttl     = 1
  proxied = $true
} | ConvertTo-Json

$updateRes = Invoke-RestMethod -Uri "$base/zones/$zoneId/dns_records/$recId" -Headers $headers -Method Patch -Body $body
Write-Host "OK: $($updateRes.result.name) -> $($updateRes.result.content) (proxied: $($updateRes.result.proxied))" -ForegroundColor Green
Write-Host "Wait ~1 min then test: Invoke-WebRequest -Uri 'https://n8n.hansvanleeuwen.com/healthz' -UseBasicParsing"
