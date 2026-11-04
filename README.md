# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos `.nbx`.

Desenvolvida pela **Korczak Technologies**. Este repositório contém somente a extensão do editor; o compilador da linguagem permanece em seu próprio repositório.

## Recursos

- Reconhecimento da extensão de arquivo `.nbx`.
- Identificação da linguagem como `Nebula` no VS Code.
- Comentários de linha e bloco com continuação ao pressionar Enter.
- Indentação automática para blocos com chaves e blocos terminados por `fim`, incluindo `função`, `quando`, `senão`, laços e casos, com quatro espaços por padrão.
- Fechamento automático, seleção por pares e colorização de chaves, colchetes e parênteses.
- Configuração de aspas, delimitadores, comentários automáticos e recuo integrada ao editor do VS Code.
- Realce TextMate abrangente para palavras reservadas, declarações, funções internas, tipos, literais, operadores, comentários e delimitadores, com cobertura lexical mantida neste repositório.
- Snippets para declarações, funções, condicionais, laços, estruturas, enumerações, módulos, tipos e funções internas, incluindo blocos com `fim`.
- Autocomplete contextual alinhado ao inventário de palavras reservadas, literais, tipos, funções internas, declarações e parâmetros, incluindo tipos genéricos e de função.
- Sugestões de campos de estruturas e variantes de enumerações após `.` e `::`.
- Hover, navegação para definição, busca de referências e informações de parâmetros para símbolos declarados no arquivo atual.
- Diagnósticos locais para delimitadores inconsistentes e declarações duplicadas.
- Símbolos de documento, tokens semânticos, formatação básica, correções rápidas e renomeação local.

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

A inteligência de código desta versão é local ao documento e baseada em análise textual leve; não substitui o parser nem o sistema de tipos do compilador. Resolução de módulos entre arquivos, inferência de tipos, validação semântica normativa e diagnósticos completos dependem da integração com o compilador Rust/LSP, prevista para a etapa 6.

## Licença

Software proprietário da Korczak Technologies. Consulte [LICENSE](LICENSE).
