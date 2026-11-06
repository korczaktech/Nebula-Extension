#!/usr/bin/env bash
set -euo pipefail

DEST="${NEBULA_INSTALL_DIR:-${HOME}/.local/bin}"
removed=0
for file in nebula nebula-core; do
  if [[ -f "${DEST}/${file}" ]]; then
    rm -- "${DEST}/${file}"
    removed=1
  fi
done
if [[ "$removed" -eq 1 ]]; then
  echo "CLI Nebula removido de ${DEST}."
else
  echo "Nenhuma instalação do CLI Nebula encontrada em ${DEST}."
fi
echo "A entrada de PATH foi preservada para não alterar sua configuração do shell."
