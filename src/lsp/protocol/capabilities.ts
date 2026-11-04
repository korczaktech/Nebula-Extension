/** Opções estáveis enviadas ao servidor durante initialize. */
export function createNebulaInitializationOptions(){
 return {client:'nebula-vscode',protocol:'LSP',protocolVersion:'3.17',documentLanguage:'nebula',fileExtensions:['.nbx'],features:{diagnostics:true,completion:true,hover:true,definition:true,references:true,rename:true,signatureHelp:true,documentSymbols:true,semanticTokens:true,formatting:true,codeActions:true,workspaceFolders:true}};
}