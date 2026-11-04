# Integração com o Language Server

A extensão inclui um cliente LSP baseado em vscode-languageclient, com transporte padrão por entrada/saída padrão (stdio). O cliente é registrado na ativação da extensão, observa arquivos .nbx, envia opções de inicialização, respeita as capacidades negociadas pelo VS Code e permite reinício e consulta de estado.

## Configuração

A conexão permanece desativada por padrão porque o repositório do compilador ainda não fornece um executável de servidor LSP. Quando o servidor Rust estiver disponível, configure:

- `nebula.languageServer.enabled`: habilita a conexão.
- `nebula.languageServer.serverPath`: caminho do executável do servidor.
- `nebula.languageServer.args`: argumentos do processo.
- `nebula.languageServer.trace`: nível de rastreamento `off`, `messages` ou `verbose`.

O padrão de caminho é `nebula-lsp`; isso é um nome configurável, não um binário já fornecido pelo compilador.

## Ciclo de vida

- Inicialização quando a extensão é ativada e a opção está habilitada.
- Negociação LSP com opções de inicialização Nebula e capacidades suportadas pelo VS Code.
- Sincronização de alterações de arquivos .nbx por watcher e sincronização de texto do cliente.
- Reinício automático quando configurações nebula.languageServer.* mudam.
- Comandos Nebula: Reiniciar Language Server e Nebula: Estado do Language Server.
- Encerramento do processo junto com o ciclo de vida da extensão.
- Erros de inicialização registrados no canal de saída Nebula Language Server, sem derrubar a extensão.

## Integração com o compilador

A extensão não implementa um protocolo próprio nem simula respostas LSP. O processo externo precisa implementar LSP 3.17 por stdio e publicar os recursos correspondentes, encaminhando análise, diagnósticos, símbolos, tokens semânticos, formatação e refatorações para as bibliotecas Rust do compilador.

Na revisão do repositório korczaktech/Nebula, o CLI disponível oferece comandos de compilação, execução, interpretação e formatação, mas não declara um comando lsp nem contém um servidor LSP. Por isso, a conexão real não pode ser ativada com o compilador atual. A opção fica desativada por padrão para evitar tentativas de iniciar um executável inexistente.

## Verificação

A suíte da extensão valida dependência, configurações, comandos, ativação, opções de inicialização e presença dos artefatos compilados. A validação de uma sessão LSP real depende de um servidor compatível executável.
