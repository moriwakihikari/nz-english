#!/usr/bin/env bash
# pdf/scenes.html → pdf/nz-english-scenes.pdf (Google Chrome headless, macOS)
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build.mjs
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=5000 \
  --print-to-pdf="$PWD/pdf/nz-english-scenes.pdf" \
  "file://$PWD/pdf/scenes.html" 2>/dev/null
ls -la pdf/nz-english-scenes.pdf
