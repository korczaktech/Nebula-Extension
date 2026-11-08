# Nebula Extension

Extensão oficial da linguagem **Nebula** para Visual Studio Code. Reconhece arquivos `.nbx` e conecta o editor às ferramentas de desenvolvimento da linguagem.

Desenvolvida pela Korczak Technologies. O compilador e o runtime pertencem ao repositório [Nebula](https://github.com/korczaktech/Nebula); esta extensão fornece a integração com o editor.

| Propriedade | Definição |
|---|---|
| Nome | Suporte à Linguagem Nebula |
| Identificador do pacote | `nbx-language` |
| Publicador | KorczakTechnologiesBR |
| Versão atual do manifesto | 0.0.9 |
| Editor | Visual Studio Code |
| Linguagem | Nebula |
| Extensão de arquivo | `.nbx` |
| Implementação da extensão | TypeScript |
| Integração de linguagem | LSP |
| Depuração | DAP |
| Repositório | [korczaktech/Nebula-Extension](https://github.com/korczaktech/Nebula-Extension) |

---

## 1. Objetivo

Oferecer uma experiência de desenvolvimento Nebula dentro do VS Code, mantendo o compilador e a semântica da linguagem no projeto principal.

A extensão não deve criar uma implementação paralela da linguagem. O compilador oficial é a referência para análise, interpretação e geração de código.

## 2. Recursos do editor

### Reconhecimento e edição

- Identificação automática de arquivos `.nbx`.
- Gramática TextMate e realce de sintaxe.
- Configuração de indentação e pares de delimitadores.
- Snippets para estruturas frequentes.
- Ícones próprios para arquivos Nebula.
- Três temas: Nebula Vibrante, Nebula Clássico e Nebula Claro.
- Autocomplete alinhado às duas especificações, com documentação contextual e exemplos para palavras reservadas, funções nativas, tipos e APIs de sistemas.
- Snippets com Function Body, indentação e fechamento exclusivo por chaves.

### Autocomplete e documentação contextual

As sugestões seguem a gramática normativa em `especificacao/gramatica.md`, o inventário léxico em `especificacao/tokens.md` e o contrato em `especificacao/linguagem-e-tipos.md`; `NEBULA-SINTAXE-2.md` complementa o catálogo nativo. Ao selecionar uma palavra reservada, função, tipo ou membro sugerido, o painel de documentação apresenta finalidade, sintaxe e exemplo em Nebula. As APIs de sistemas e hardware são identificadas como catálogo da especificação; isso não afirma que estejam implementadas no compilador.

O provedor local permanece ativo junto ao Language Server para garantir que as sugestões da sintaxe atual não desapareçam quando o servidor Rust estiver conectado.

### Inteligência de linguagem

Quando disponíveis no servidor ou nos provedores locais:

- Autocomplete de palavras-chave, declarações e funções.
- Hover com informações de símbolos.
- Diagnósticos léxicos, sintáticos e semânticos.
- Navegação para definição.
- Busca de referências.
- Ajuda de assinatura.
- Símbolos do documento.
- Tokens semânticos, formatação, ações rápidas e renomeação.

A disponibilidade de cada recurso depende da capacidade efetivamente anunciada pelo servidor e da implementação local correspondente.

## 3. Arquitetura

A extensão é organizada por responsabilidades:

```text
Visual Studio Code
       |
       v
Extensão Nebula (TypeScript)
       |
       +----> Configuração e comandos
       |
       +----> Provedores locais
       |
       +----> Cliente LSP
       |          |
       |          v
       |      nebula-lsp
       |
       +----> Integração de execução
       |          |
       |          v
       |      nebula CLI
       |
       +----> Adaptador DAP
                  |
                  v
              Depurador
```

O código-fonte da linguagem permanece em [Nebula](https://github.com/korczaktech/Nebula). A extensão incorpora ou localiza as ferramentas oficiais conforme o método de distribuição configurado.

### Linguagem e configuração

- Identificador interno: `nebula`.
- Alias: `Nebula`.
- Extensão: `.nbx`.
- Tabulação recomendada: quatro espaços.
- Configuração de linguagem: `language-configuration.json`.
- Gramática: `syntaxes/nebula.tmLanguage.json`.
- Snippets: `snippets/nebula.json`.

## 3.1. Temas e syntax highlighting

O realce de sintaxe segue `NEBULA-SINTAXE.md` e `NEBULA-SINTAXE-2.md`: palavras de controle, declarações, modificadores, tipos, funções nativas, módulos de hardware, argumentos nomeados, operadores, números, strings, comentários e delimitadores recebem escopos separados. Os temas aplicam uma paleta consistente inspirada na legibilidade do Python: vermelho para fluxo de controle, roxo para declarações, azul para funções, laranja para números, amarelo para tipos e constantes, verde para strings e branco para identificadores comuns.

Temas incluídos: **Nebula Vibrante** (escuro), **Nebula Clássico** (escuro) e **Nebula Claro** (claro). Selecione-os em `Preferências: Tema de Cores` no VS Code.

## 4. Comandos

Os comandos registrados no manifesto incluem:

| Comando | Função |
|---|---|
| Nebula: Executar arquivo atual (runtime) | Executa pelo runtime interpretado |
| Nebula: Compilar arquivo atual | Solicita compilação |
| Nebula: Interpretar arquivo atual | Interpreta o programa |
| Nebula: Interromper execução | Interrompe sessões iniciadas pela extensão |
| Nebula: Reiniciar Language Server | Reinicia o servidor de linguagem |
| Nebula: Estado do Language Server | Consulta a conexão |
| Nebula: Verificar servidor LSP incorporado | Verifica a ferramenta integrada |
| Nebula: Executar nativamente (experimental) | Executa o alvo nativo experimental |

Os nomes e os comportamentos efetivos são definidos pelo manifesto e pela implementação em `src/`.

## 5. Terminal e CLI

A extensão pode disponibilizar o CLI oficial Nebula e comandos no terminal integrado.

Exemplos de uso:

```sh
nebula arquivo.nbx
nebula compilar arquivo.nbx
nebula interpretar arquivo.nbx
nebula executar arquivo.nbx
nebula depurar --dap arquivo.nbx
nebula analisar arquivo.nbx
nebula verificar arquivo.nbx
nebula formatar arquivo.nbx
nebula --help
nebula --version
```

O atalho `nebula arquivo.nbx` é uma forma curta de solicitar a compilação conforme o wrapper instalado; não significa necessariamente executar o programa após compilar.

### Instalação do CLI no Linux

O fluxo de construção e instalação está automatizado pelos scripts do projeto:

```sh
npm install
npm run build:native
bash scripts/install-cli.sh
```

O build nativo documentado nesta fase tem como alvo Linux x86-64. O suporte de distribuição a outras plataformas depende de binários específicos e validação própria.

Para remover o atalho global instalado:

```sh
bash scripts/uninstall-cli.sh
```

## 6. Execução

A extensão integra diferentes modos, que não devem ser confundidos:

- **Interpretação:** execução da IR pelo runtime de referência.
- **Execução pelo runtime:** utiliza os recursos de execução implementados na Nebula.
- **Execução nativa:** utiliza o backend nativo disponível para o alvo. É experimental quando indicado pela extensão.
- **Compilação:** gera o artefato correspondente ao backend selecionado.

A execução nativa não deve ser considerada equivalente à interpretada quando o backend ainda não integra todo o runtime ou a biblioteca padrão.

## 7. Language Server Protocol

A integração LSP utiliza comunicação JSON-RPC 2.0 pelo transporte stdio.

Configurações disponíveis:

| Configuração | Finalidade |
|---|---|
| `nebula.languageServer.enabled` | Habilita ou desabilita o servidor |
| `nebula.languageServer.serverPath` | Define um caminho alternativo |
| `nebula.languageServer.args` | Argumentos adicionais |
| `nebula.languageServer.trace` | Define o nível de rastreamento |

Valores de rastreamento: `off`, `messages` e `verbose`.

O ciclo de vida do servidor inclui inicialização, conexão, encerramento, reinício por alteração de configuração e registro de logs no canal **Nebula Language Server**.

A instalação e a redistribuição de executáveis devem respeitar a licença do compilador. A extensão não deve baixar ou executar binários sem observar o fluxo de consentimento e a política de distribuição vigente.

## 8. Depuração

O adaptador utiliza o Debug Adapter Protocol (DAP) e registra o tipo de depuração `nebula`.

Configuração inicial:

```json
{
  "type": "nebula",
  "request": "launch",
  "name": "Depurar arquivo Nebula",
  "program": "${file}",
  "stopOnEntry": true
}
```

Recursos previstos ou integrados conforme a versão do adaptador:

- Breakpoints por linha.
- Continuar e pausar.
- Step-in, step-over e step-out.
- Pilha de chamadas.
- Escopos e variáveis.
- Controle do ciclo de execução.

A disponibilidade de entrada interativa durante uma sessão de depuração depende do runtime e do adaptador.

## 9. Estrutura do projeto

| Caminho | Responsabilidade |
|---|---|
| `src/activation/` | Ativação da extensão |
| `src/commands/` | Comandos do editor |
| `src/compiler/` | Localização e execução do compilador |
| `src/debug/` | Integração de depuração |
| `src/lsp/` | Cliente e protocolo LSP |
| `src/providers/` | Recursos de linguagem locais |
| `syntaxes/` | Gramática de realce |
| `snippets/` | Trechos reutilizáveis |
| `themes/` | Temas |
| `icons/` | Ícones |
| `resources/` | Recursos empacotados |
| `scripts/` | Construção, instalação e validação |
| `docs/` | Documentação técnica |

## 10. Desenvolvimento

Requisitos para desenvolver a extensão:

- Node.js e npm compatíveis com o projeto.
- Visual Studio Code para testes de integração.
- Rust e Cargo apenas quando for necessário construir os binários nativos a partir do código-fonte Nebula.
- Repositório Nebula disponível para o fluxo de build nativo.

Comandos:

```sh
npm install
npm run compile
npm run check-types
npm test
npm run check-output
npm run test:lsp
npm run test:debugger -- bin/linux-x64/nebula
npm run package:ci
```

O script `build:native` constrói os executáveis incorporados para o alvo atualmente configurado. Os testes e a verificação do VSIX devem ser executados antes de uma publicação.

## 11. Distribuição

O pacote VSIX deve conter os arquivos necessários à experiência prometida, respeitar a licença Nebula e preservar as licenças de dependências de terceiros.

A compatibilidade de plataforma deve ser declarada somente quando houver binários e testes para o respectivo sistema e arquitetura.

## 12. Licença

Extensão proprietária da Korczak Technologies. Consulte o arquivo `LICENSE` e as licenças dos componentes Nebula incluídos ou distribuídos com o pacote.

---

**Nebula Extension — ambiente de desenvolvimento da linguagem Nebula no Visual Studio Code.**
