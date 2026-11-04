#!/usr/bin/env bash
set -euo pipefail

npm install
npm run vscode:prepublish
npx @vscode/vsce package --no-dependencies
