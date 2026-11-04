/** Recursos realmente anunciados pelo servidor Rust nebula-lsp. */
export function createNebulaInitializationOptions() {
  return {
    client: 'nebula-vscode',
    protocol: 'LSP',
    protocolVersion: '3.17',
    documentLanguage: 'nebula',
    fileExtensions: ['.nbx'],
    features: {
      diagnostics: true,
      completion: true,
      hover: true,
      definition: true,
      references: true,
      signatureHelp: true,
      documentSymbols: true
    }
  };
}
