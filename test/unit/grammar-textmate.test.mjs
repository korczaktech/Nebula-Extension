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

test('declarações, nomes, tipos e constantes usam escopos distintos', () => {
  const line = 'variavel nome: texto = sim';
  assert.ok(scopesAt(line, 'variavel').includes('storage.type.variable.nebula'));
  assert.ok(scopesAt(line, 'nome').includes('variable.other.declaration.nebula'));
  assert.ok(scopesAt(line, 'texto').includes('storage.type.primitive.nebula'));
  assert.ok(scopesAt(line, 'sim').includes('constant.language.boolean.nebula'));
});

test('palavras de fluxo da sintaxe atual são reconhecidas', () => {
  for (const word of ['se','sendo','senao','para','enquanto','escolha','caso','padrao','pare','prossiga','passar','retorne','tente','erro','sempre','aguarda','critico','privilegio']) {
    assert.ok(scopesAt(`${word} condicao`, word).includes('keyword.control.nebula') || scopesAt(`${word} condicao`, word).includes('storage.modifier.nebula'), `Palavra não colorida: ${word}`);
  }
  assert.ok(!scopesAt('fim = 1', 'fim').includes('keyword.control.nebula'), 'fim deve ser identificador comum');
});

test('nomes de função e builtins são diferenciados', () => {
  assert.ok(scopesAt('funcao principal() -> vazio: {', 'principal').includes('entity.name.function.nebula'));
  assert.ok(scopesAt('exibir("Olá")', 'exibir').includes('support.function.builtin.nebula'));
  assert.ok(scopesAt('hardware.detectar()', 'hardware').includes('support.module.nebula'));
});

test('argumentos nomeados, parâmetros, campos e operadores são reconhecidos', () => {
  assert.ok(scopesAt('funcao soma(valor: inteiro): {', 'valor').includes('variable.other.declaration.nebula') || scopesAt('funcao soma(valor: inteiro): {', 'valor').includes('variable.parameter.nebula'));
  assert.ok(scopesAt('criar(nome = "Ana")', 'nome').some(scope => scope.includes('variable.parameter.argument.nebula')));
  assert.ok(scopesAt('objeto.campo', 'campo').includes('variable.other.member.nebula'));
  assert.ok(scopesAt('x =+ 1', '=+').includes('keyword.operator.assignment.nebula'));
  assert.ok(scopesAt('x -> x ** 2', '->').includes('keyword.operator.lambda.nebula'));
});

test('comentários oficiais, strings e números são reconhecidos', () => {
  assert.ok(scopesAt('// comentario', 'comentario').includes('comment.line.double-slash.nebula'));
  assert.ok(scopesAt('/* comentario */', 'comentario').includes('comment.block.nebula'));
  assert.ok(scopesAt('"texto"', 'texto').includes('string.quoted.double.nebula'));
  assert.ok(scopesAt("'A'", 'A').includes('string.quoted.single.nebula'));
  assert.ok(scopesAt('0x2A', '0x2A').includes('constant.numeric.hex.nebula'));
});
