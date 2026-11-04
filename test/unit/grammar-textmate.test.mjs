import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import textmate from 'vscode-textmate';
const { Registry, parseRawGrammar } = textmate;
import oniguruma from 'vscode-oniguruma';

const require = createRequire(import.meta.url);
const grammarSource = await readFile(new URL('../../syntaxes/nebula.tmLanguage.json', import.meta.url), 'utf8');
const wasmBuffer = await readFile(require.resolve('vscode-oniguruma/release/onig.wasm'));
await oniguruma.loadWASM(wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength));

const registry = new Registry({
  onigLib: Promise.resolve({
    createOnigScanner: sources => new oniguruma.OnigScanner(sources),
    createOnigString: value => new oniguruma.OnigString(value)
  }),
  loadGrammar: async scopeName => {
    assert.equal(scopeName, 'source.nebula');
    return parseRawGrammar(grammarSource, 'nebula.tmLanguage.json');
  }
});

const grammar = await registry.loadGrammar('source.nebula');

function scopesAt(line, fragment) {
  const index = line.indexOf(fragment);
  assert.notEqual(index, -1, `Trecho não encontrado: ${fragment}`);
  const result = grammar.tokenizeLine(line);
  const token = result.tokens.find(item => item.startIndex <= index && item.endIndex > index);
  assert.ok(token, `Token não encontrado para: ${fragment}`);
  return token.scopes;
}

test('TextMate aplica os escopos de declarações e tipos', () => {
  const line = 'variavel nome: texto = verdadeiro';
  assert.ok(scopesAt(line, 'variavel').includes('storage.type.variable.nebula'));
  assert.ok(scopesAt(line, 'nome').includes('variable.other.declaration.nebula'));
  assert.ok(scopesAt(line, 'texto').includes('storage.type.primitive.nebula'));
  assert.ok(scopesAt(line, 'verdadeiro').includes('constant.language.boolean.nebula'));
});

test('anotação de retorno termina antes do corpo da função', () => {
  const line = 'funcao principal(): vazio {';
  const braceScopes = scopesAt(line, '{');
  assert.ok(braceScopes.includes('punctuation.section.group.begin.nebula'));
  assert.ok(!braceScopes.includes('meta.type.annotation.nebula'));
});

test('TextMate reconhece funções, builtins e chamadas', () => {
  assert.ok(scopesAt('funcao principal(): vazio {', 'principal').includes('entity.name.function.nebula'));
  assert.ok(scopesAt('exibir("Olá")', 'exibir').includes('support.function.builtin.nebula'));
});

test('TextMate reconhece comentários, strings, caracteres e números', () => {
  assert.ok(scopesAt('// comentário Nebula', 'comentário').includes('comment.line.double-slash.nebula'));
  assert.ok(scopesAt('"texto Nebula"', 'texto').includes('string.quoted.double.nebula'));
  assert.ok(scopesAt("'A'", 'A').includes('string.quoted.single.nebula'));
  assert.ok(scopesAt('constante mascara = 0x2A', '0x2A').includes('constant.numeric.hex.nebula'));
});

test('TextMate reconhece aliases acentuados e operadores', () => {
  assert.ok(scopesAt('mutável nome = 1', 'mutável').includes('keyword.control.nebula') || scopesAt('mutável nome = 1', 'mutável').includes('storage.type.variable.nebula'));
  assert.ok(scopesAt('a <- b ** 2', '<-').includes('keyword.operator.assignment.nebula'));
  assert.ok(scopesAt('a <- b ** 2', '**').includes('keyword.operator.arithmetic.nebula'));
});
