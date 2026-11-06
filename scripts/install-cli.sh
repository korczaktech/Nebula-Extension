#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${NEBULA_BIN_DIR:-${ROOT}/bin/linux-x64}"
DEST="${NEBULA_INSTALL_DIR:-${HOME}/.local/bin}"

if [[ "$(uname -s)" != "Linux" || "$(uname -m)" != "x86_64" ]]; then
  echo "Instalação automática disponível somente para Linux x86-64." >&2
  exit 1
fi
for file in nebula nebula-core; do
  if [[ ! -x "${SOURCE}/${file}" ]]; then
    echo "Arquivo ausente ou não executável: ${SOURCE}/${file}" >&2
    echo "Execute primeiro: npm run build:native" >&2
    exit 1
  fi
done

mkdir -p "${DEST}"
install -m 0755 "${SOURCE}/nebula-core" "${DEST}/nebula-core"
install -m 0755 "${SOURCE}/nebula" "${DEST}/nebula"

add_path_line() {
  local file="$1" line="$2"
  [[ -f "$file" ]] || touch "$file"
  grep -Fqx "$line" "$file" || printf '\n%s\n' "$line" >> "$file"
}
case "$(basename "${SHELL:-bash}")" in
  fish)
    FISH_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/fish/config.fish"
    mkdir -p "$(dirname "$FISH_CONFIG")"
    add_path_line "$FISH_CONFIG" 'fish_add_path -g "$HOME/.local/bin"'
    ;;
  zsh)
    add_path_line "$HOME/.zshrc" 'export PATH="$HOME/.local/bin:$PATH"'
    add_path_line "$HOME/.profile" 'export PATH="$HOME/.local/bin:$PATH"'
    ;;
  *)
    add_path_line "$HOME/.bashrc" 'export PATH="$HOME/.local/bin:$PATH"'
    add_path_line "$HOME/.profile" 'export PATH="$HOME/.local/bin:$PATH"'
    ;;
esac

echo "CLI Nebula instalado em: ${DEST}/nebula"
echo "Teste em um novo terminal: nebula --version"
echo "Compile um arquivo: nebula caminho/arquivo.nbx"
echo "Depure via DAP: nebula depurar --dap caminho/arquivo.nbx"
if [[ ":${PATH}:" != *":${DEST}:"* ]]; then
  echo "Para usar nesta sessão, execute:"
  printf '  export PATH="%s:$PATH"\n' "${DEST}"
fi
