import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engine = require('../../src/providers/completion/engine.js');
const snippets = JSON.parse(readFileSync(new URL('../../snippets/nebula.json', import.meta.url), 'utf8'));

test('snippets possuem prefixo, corpo e descrição válidos', () => {
  assert.ok(Object.keys(snippets).length >= 30);
  for (const [name, item] of Object.entries(snippets)) {
    assert.ok(item.prefix, name + ': prefixo ausente');
    assert.ok(Array.isArray(item.body) && item.body.length > 0, name + ': corpo ausente');
    assert.ok(typeof item.description === 'string' && item.description.length > 0);
  }
});

test('snippets cobrem construções da gramática e comandos do runtime', () => {
  const prefixes = Object.values(snippets).flatMap(item => Array.isArray(item.prefix) ? item.prefix : [item.prefix]);
  for (const prefix of ['variavel', 'mutável', 'constante', 'funcao', 'funcaogen', 'quando', 'escolha', 'avaliar', 'enquanto', 'repetir', 'cada', 'para', 'pulso', 'estrutura', 'enumeracao', 'incluir', 'funcaofim', 'quandofim', 'parar', 'encerrar', 'seguir', 'lertexto', 'aguardar', 'dormir', 'gerar', 'emparalelo']) {
    assert.ok(prefixes.includes(prefix), 'Prefixo ausente: ' + prefix);
  }
});

test('coleta declarações, parâmetros, tipos, estruturas, enums e módulos', () => {
  const source = 'tipo Identificador = inteiro\nestrutura Pessoa { nome: texto idade: inteiro }\nenumeracao Estado { Ativo, Inativo }\nvariavel usuario: Pessoa = nulo\nconstante limite: inteiro = 10\nfuncao saudar(nome: texto, vezes: inteiro): vazio { }\nincluir sistema::texto como texto';
  const result = engine.collectSymbols(source);
  const labels = result.symbols.map(item => item.label);
  for (const name of ['Identificador', 'Pessoa', 'Estado', 'usuario', 'limite', 'saudar', 'nome', 'vezes', 'texto']) {
    assert.ok(labels.includes(name), 'Símbolo ausente: ' + name);
  }
  assert.equal(result.variables.get('usuario'), 'Pessoa');
  assert.deepEqual(result.structures.get('Pessoa'), [{ label: 'nome', type: 'texto' }, { label: 'idade', type: 'inteiro' }]);
  assert.deepEqual(result.enums.get('Estado'), ['Ativo', 'Inativo']);
});

test('reconhece funções genéricas e módulos sem alias explícito', () => {
  const source = 'funcao transformar<T>(valor: T): T { }\nincluir sistema::texto';
  const labels = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(labels.includes('transformar'));
  assert.ok(labels.includes('texto'));
});

test('sugere símbolos locais pelo prefixo digitado', () => {
  const source = 'variavel contador: inteiro = 0\nfuncao calcular(valor: inteiro): inteiro { }\ncont';
  const result = engine.getCompletionCandidates(source, source.length);
  assert.ok(result.candidates.some(item => item.label === 'contador'));
  assert.ok(!result.candidates.some(item => item.label === 'calcular'));
});

test('sugere declarações localizadas depois do cursor no mesmo arquivo', () => {
  const source = 'cont\nvariavel contador: inteiro = 0';
  assert.ok(engine.getCompletionCandidates(source, 4).candidates.some(item => item.label === 'contador'));
});

test('sugere tipos após anotação', () => {
  const source = 'variavel idade: int';
  const result = engine.getCompletionCandidates(source, source.length);
  assert.equal(result.context, 'type');
  assert.ok(result.candidates.some(item => item.label === 'inteiro'));
  assert.ok(result.candidates.some(item => item.label === 'Resultado'));
  assert.ok(!result.candidates.some(item => item.label === 'variavel'));
});

test('sugere campos após ponto e variantes após operador de escopo', () => {
  const source = 'estrutura Pessoa { nome: texto idade: inteiro }\nvariavel p: Pessoa = nulo\np.no';
  const fields = engine.getCompletionCandidates(source, source.length);
  assert.equal(fields.context, 'member');
  assert.deepEqual(fields.candidates.map(item => item.label), ['nome']);
  const enumSource = 'enumeracao Estado { Ativo, Inativo }\nEstado::At';
  assert.deepEqual(engine.getCompletionCandidates(enumSource, enumSource.length).candidates.map(item => item.label), ['Ativo']);
});

test('ignora declarações em comentários e strings', () => {
  const source = '// variavel fantasma: texto\nvariavel real: texto = "funcao falsa()"\n/* constante oculta = 1 */';
  const names = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(names.includes('real'));
  for (const name of ['fantasma', 'falsa', 'oculta']) assert.ok(!names.includes(name));
});

test('sugere literais e não oferece conteúdo dentro de comentários ou strings', () => {
  const literal = engine.getCompletionCandidates('verd', 4);
  assert.ok(literal.candidates.some(item => item.label === 'verdadeiro'));
  for (const source of ['// exi', 'variavel texto: texto = "exi', '/* exi']) {
    assert.equal(engine.getCompletionCandidates(source, source.length).candidates.length, 0);
  }
});
