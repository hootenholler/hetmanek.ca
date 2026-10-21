#!/bin/bash
# Double-click in Finder to start the local CMS. Close this window (or press Ctrl+C) to stop it.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Get it from https://nodejs.org (LTS), then try again."
  read -r -p "Press Return to close."
  exit 1
fi
node cms/server.mjs
