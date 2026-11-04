# Nebula Language Support

Extensão oficial da linguagem **Nebula** para Visual Studio Code, com suporte a arquivos .nbx.

Desenvolvida pela **Korczak Technologies**. Este repositório contém somente a extensão do editor; o compilador da linguagem permanece em seu próprio repositório.

## Recursos

- Reconhecimento de arquivos .nbx e identificação da linguagem como Nebula.
- Comentários, indentação automática, fechamento de delimitadores e colorização de pares.
- Realce TextMate para palavras reservadas, declarações, funções internas, tipos, literais, operadores e comentários.
- Snippets para declarações, funções, condicionais, laços, estruturas, enumerações, módulos e tipos.
- Autocomplete contextual para palavras reservadas, literais, tipos, funções, declarações, parâmetros e membros.
- Hover, navegação para definição, referências e informações de parâmetros para símbolos do arquivo atual.
- Diagnósticos locais para delimitadores inconsistentes e declarações duplicadas.
- Cliente LSP configurável, com inicialização por stdio, sincronização de arquivos .nbx e comandos de estado/reinício.

## Requisitos

- Node.js 20 ou superior.
- Visual Studio Code 1.85 ou superior.
- Para testes de integração no Linux: ambiente gráfico virtual, como Xvfb.

## Desenvolvimento

    npm install
    npm run compile

Abra a pasta no VS Code e pressione F5 para iniciar uma janela de desenvolvimento da extensão.

## Testes

    npm test
    npm run check-types
    npm run compile
    npm run check-output
    npm run test:integration

Os testes unitários usam o executor nativo do Node.js. Os testes de integração iniciam uma instância real do VS Code e verificam ativação, reconhecimento de arquivos .nbx, comandos e configurações.

No Linux sem ambiente gráfico, execute a integração com:

    xvfb-run -a npm run test:integration

## Gerar e validar o pacote

    npm run package:ci

O comando gera nebula-language.vsix e verifica o conteúdo do arquivo, incluindo artefatos compilados, gramática, snippets, ícones e dependências de execução do cliente LSP. Para instalar localmente:

    code --install-extension nebula-language.vsix

O pacote exclui código-fonte TypeScript, testes, documentação interna e arquivos de CI. As dependências de execução são mantidas dentro do VSIX.

## Organização

- src/: ponto de entrada e módulos da extensão.
- syntaxes/: gramática TextMate.
- snippets/: modelos de código.
- icons/: identidade visual e ícone de arquivos Nebula.
- test/: testes automatizados e fixtures.
- scripts/: validação e empacotamento.
- docs/: arquitetura, desenvolvimento e publicação.

## Escopo

A inteligência local desta versão é limitada ao documento atual e usa análise textual leve; não substitui o parser nem o sistema de tipos do compilador. O cliente LSP está preparado, mas a conexão depende de um executável servidor Rust compatível. O repositório atual do compilador ainda não contém esse servidor; por isso a conexão fica desativada por padrão. Consulte docs/architecture/language-server.md.

## Licença

Software proprietário da Korczak Technologies. Consulte LICENSE.
