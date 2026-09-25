$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Thin launcher for install.mjs; `npx vibedev-rules@latest` needs no clone.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "vibedev-rules: Node.js 18+ is required but 'node' was not found on PATH. Install Node 18+ (https://nodejs.org) or run: npx vibedev-rules@latest"
  exit 1
}

& node "$dir\install.mjs" @args
exit $LASTEXITCODE
