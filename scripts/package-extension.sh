#!/usr/bin/env bash
set -euo pipefail
npm ci
npm run compile
npx @vscode/vsce package
