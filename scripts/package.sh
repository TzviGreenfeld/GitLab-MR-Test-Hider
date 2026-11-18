#!/usr/bin/env bash
# Build two zips in dist/:
#   gitlab-mr-test-hider-<version>.zip        for teammates: a folder with INSTALL.txt, for "Load unpacked"
#   gitlab-mr-test-hider-<version>-store.zip  for the Chrome Web Store: manifest.json at the zip root
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
files=(manifest.json content.js content.css popup.html popup.js icons)
mkdir -p dist

store="dist/gitlab-mr-test-hider-${version}-store.zip"
rm -f "$store"
zip -q -r "$store" "${files[@]}"

share="dist/gitlab-mr-test-hider-${version}.zip"
rm -f "$share"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/gitlab-mr-test-hider"
cp -r INSTALL.txt "${files[@]}" "$tmp/gitlab-mr-test-hider/"
(cd "$tmp" && zip -q -r - gitlab-mr-test-hider) > "$share"

echo "$share"
echo "$store"
