# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos `.nbx`.

Desenvolvida pela **Korczak Technologies**. O compilador, o runtime e o servidor de linguagem são construídos a partir do repositório oficial Nebula e incorporados ao pacote da extensão.

## Recursos

- Reconhecimento de arquivos `.nbx`, gramática TextMate, snippets e configuração de edição.
- Autocomplete contextual, hover e inteligência local.
- Language Server oficial em Rust, com diagnósticos, autocomplete, hover, navegação para definição, referências, assinatura de funções e símbolos.
- CLI oficial incorporado para compilar, interpretar, executar e depurar arquivos Nebula.
- Runtime Rust e interpretador de IR incorporados no executável oficial.
- Depuração DAP real: breakpoints por linha, continuar, pausar, step-in, step-over, step-out, pilha de chamadas, escopos e variáveis.
- Execução interpretada em terminal integrado do VS Code, com entrada interativa por `receber()`, saída e interrupção pela extensão.
- Execução nativa separada para programas compatíveis com o backend ELF atual.
- A instalação da extensão não exige Rust, Cargo ou downloads adicionais.

## CLI no terminal Linux

A extensão incorpora o executável oficial como `nebula-core` e disponibiliza o comando `nebula` como uma pequena camada de compatibilidade. Essa camada transforma a forma curta `nebula arquivo.nbx` em `nebula-core compilar arquivo.nbx`; todos os demais argumentos e subcomandos são encaminhados sem alteração ao CLI oficial.

Para construir e instalar:

```sh
npm install
npm run build:native
bash scripts/install-cli.sh
```

Abra um novo terminal depois da instalação.

### Comandos

```sh
nebula arquivo.nbx
nebula compilar arquivo.nbx
nebula compilar arquivo.nbx -o programa.out --otimizacao O2
nebula interpretar arquivo.nbx
nebula executar arquivo.nbx
nebula depurar --dap arquivo.nbx
nebula analisar arquivo.nbx
nebula verificar arquivo.nbx
nebula formatar arquivo.nbx
nebula --help
nebula --version
```

O comando curto `nebula arquivo.nbx` compila e gera o executável `arquivo.out` ao lado do fonte. Ele não executa automaticamente o programa. Para executar, use `nebula executar arquivo.nbx` quando o host e o backend suportarem essa operação.

O CLI instalado globalmente usa os binários presentes no diretório `~/.local/bin`. Para removê-lo:

```sh
bash scripts/uninstall-cli.sh
```

A instalação automática inicial é destinada a Linux x86-64. O pacote da extensão e o CLI incorporado também são produzidos para esse alvo nesta fase.

## Executar programas no VS Code

Abra e salve um arquivo `.nbx`.

- **Nebula: Executar arquivo atual**: executa pelo runtime da Nebula no terminal integrado. Suporta entrada interativa, saída e chamadas de runtime implementadas pelo interpretador.
- **Nebula: Interpretar arquivo atual**: mesmo runtime interpretado, disponível como comando explícito.
- **Nebula: Executar nativamente (experimental)**: compila e inicia um executável ELF. O backend nativo ainda não liga o runtime nem toda a biblioteca padrão; use apenas os recursos atualmente suportados pelo backend.
- **Nebula: Compilar arquivo atual**: gera o executável nativo `.out` ao lado do arquivo-fonte.
- **Nebula: Interromper execução**: encerra o processo nativo e fecha os terminais de runtime abertos pela extensão.

A execução interpretada abre um terminal próprio para cada sessão. Programas que chamam `receber()` podem solicitar dados diretamente pelo terminal, sem captura parcial de entrada pela extensão.

## Depuração

A extensão registra o depurador `Nebula` no VS Code e inicia o adaptador DAP implementado no CLI oficial com `nebula depurar --dap`. Use **Executar e Depurar** e selecione **Depurar arquivo Nebula** (ou crie uma configuração `type: nebula`, `request: launch`, `program: ${file}`).

O protocolo DAP suporta breakpoints por linha, pilha de chamadas, escopos, variáveis, continuar, pausar, entrar em funções, avançar sobre chamadas e sair da função. A entrada interativa por `receber()` não está disponível durante a sessão de depuração. O teste de integração DAP valida a comunicação com o executável real, não um mock.

## Language Server

O servidor LSP é iniciado automaticamente quando a extensão é ativada e `nebula.languageServer.enabled` está habilitado. O executável vem incorporado no VSIX. Não é necessário instalar Rust/Cargo.

- `nebula.languageServer.enabled`: ativa ou desativa a integração.
- `nebula.languageServer.serverPath`: caminho opcional para substituir o servidor incorporado.
- `nebula.languageServer.args`: argumentos adicionais.
- `nebula.languageServer.trace`: rastreamento `off`, `messages` ou `verbose`.

## Desenvolvimento e validação

```sh
npm install
npm run compile
npm test
npm run check-types
npm run check-output
npm run test:debugger -- bin/linux-x64/nebula
node scripts/test-cli-wrapper.mjs bin/linux-x64/nebula
```

Para construir os binários oficiais no Linux x86-64, disponibilize o repositório Nebula em `.nebula-source` e execute `npm run build:native`. O script compila CLI e LSP em modo release, incorpora ambos em `bin/linux-x64` e inclui a licença em `licenses/NEBULA-LICENSE`.

## Empacotamento

`npm run package:ci` gera `nbx-language.vsix` para Linux x64 e verifica manifesto, extensão compilada, CLI oficial, atalho global, LSP, licença, gramática, snippets e dependências de execução.

## Licença

Software proprietário da Korczak Technologies. Consulte `LICENSE` e a licença Nebula incluída em `licenses/NEBULA-LICENSE`.
