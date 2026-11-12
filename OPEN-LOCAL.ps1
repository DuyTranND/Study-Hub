$ErrorActionPreference = 'Stop'
$port = 8771
$uri = "http://127.0.0.1:$port/"
$server = Join-Path $PSScriptRoot 'server.cjs'

# A file:// URL cannot load the root-relative assets or fetch the JSON question banks.
$listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
  $env:PORT = [string]$port
  $node = (Get-Command node -ErrorAction Stop).Source
  Start-Process -FilePath $node -ArgumentList @('"' + $server + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}

$online = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200 -and $response.Content -match 'AI20K All-in-One') {
      $online = $true
      break
    }
    throw "Port $port is serving a different application."
  } catch {
    if ($_.Exception.Message -match 'different application') { throw }
    Start-Sleep -Milliseconds 200
  }
}
if (-not $online) { throw "Cannot reach the AI20K workspace at $uri" }
Start-Process $uri