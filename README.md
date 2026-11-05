# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos `.nbx`.

Desenvolvida pela **Korczak Technologies**. O compilador e o servidor de linguagem são construídos a partir do repositório oficial Nebula e incorporados ao pacote da extensão.

## Recursos

- Reconhecimento de arquivos `.nbx`, gramática TextMate, snippets e configuração de edição.
- Autocomplete contextual, hover e inteligência local.
- Language Server oficial em Rust, com diagnósticos, autocomplete, hover, navegação para definição, referências, assinatura de funções e símbolos.
- CLI oficial incorporado para compilar, interpretar e executar arquivos Nebula.
- Servidor LSP incorporado; a instalação não exige Rust, Cargo nem downloads adicionais.
- Comandos para executar, compilar, interpretar, reiniciar o LSP, consultar seu estado e interromper execução.

## Compilar e executar

Abra um arquivo `.nbx` e use a paleta de comandos: **Nebula: Executar arquivo atual**, **Nebula: Compilar arquivo atual** ou **Nebula: Interpretar arquivo atual**. Os arquivos são salvos antes da execução. A saída é exibida em **Nebula — Execução**.

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

Para construir os binários oficiais no Linux x86-64, disponibilize o repositório Nebula em `.nebula-source` e execute `npm run build:native`. O script compila CLI e LSP em modo release, incorpora ambos em `bin/linux-x64` e inclui a licença em `licenses/NEBULA-LICENSE`.

## Empacotamento

`npm run package:ci` gera `nbx-language.vsix` para Linux x64 e verifica manifesto, extensão compilada, CLI, LSP, licença, gramática, snippets e dependências de execução.

## Depuração

A extensão oferece execução, compilação e interpretação. O depurador DAP com breakpoints e execução passo a passo será implementado em fase posterior; não é anunciado como disponível nesta versão.

## Licença

Software proprietário da Korczak Technologies. Consulte `LICENSE` e a licença Nebula incluída em `licenses/NEBULA-LICENSE`.
