#!/usr/bin/env bash
set -euo pipefail
SOURCE_DIR="${NEBULA_SOURCE_DIR:-.nebula-source}"
MANIFEST="${SOURCE_DIR}/Cargo.toml"
TARGET_DIR="bin/linux-x64"

if [[ ! -f "${MANIFEST}" ]]; then
  echo "Fonte oficial do Nebula não encontrado em ${SOURCE_DIR}." >&2
  exit 1
fi
if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "Este build inicial produz somente Linux x86-64." >&2
  exit 1
fi

DEPENDENCIES="$(cargo tree --locked --manifest-path "${MANIFEST}" -p nebula-cli -e normal)"
if ! grep -q 'nebula-runtime' <<<"${DEPENDENCIES}"; then
  echo "O CLI foi construído sem a dependência nebula-runtime." >&2
  exit 1
fi
cargo build --locked --release --manifest-path "${MANIFEST}" -p nebula-cli --bin nebula
cargo build --locked --release --manifest-path "${MANIFEST}" -p nebula-lsp --bin nebula-lsp
mkdir -p "${TARGET_DIR}" licenses
install -m 0755 "${SOURCE_DIR}/target/release/nebula" "${TARGET_DIR}/nebula"
install -m 0755 "${SOURCE_DIR}/target/release/nebula-lsp" "${TARGET_DIR}/nebula-lsp"
install -m 0644 "${SOURCE_DIR}/LICENSE" licenses/NEBULA-LICENSE
"${TARGET_DIR}/nebula" --version
printf 'CLI incorporado: %s bytes\n' "$(stat -c '%s' "${TARGET_DIR}/nebula")"
printf 'LSP incorporado: %s bytes\n' "$(stat -c '%s' "${TARGET_DIR}/nebula-lsp")"
