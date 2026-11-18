#!/usr/bin/env bash
# Build a zip ready for upload to the Chrome Web Store: dist/gitlab-mr-test-hider-<version>.zip
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
mkdir -p dist
out="dist/gitlab-mr-test-hider-${version}.zip"
rm -f "$out"
zip -q -r "$out" manifest.json content.js content.css popup.html popup.js icons
echo "$out"
