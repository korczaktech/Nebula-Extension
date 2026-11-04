import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const grammar = JSON.parse(readFileSync(new URL('../../syntaxes/nebula.tmLanguage.json', import.meta.url), 'utf8'));
const fixture = readFileSync(new URL('../fixtures/basic.nbx', import.meta.url), 'utf8');

function collectPatterns(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    for (const item of value) collectPatterns(item, result);
    return result;
  }
  if (typeof value.match === 'string') result.push({ kind: 'match', value: value.match });
  if (typeof value.begin === 'string') result.push({ kind: 'begin', value: value.begin });
  if (typeof value.end === 'string') result.push({ kind: 'end', value: value.end });
  for (const child of Object.values(value)) collectPatterns(child, result);
  return result;
}

test('a gramática declara o escopo source.nebula', () => {
  assert.equal(grammar.scopeName, 'source.nebula');
  assert.ok(grammar.patterns.length >= 10);
});

test('todas as expressões regulares da gramática são compiláveis', () => {
  const patterns = collectPatterns(grammar);
  assert.ok(patterns.length >= 25);
  for (const pattern of patterns) {
    assert.doesNotThrow(() => new RegExp(pattern.value, 'u'), `${pattern.kind}: ${pattern.value}`);
  }
});

test('todas as palavras reservadas normativas estão contempladas', () => {
  const source = grammar.repository.keywords.patterns.map(pattern => pattern.match).join('|');
  const declarations = grammar.repository.declarations.patterns.map(pattern => pattern.match).join('|');
  const constants = grammar.repository.constants.patterns.map(pattern => pattern.match).join('|');
  const all = source + '|' + declarations + '|' + constants;
  const words = [
    'variavel', 'definir', 'mutavel', 'mutável', 'alterar', 'constante',
    'funcao', 'função', 'quando', 'senao', 'senão', 'avaliar', 'escolha',
    'caso', 'para', 'cada', 'em', 'enquanto', 'durante', 'repetir', 'pulso',
    'devolver', 'incluir', 'como', 'verdadeiro', 'falso', 'nulo', 'fim',
    'parar', 'encerrar', 'seguir', 'e', 'ou', 'nao', 'não', 'publico',
    'público', 'privado', 'tipo', 'estrutura', 'enumeracao', 'enumeração'
  ];
  for (const word of words) assert.ok(all.includes(word), `Palavra ausente: ${word}`);
});

test('nomes de builtins são realçados como funções, não como palavras reservadas', () => {
  const builtins = grammar.repository.builtins.patterns.map(pattern => pattern.match).join('|');
  for (const name of ['exibir', 'receber', 'perguntar', 'ler_texto', 'aguardar', 'dormir', 'gerar', 'em_paralelo']) {
    assert.ok(builtins.includes(name), `Builtin ausente: ${name}`);
  }
  assert.ok(!grammar.repository.keywords.patterns.some(pattern => /exibir|receber|perguntar|aguardar|dormir|gerar|em_paralelo/.test(pattern.match)));
});

test('a gramática diferencia tipos primitivos e tipos de coleção', () => {
  const primitive = grammar.repository.types.patterns[0].match;
  const containers = grammar.repository.types.patterns[1].match;
  for (const name of ['vazio', 'logico', 'lógico', 'inteiro', 'inteiro128', 'inteiro_u64', 'decimal', 'decimal32', 'texto', 'caractere', 'byte']) {
    assert.ok(new RegExp(primitive, 'u').test(name), `Tipo primitivo ausente: ${name}`);
  }
  for (const name of ['vetor', 'matriz', 'Tupla', 'Opcional', 'Resultado']) {
    assert.ok(new RegExp(containers, 'u').test(name), `Tipo composto ausente: ${name}`);
  }
});

test('a gramática identifica recursos futuros como inválidos', () => {
  const future = grammar.repository.reservedFuture.patterns[0];
  assert.match(future.name, /^invalid\.illegal/);
  for (const word of ['tentar', 'capturar', 'finalmente', 'assinc']) assert.ok(future.match.includes(word));
});

test('o fixture cobre as principais construções léxicas e sintáticas', () => {
  for (const sample of [
    '/* comentário de bloco */', 'variavel nome: texto', "'N'", '0x2A', '0b1010', '0o17',
    'verdadeiro', 'falso', 'nulo', 'variavel', 'constante', 'funcao',
    'quando', 'senao', 'escolha', 'caso', 'enquanto', 'cada', 'pulso',
    'estrutura', 'enumeracao', 'incluir', 'exibir(', 'receber(', '<-', '**', '..', '::'
  ]) assert.ok(fixture.includes(sample), `Fixture sem: ${sample}`);
});
