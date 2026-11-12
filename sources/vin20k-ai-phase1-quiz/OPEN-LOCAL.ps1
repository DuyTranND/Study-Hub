$ErrorActionPreference = 'Stop'
$nodePath = 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $nodePath)) { $nodePath = (Get-Command node -ErrorAction Stop).Source }
$listener = Get-NetTCPConnection -LocalPort 8766 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
    Start-Process -FilePath $nodePath -ArgumentList @('"' + (Join-Path $PSScriptRoot 'server.cjs') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
}
for ($attempt=0; $attempt -lt 30; $attempt++) {
    try { $response=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8766/' -TimeoutSec 1; if ($response.Content -match 'AI Vin20K Master Quiz') { Start-Process 'http://127.0.0.1:8766/'; exit 0 }; throw 'Port 8766 is used by another application.' } catch { Start-Sleep -Milliseconds 200 }
}
throw 'Cannot start local site on port 8766.'