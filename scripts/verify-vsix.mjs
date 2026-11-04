import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'nebula-language.vsix';
const archive = readFileSync(file);

function readEntries(buffer) {
  const eocdSignature = 0x06054b50;
  let eocd = -1;
  const minimum = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocd = offset;
      break;
    }
  }
  assert.notEqual(eocd, -1, 'Arquivo não contém diretório ZIP válido.');

  const totalEntries = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  for (let index = 0; index < totalEntries; index += 1) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50, 'Entrada ZIP inválida.');
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    entries.push(name);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const entries = readEntries(archive);
const required = [
  'extension/package.json',
  'extension/out/extension.js',
  'extension/out/lsp/client/client.js',
  'extension/syntaxes/nebula.tmLanguage.json',
  'extension/snippets/nebula.json',
  'extension/language-configuration.json',
  'extension/icons/nebula-file.svg',
  'extension/node_modules/vscode-languageclient/package.json'
];

for (const entry of required) {
  assert.ok(entries.includes(entry), 'Arquivo obrigatório ausente no VSIX: ' + entry);
}
for (const entry of entries) {
  assert.ok(!entry.startsWith('extension/src/'), 'Código-fonte TS incluído: ' + entry);
  assert.ok(!entry.startsWith('extension/test/'), 'Testes incluídos no pacote: ' + entry);
  assert.ok(!entry.startsWith('extension/tests/'), 'Testes incluídos no pacote: ' + entry);
  assert.ok(!entry.startsWith('extension/docs/'), 'Documentação interna incluída: ' + entry);
  assert.ok(!entry.startsWith('extension/.github/'), 'Configuração CI incluída: ' + entry);
  assert.ok(!entry.endsWith('.map'), 'Source map incluído: ' + entry);
  assert.ok(!entry.endsWith('.ts'), 'Arquivo TypeScript incluído: ' + entry);
}

console.log('VSIX validado: ' + entries.length + ' arquivos; manifesto, runtime, LSP, gramática, snippets e recursos essenciais presentes.');
