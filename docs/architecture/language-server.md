# Integração com o Language Server

A extensão utiliza `vscode-languageclient` e inicia o `nebula-lsp` local como subprocesso. A comunicação usa JSON-RPC 2.0 pelo transporte stdio do LSP.

## Instalação automática

Na primeira abertura de um arquivo `.nbx`, a extensão procura o servidor no armazenamento global da própria extensão. Se ainda não estiver instalado, oferece a instalação com confirmação do usuário.

A instalação executa localmente:

```bash
cargo install --git https://github.com/korczaktech/Nebula --locked --root <armazenamento-da-extensao> --force nebula-lsp
```

É necessário ter Rust/Cargo instalado e acesso ao GitHub. O binário fica no armazenamento global do VS Code, fora do VSIX. A extensão não baixa nem executa binários de terceiros sem consentimento.

Essa estratégia respeita a situação atual da licença da Nebula: `LICENSE-STATUS.md` registra que a redistribuição do compilador e de seus componentes ainda aguarda revisão e aprovação. Por isso, o servidor não é incorporado ao pacote Marketplace.

## Configuração

- `nebula.languageServer.enabled`: habilita a integração (padrão `true`).
- `nebula.languageServer.serverPath`: caminho opcional para um executável já instalado. Vazio usa a instalação gerenciada pela extensão.
- `nebula.languageServer.args`: argumentos adicionais.
- `nebula.languageServer.trace`: rastreamento `off`, `messages` ou `verbose`.

Comandos disponíveis na Paleta de Comandos:

- **Nebula: Instalar servidor LSP**
- **Nebula: Reiniciar Language Server**
- **Nebula: Estado do Language Server**

## Recursos conectados ao servidor

O servidor Rust atual anuncia e fornece:

- Diagnósticos léxicos, sintáticos e semânticos.
- Autocompletar palavras-chave, declarações, funções e parâmetros.
- Hover com informações de identificadores e declarações.
- Ir para definição.
- Encontrar referências.
- Ajuda de assinatura de funções.
- Símbolos do documento.

O cliente usa a sincronização de texto integral declarada pelo servidor e observa arquivos `.nbx`. Ao conectar, os provedores locais equivalentes são suspensos para evitar resultados duplicados.

## Recursos locais complementares

Enquanto o servidor ainda não anuncia esses métodos, a extensão mantém os provedores locais de tokens semânticos, formatação, ações rápidas e renomeação. Se o servidor não estiver instalado ou não conseguir iniciar, os provedores locais de fallback continuam ativos.

## Ciclo de vida e diagnóstico

- Inicialização quando a extensão ativa em um arquivo Nebula e a configuração está habilitada.
- Instalação somente após confirmação explícita.
- Reinício automático quando as configurações `nebula.languageServer.*` mudam.
- Encerramento do subprocesso com o ciclo de vida da extensão.
- Logs de instalação e protocolo no canal **Nebula Language Server**.
- O comando de estado informa se o cliente está conectado, iniciando, desconectado ou desativado.

## Desenvolvimento e validação

```bash
npm install
npm test
npm run check-types
npm run compile
npm run check-output
npm run package:ci
```

Os testes verificam o cliente, a instalação local, as capacidades negociadas e a preservação dos provedores complementares. A validação de uma sessão real também exige compilar o servidor Rust e abrir um arquivo `.nbx` em uma janela do VS Code.