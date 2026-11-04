import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engine = require('../../src/providers/completion/engine.js');
const snippets = JSON.parse(readFileSync(new URL('../../snippets/nebula.json', import.meta.url), 'utf8'));
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const providerSource = readFileSync(new URL('../../src/providers/completion/provider.ts', import.meta.url), 'utf8');

test('snippets possuem prefixo, corpo e descrição válidos', () => {
  assert.ok(Object.keys(snippets).length >= 30);
  for (const [name, item] of Object.entries(snippets)) {
    assert.ok(item.prefix, name + ': prefixo ausente');
    assert.ok(Array.isArray(item.body) && item.body.length > 0, name + ': corpo ausente');
    assert.ok(typeof item.description === 'string' && item.description.length > 0);
  }
});

test('snippets cobrem construções da gramática e comandos do runtime', () => {
  const prefixes = Object.values(snippets).flatMap(item =>
    Array.isArray(item.prefix) ? item.prefix : [item.prefix]);
  for (const prefix of [
    'variavel', 'mutável', 'constante', 'funcao', 'funcaogen', 'quando',
    'escolha', 'avaliar', 'enquanto', 'repetir', 'cada', 'para', 'pulso',
    'estrutura', 'enumeracao', 'incluir', 'funcaofim', 'quandofim',
    'parar', 'encerrar', 'seguir', 'lertexto', 'aguardar', 'dormir',
    'gerar', 'emparalelo'
  ]) assert.ok(prefixes.includes(prefix), 'Prefixo ausente: ' + prefix);
});

test('coleta declarações, parâmetros, tipos, estruturas, enums e módulos', () => {
  const source = 'tipo Identificador = inteiro\n' +
    'estrutura Pessoa { nome: texto; idade: inteiro }\n' +
    'enumeracao Estado { Ativo, Inativo }\n' +
    'variavel usuario: Pessoa = nulo\n' +
    'constante limite: inteiro = 10\n' +
    'funcao saudar(nome: texto, vezes: inteiro): vazio { }\n' +
    'incluir sistema::texto como texto';
  const result = engine.collectSymbols(source);
  const labels = result.symbols.map(item => item.label);
  for (const name of [
    'Identificador', 'Pessoa', 'Estado', 'usuario', 'limite',
    'saudar', 'nome', 'vezes', 'texto'
  ]) assert.ok(labels.includes(name), 'Símbolo ausente: ' + name);
  assert.equal(result.variables.get('usuario'), 'Pessoa');
  assert.deepEqual(result.structures.get('Pessoa'), [
    { label: 'nome', type: 'texto' }, { label: 'idade', type: 'inteiro' }
  ]);
  assert.deepEqual(result.enums.get('Estado'), ['Ativo', 'Inativo']);
});

test('reconhece parâmetros com tipos genéricos sem criar símbolos falsos', () => {
  const source = 'funcao transformar<T>(valor: Resultado<inteiro, texto>, nome: texto): T { }';
  const labels = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(labels.includes('transformar'));
  assert.ok(labels.includes('valor'));
  assert.ok(labels.includes('nome'));
  assert.ok(!labels.includes('Resultado'));
  assert.ok(!labels.includes('inteiro'));
  assert.ok(!labels.includes('texto'));
  assert.ok(!labels.includes('T'));
});

test('preserva tipos genéricos em campos e payloads de enumeração', () => {
  const source = 'estrutura Caixa { resultado: Resultado<inteiro, texto>; nome: texto }\nenumeracao Resposta { Algum(inteiro, texto), Nenhum }';
  const result = engine.collectSymbols(source);
  assert.deepEqual(result.structures.get('Caixa'), [
    { label: 'resultado', type: 'Resultado<inteiro, texto>' },
    { label: 'nome', type: 'texto' }
  ]);
  assert.deepEqual(result.enums.get('Resposta'), ['Algum', 'Nenhum']);
});

test('reconhece funções genéricas e módulos sem alias explícito', () => {
  const source = 'funcao transformar<T>(valor: T): T { }\nincluir sistema::texto';
  const labels = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(labels.includes('transformar'));
  assert.ok(labels.includes('texto'));
  assert.ok(!labels.includes('T'));
});

test('registra snippets e autocomplete com gatilhos de membro e escopo', () => {
  assert.deepEqual(packageJson.contributes.snippets, [
    { language: 'nebula', path: './snippets/nebula.json' }
  ]);
  assert.ok(providerSource.includes("registerCompletionItemProvider({language:'nebula'}"));
  assert.ok(providerSource.includes("new NebulaCompletionProvider(),'.',':'"));
  assert.ok(providerSource.includes('new vscode.SnippetString(candidate.insertText)'));
  const defaults = packageJson.contributes.configurationDefaults['[nebula]'];
  assert.equal(defaults['editor.quickSuggestions'].comments, false);
  assert.equal(defaults['editor.quickSuggestions'].strings, false);
});

test('oferece todos os builtins oficiais como chamadas', () => {
  for (const name of [
    'exibir', 'receber', 'perguntar', 'ler_texto',
    'aguardar', 'dormir', 'gerar', 'em_paralelo'
  ]) assert.ok(engine.BUILTINS.includes(name), 'Builtin ausente: ' + name);
  const result = engine.getCompletionCandidates('exi', 3);
  const item = result.candidates.find(candidate => candidate.label === 'exibir');
  assert.equal(item.insertText, 'exibir($0)');
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
  const source = 'estrutura Pessoa { nome: texto; idade: inteiro }\n' +
    'variavel p: Pessoa = nulo\np.no';
  const fields = engine.getCompletionCandidates(source, source.length);
  assert.equal(fields.context, 'member');
  assert.deepEqual(fields.candidates.map(item => item.label), ['nome']);
  const enumSource = 'enumeracao Estado { Ativo, Inativo }\nEstado::At';
  assert.deepEqual(
    engine.getCompletionCandidates(enumSource, enumSource.length).candidates.map(item => item.label),
    ['Ativo']
  );
});

test('ignora declarações em comentários e strings', () => {
  const source = '// variavel fantasma: texto\n' +
    'variavel real: texto = "funcao falsa()"\n' +
    '/* constante oculta = 1 */';
  const names = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(names.includes('real'));
  for (const name of ['fantasma', 'falsa', 'oculta']) assert.ok(!names.includes(name));
});

test('exporta literais e reconhece limites Unicode de identificadores', () => {
  assert.deepEqual(engine.CONSTANTS, ['verdadeiro', 'falso', 'nulo']);
  const source = 'variavel açãofuncao: inteiro = 1\nvariavel nome: texto = "Nebula"';
  const labels = engine.collectSymbols(source).symbols.map(item => item.label);
  assert.ok(labels.includes('açãofuncao'));
  assert.ok(!labels.includes('funcao'));
  assert.ok(engine.getCompletionCandidates('verd', 4).candidates.some(item => item.label === 'verdadeiro'));
});

test('sugere literais e não oferece conteúdo dentro de comentários ou strings', () => {
  const literal = engine.getCompletionCandidates('verd', 4);
  assert.ok(literal.candidates.some(item => item.label === 'verdadeiro'));
  for (const source of ['// exi', 'variavel texto: texto = "exi', '/* exi']) {
    assert.equal(engine.getCompletionCandidates(source, source.length).candidates.length, 0);
  }
});
