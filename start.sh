#!/usr/bin/env bash
# One-click launcher for the pinball web version.
# Usage: ./start.sh [PORT]   (default 8000, or set PORT env var)
set -e
cd "$(dirname "$0")/web"

PORT="${1:-${PORT:-8000}}"

echo "Serving pinball web version on 0.0.0.0:${PORT}"
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 0.0.0.0
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT" --bind 0.0.0.0
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes serve -l "$PORT" .
else
  echo "Need python3/python or node+npx to serve the web version." >&2
  exit 1
fi
