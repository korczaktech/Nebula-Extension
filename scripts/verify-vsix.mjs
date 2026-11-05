import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'nbx-language.vsix';
const archive = readFileSync(file);
let eocd = -1;
for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 22 - 0xffff); offset -= 1) {
  if (archive.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
}
assert.notEqual(eocd, -1, 'Arquivo não contém diretório ZIP válido.');
const total = archive.readUInt16LE(eocd + 10);
let cursor = archive.readUInt32LE(eocd + 16);
const entries = [];
for (let i = 0; i < total; i += 1) {
  assert.equal(archive.readUInt32LE(cursor), 0x02014b50, 'Entrada ZIP inválida.');
  const nameLength = archive.readUInt16LE(cursor + 28);
  const extraLength = archive.readUInt16LE(cursor + 30);
  const commentLength = archive.readUInt16LE(cursor + 32);
  entries.push(archive.toString('utf8', cursor + 46, cursor + 46 + nameLength));
  cursor += 46 + nameLength + extraLength + commentLength;
}
for (const required of [
  'extension/package.json','extension/out/extension.js','extension/out/compiler/native.js','extension/out/debug/adapter.js',
  'extension/bin/linux-x64/nebula','extension/bin/linux-x64/nebula-lsp',
  'extension/licenses/NEBULA-LICENSE','extension/out/lsp/client/client.js',
  'extension/syntaxes/nebula.tmLanguage.json','extension/snippets/nebula.json',
  'extension/language-configuration.json','extension/icons/nebula-file.svg',
  'extension/node_modules/vscode-languageclient/package.json'
]) assert.ok(entries.includes(required), 'Arquivo obrigatório ausente no VSIX: ' + required);
for (const entry of entries) {
  assert.ok(!/^extension\/(src|test|tests|docs|\.github)\//.test(entry), 'Arquivo de desenvolvimento incluído: ' + entry);
  assert.ok(!entry.endsWith('.map') && !entry.endsWith('.ts'), 'Fonte TypeScript incluída: ' + entry);
}
console.log('VSIX validado: ' + entries.length + ' arquivos; CLI, LSP, licença e recursos essenciais presentes.');
