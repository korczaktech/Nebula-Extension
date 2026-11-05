# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos `.nbx`.

Desenvolvida pela **Korczak Technologies**. O compilador, o runtime e o servidor de linguagem são construídos a partir do repositório oficial Nebula e incorporados ao pacote da extensão.

## Recursos

- Reconhecimento de arquivos `.nbx`, gramática TextMate, snippets e configuração de edição.
- Autocomplete contextual, hover e inteligência local.
- Language Server oficial em Rust, com diagnósticos, autocomplete, hover, navegação para definição, referências, assinatura de funções e símbolos.
- CLI oficial incorporado para compilar, interpretar e executar arquivos Nebula.
- Runtime Rust e interpretador de IR incorporados no executável oficial.
- Execução interpretada em terminal integrado do VS Code, com entrada interativa por `receber()`, saída e interrupção pela extensão.
- Execução nativa separada para programas compatíveis com o backend ELF atual.
- A instalação não exige Rust, Cargo ou downloads adicionais.

## Executar programas

Abra e salve um arquivo `.nbx`.

- **Nebula: Executar arquivo atual**: executa pelo runtime da Nebula no terminal integrado. Suporta entrada interativa, saída e chamadas de runtime implementadas pelo interpretador.
- **Nebula: Interpretar arquivo atual**: mesmo runtime interpretado, disponível como comando explícito.
- **Nebula: Executar nativamente (experimental)**: compila e inicia um executável ELF. O backend nativo ainda não liga o runtime nem toda a biblioteca padrão; use apenas os recursos atualmente suportados pelo backend.
- **Nebula: Compilar arquivo atual**: gera o executável nativo `.out` ao lado do arquivo-fonte.
- **Nebula: Interromper execução**: encerra o processo nativo e fecha os terminais de runtime abertos pela extensão.

A execução interpretada abre um terminal próprio para cada sessão. Programas que chamam `receber()` podem solicitar dados diretamente pelo terminal, sem captura parcial de entrada pela extensão.

## Language Server

O servidor LSP é iniciado automaticamente quando a extensão é ativada e `nebula.languageServer.enabled` está habilitado. O executável vem incorporado no VSIX. Não é necessário instalar Rust/Cargo.

- `nebula.languageServer.enabled`: ativa ou desativa a integração.
- `nebula.languageServer.serverPath`: caminho opcional para substituir o servidor incorporado.
- `nebula.languageServer.args`: argumentos adicionais.
- `nebula.languageServer.trace`: rastreamento `off`, `messages` ou `verbose`.

## Desenvolvimento

```sh
npm install
npm run compile
npm test
npm run check-types
npm run check-output
```

Para construir os binários oficiais no Linux x86-64, disponibilize o repositório Nebula em `.nebula-source` e execute `npm run build:native`. O script compila CLI e LSP em modo release, incorpora ambos em `bin/linux-x64` e inclui a licença em `licenses/NEBULA-LICENSE`. O CLI inclui o runtime Rust por meio da dependência do interpretador de IR.

## Empacotamento

`npm run package:ci` gera `nbx-language.vsix` para Linux x64 e verifica manifesto, extensão compilada, CLI, LSP, licença, gramática, snippets e dependências de execução.

## Depuração

A extensão oferece execução interpretada e nativa, compilação e interrupção. O depurador DAP com breakpoints e execução passo a passo será implementado na Fase 3.

## Licença

Software proprietário da Korczak Technologies. Consulte `LICENSE` e a licença Nebula incluída em `licenses/NEBULA-LICENSE`.


## Depuração no VS Code

A extensão registra o depurador `Nebula` no VS Code. Use **Executar e Depurar** e selecione **Depurar arquivo Nebula** (ou crie uma configuração `type: nebula`, `request: launch`, `program: ${file}`). O adaptador inicia o CLI incorporado com `nebula depurar --dap` e oferece breakpoints por linha, pilha de chamadas, escopos, variáveis, continuar, pausar, entrar em funções, avançar sobre chamadas e sair da função. A entrada interativa por `receber()` não está disponível durante a sessão de depuração.
