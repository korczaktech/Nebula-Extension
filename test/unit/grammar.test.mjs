import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const grammar = JSON.parse(readFileSync(new URL('../../syntaxes/nebula.tmLanguage.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

function collectPatterns(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) { for (const item of value) collectPatterns(item, result); return result; }
  for (const key of ['match', 'begin', 'end']) if (typeof value[key] === 'string') result.push({ kind: key, value: value[key] });
  for (const child of Object.values(value)) collectPatterns(child, result);
  return result;
}

test('a gramática registra o escopo Nebula e todas as categorias', () => {
  assert.equal(grammar.scopeName, 'source.nebula');
  for (const section of ['comments','strings','numbers','constants','declarations','control','modifiers','builtins','types','typeAnnotations','functionCalls','namedArguments','operators','punctuation','identifiers']) {
    assert.ok(grammar.repository[section], `Seção ausente: ${section}`);
  }
});

test('a gramática contém expressões de tokenização TextMate', () => {
  const patterns = collectPatterns(grammar);
  assert.ok(patterns.length >= 35);
  assert.ok(patterns.every(pattern => pattern.value.length > 0));
});

test('palavras reservadas da sintaxe principal recebem escopo de controle', () => {
  const source = grammar.repository.control.patterns.map(pattern => pattern.match).join('|');
  const words = [
    'se','sendo','senao','para','enquanto','escolha','caso','padrao','pare','prossiga','passar','retorne',
    'funcao','lambda','classe','incluir','de','como','ceder','tente','erro','sempre','lancar','verifique',
    'com','async','aguarda','global','externa','isto','novo','apagar','dentro','fora','identico','nao',
    'e','ou','variavel','constante','herda','estatico','privado','publico','protegido','construtor',
    'tipoDe','instanciaDe','obter','definir','vazio','seguro','critico','privilegio','montagem','fim','exportar'
  ];
  for (const word of words) assert.ok(source.includes(word), `Palavra reservada ausente: ${word}`);
  for (const obsolete of ['quando','avaliar','devolver','parar','encerrar','seguir','assinc','mutavel','estrutura','enumeracao']) {
    assert.ok(!source.includes(obsolete), `Palavra antiga ainda presente: ${obsolete}`);
  }
});

test('tipos de dados da sintaxe principal e nativa estão cobertos', () => {
  const types = grammar.repository.types.patterns.map(pattern => pattern.match).join('|');
  for (const word of ['inteiro','decimal','complexo','texto','logico','vazio','lista','tupla','conjunto','conImutavel','dicionario','octetos','vetorOctetos','bit','vetorBits','u8','u16','u32','u64','u128','i8','i16','i32','i64','i128','f32','f64','endereco','enderecoFisico','tamanho','deslocamento','ponteiro','ponteiroBruto']) {
    assert.ok(types.includes(word), `Tipo ausente: ${word}`);
  }
});

test('funções nativas e módulos do catálogo recebem escopos próprios', () => {
  const builtins = grammar.repository.builtins.patterns.map(pattern => pattern.match).join('|');
  for (const word of ['exibir','lerTexto','abrir','fechar','ler','escrever','abs','arredondar','divres','raiz','potencia','faixa','tamanho','ordenar','enumerar','filtrar','mapear','reduzir','visualizarMemoria','enderecoDe','diretorioAtual','listarArquivos','criarDiretorio','removerArquivo']) {
    assert.ok(builtins.includes(word), `Builtin ausente: ${word}`);
  }
  const modules = grammar.repository.builtins.patterns[1].match;
  for (const word of ['bits','cpu','hardware','memoria','ponteiro','simd','porta','interrupcao','dma']) assert.ok(modules.includes(word));
});

test('operadores atuais e delimitadores possuem escopos', () => {
  const names = grammar.repository.operators.patterns.map(pattern => pattern.name);
  for (const category of ['assignment','comparison','logical','bitwise','arithmetic','range','access','lambda']) {
    assert.ok(names.includes(`keyword.operator.${category}.nebula`), `Categoria ausente: ${category}`);
  }
  assert.ok(grammar.repository.punctuation.patterns.some(pattern => pattern.match.includes('<')));
});

test('os três temas estão registrados e existem', () => {
  assert.equal(manifest.contributes.themes.length, 3);
  for (const theme of manifest.contributes.themes) {
    const path = new URL('../../' + theme.path.replace(/^\\.\\//, ''), import.meta.url);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    assert.ok(data.tokenColors.length >= 10);
  }
});

test('todos os temas aplicam cores às categorias semânticas', () => {
  const categories = [
    'keyword.control.nebula','storage.type.function.nebula','entity.name.function.call.nebula',
    'constant.numeric','storage.type.primitive.nebula','variable.other.nebula','string.quoted.double.nebula'
  ];
  for (const theme of manifest.contributes.themes) {
    const data = JSON.parse(readFileSync(new URL('../../' + theme.path.replace(/^\\.\\//, ''), import.meta.url), 'utf8'));
    const entries = data.tokenColors.flatMap(token => Array.isArray(token.scope) ? token.scope : [token.scope]);
    for (const category of categories) assert.ok(entries.includes(category), `Escopo ${category} ausente no tema ${theme.label}`);
  }
});
