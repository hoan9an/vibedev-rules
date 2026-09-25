#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Thin launcher for install.mjs; `npx vibedev-rules@latest` needs no clone.
if ! command -v node >/dev/null 2>&1; then
  echo "vibedev-rules: Node.js 18+ is required but 'node' was not found on PATH." >&2
  echo "Install Node 18+ (https://nodejs.org) or run: npx vibedev-rules@latest" >&2
  exit 1
fi

exec node "$DIR/install.mjs" "$@"
