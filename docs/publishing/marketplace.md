# Publicação no Visual Studio Marketplace

Antes da publicação, é necessário criar um publisher no Visual Studio Marketplace e usar exatamente o identificador registrado no campo `publisher` de `package.json`.

O valor atualmente configurado é `korczak-technologies`; ele é uma identificação pretendida, não uma confirmação de que o publisher já foi registrado.

## Preparar o pacote

```bash
npm install
npm run vscode:prepublish
npx @vscode/vsce package --no-dependencies
```

O comando gera um arquivo VSIX para instalação e validação local.

A publicação exige uma conta de publisher e credenciais autorizadas no Marketplace. Nenhuma credencial deve ser armazenada no repositório.
