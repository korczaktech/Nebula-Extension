#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
COMPILER="${NEBULA_COMPILER_BIN:-${SCRIPT_DIR}/nebula-core}"

if [[ ! -x "${COMPILER}" ]]; then
  echo "Compilador Nebula não encontrado: ${COMPILER}" >&2
  exit 127
fi

if [[ "${1:-}" == *.nbx ]]; then
  exec "${COMPILER}" compilar "$@"
fi

exec "${COMPILER}" "$@"
