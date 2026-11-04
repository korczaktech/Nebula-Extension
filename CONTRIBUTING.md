# Contribuição

Mantenha a extensão separada do compilador Nebula. Alterações na gramática TextMate devem acompanhar a especificação léxica normativa da linguagem.

## Verificações locais

```bash
npm install
npm test
npm run check-types
npm run compile
npx @vscode/vsce package --no-dependencies
```

Não inclua credenciais, tokens ou arquivos gerados (`out/`, `node_modules/`, `.vsix`) nos commits.
