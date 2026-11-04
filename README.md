# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos `.nbx`.

Desenvolvida pela **Korczak Technologies**. Este repositório contém somente a extensão do editor; o compilador da linguagem permanece em seu próprio repositório.

## Recursos desta versão-base

- Reconhecimento da extensão de arquivo `.nbx`.
- Identificação da linguagem como `Nebula` no VS Code.
- Comentários de linha e bloco com continuação ao pressionar Enter.
- Indentação automática para blocos, listas e chamadas multilinha.
- Fechamento automático, seleção por pares e colorização de chaves, colchetes e parênteses.
- Configuração de aspas, delimitadores e recuo integrada ao editor do VS Code.
- Realce TextMate abrangente para palavras reservadas, declarações, funções internas, tipos, literais, operadores, comentários e delimitadores, com cobertura lexical mantida neste repositório.
- Snippets para declarações, funções, condicionais, laços, estruturas, enumerações e escolha.
- Canal de saída para confirmar a ativação da extensão.

## Instalação para desenvolvimento

Requisitos: Node.js 20 ou superior e Visual Studio Code 1.85 ou superior.

```bash
npm install
npm run compile
```

Abra esta pasta no VS Code e pressione F5 para iniciar uma janela de desenvolvimento da extensão.

## Testes e pacote

```bash
npm test
npm run check-types
npm run compile
npx @vscode/vsce package --no-dependencies
```

O empacotamento gera um arquivo `.vsix`.

## Organização

- `src/`: ponto de entrada e módulos da extensão.
- `syntaxes/`: gramática TextMate.
- `snippets/`: modelos de código.
- `icons/`: identidade visual e ícone de arquivos Nebula.
- `test/`: testes automatizados e fixtures.
- `docs/`: arquitetura, desenvolvimento e publicação.

## Escopo

Esta versão-base prepara o reconhecimento e a experiência de edição. Recursos dependentes de análise do compilador — diagnósticos semânticos, autocomplete contextual, navegação, refatorações e integração LSP — serão implementados nas próximas etapas.

## Licença

Software proprietário da Korczak Technologies. Consulte [LICENSE](LICENSE).
