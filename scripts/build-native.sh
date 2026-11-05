#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${NEBULA_SOURCE_DIR:-.nebula-source}"
MANIFEST="${SOURCE_DIR}/Cargo.toml"
TARGET_DIR="bin/linux-x64"
OUTPUT="${TARGET_DIR}/nebula"

if [[ ! -f "${MANIFEST}" ]]; then
  echo "Fonte oficial do Nebula não encontrado em ${SOURCE_DIR}." >&2
  exit 1
fi

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "Este build inicial produz somente Linux x86-64." >&2
  exit 1
fi

cargo build --locked --release --manifest-path "${MANIFEST}" -p nebula-cli --bin nebula
mkdir -p "${TARGET_DIR}" licenses
install -m 0755 "${SOURCE_DIR}/target/release/nebula" "${OUTPUT}"
install -m 0644 "${SOURCE_DIR}/LICENSE" licenses/NEBULA-LICENSE

"${OUTPUT}" --version
printf 'Compilador incorporado: %s (%s bytes)\n' "${OUTPUT}" "$(stat -c '%s' "${OUTPUT}")"
