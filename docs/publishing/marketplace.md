# Publicação no Visual Studio Marketplace

O publisher precisa existir no Visual Studio Marketplace e o identificador deve corresponder exatamente ao campo publisher de package.json.

O identificador configurado neste repositório é korczak-technologies. A configuração local não comprova que o publisher já foi registrado.

## Validar antes da publicação

    npm install
    npm test
    npm run check-types
    npm run compile
    npm run check-output
    npm run test:integration
    npm run package:ci

O comando package:ci gera nebula-language.vsix e verifica manifesto, código compilado, cliente LSP, gramática, snippets, ícones e dependências de execução. Também verifica que fontes TypeScript, testes e documentação interna não foram incluídos.

## Instalar e testar o VSIX

    code --install-extension nebula-language.vsix

Abra um arquivo .nbx e confira o reconhecimento da linguagem, realce, snippets e recursos locais. A integração LSP só poderá ser testada com um servidor Rust compatível instalado e configurado.

## Publicar

A publicação exige uma conta de publisher e credenciais autorizadas no Marketplace. Nunca armazene tokens ou credenciais no repositório.

    npx @vscode/vsce publish

A publicação não é executada automaticamente pelo CI. O workflow valida e disponibiliza o VSIX como artefato para revisão antes de qualquer envio ao Marketplace.
