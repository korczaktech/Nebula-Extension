import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const engine=require('../../src/providers/completion/engine.js');
const read=(path)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const snippets=JSON.parse(read('snippets/nebula.json'));
const manifest=JSON.parse(read('package.json'));

test('palavras sugeridas correspondem à gramática normativa',()=>{
 for(const word of ['variavel','definir','mutavel','constante','alterar','tipo','funcao','se','sendo','senao','para','cada','pulso','dentro','enquanto','escolha','caso','padrao','pare','prossiga','passar','retorne','lambda','classe','incluir','de','como','ceder','tente','erro','sempre','lancar','verifique','com','async','aguarda','global','externa','isto','novo','apagar','fora','identico','nao','e','ou','herda','estatico','privado','publico','protegido','exportar','construtor','tipoDe','instanciaDe','obter','vazio','seguro','critico','privilegio','montagem','estrutura','enumeracao'])assert.ok(engine.KEYWORDS.includes(word),'Palavra ausente: '+word);
 for(const old of ['fim','função','quando','devolver','durante','repetir','parar','encerrar','seguir','objetos','dicionarios'])assert.ok(!engine.KEYWORDS.includes(old),'Alias não canônico não sugerido: '+old);
});
test('literais e tipos seguem o contrato de linguagem e tipos',()=>{
 assert.deepEqual(engine.CONSTANTS,['sim','verdadeiro','falso','nulo']);
 for(const type of ['vazio','logico','inteiro','inteiro8','inteiro16','inteiro32','inteiro64','inteiro128','inteiro_u8','inteiro_u16','inteiro_u32','inteiro_u64','inteiro_u128','decimal','decimal32','decimal64','byte','caractere','texto','u8','u16','u32','u64','u128','i8','i16','i32','i64','i128','f32','f64'])assert.ok(engine.TYPES.includes(type),'Tipo ausente: '+type);
});
test('completion filtra palavras, funções e tipos',()=>{
 assert.ok(engine.getCompletionCandidates('sena',4).candidates.some(x=>x.label==='senao'));
 const fn=engine.getCompletionCandidates('lerT',4).candidates.find(x=>x.label==='lerTexto');
 assert.ok(fn);assert.equal(fn.insertText,'lerTexto($0)');
 const source='variavel x: u';const type=engine.getCompletionCandidates(source,source.length);
 assert.equal(type.context,'type');assert.ok(type.candidates.some(x=>x.label==='u64'));
});
test('reconhece função com retorno por seta e modificadores',()=>{
 const source='async publico funcao consultar<T>(valor: Resultado<inteiro, texto>) -> Resultado<T, texto>: {\n    retorne valor\n}';
 const labels=engine.collectSymbols(source).symbols.map(x=>x.label);
 assert.ok(labels.includes('consultar'));assert.ok(labels.includes('valor'));
});
test('reconhece estruturas, enumerações e campos na sintaxe atual',()=>{
 const source='estrutura Pessoa: {\n nome: texto\n idade: inteiro\n}\nenumeracao Estado: {\n Ativo\n Inativo\n}\nvariavel pessoa: Pessoa = nulo\npessoa.no';
 const result=engine.collectSymbols(source);
 assert.deepEqual(result.structures.get('Pessoa'),[{label:'nome',type:'texto'},{label:'idade',type:'inteiro'}]);
 assert.deepEqual(result.enums.get('Estado'),['Ativo','Inativo']);
 const fields=engine.getCompletionCandidates(source,source.length);
 assert.equal(fields.context,'member');assert.ok(fields.candidates.some(x=>x.label==='nome'));
});
test('sugere operações de módulos depois de ponto',()=>{
 const source='memoria.';const result=engine.getCompletionCandidates(source,source.length);
 assert.equal(result.context,'member');assert.ok(result.candidates.some(x=>x.label==='reservar'));assert.ok(result.candidates.some(x=>x.label==='liberar'));
});
test('ignora comentários e strings ao coletar símbolos e completar',()=>{
 const source='// variavel fantasma: texto\nvariavel real: texto = "funcao falsa()"\n/* constante oculta = 1 */';
 const names=engine.collectSymbols(source).symbols.map(x=>x.label);
 assert.ok(names.includes('real'));for(const n of ['fantasma','falsa','oculta'])assert.ok(!names.includes(n));
 for(const sample of ['// exi','variavel texto: texto = "exi','/* exi'])assert.equal(engine.getCompletionCandidates(sample,sample.length).candidates.length,0);
});
test('snippets têm estrutura válida e não usam fim como terminador',()=>{
 assert.ok(Object.keys(snippets).length>=40);
 for(const [name,item] of Object.entries(snippets)){
  assert.ok(item.prefix,name+': prefixo ausente');
  assert.ok(typeof item.description==='string'&&item.description.length>0,name+': descrição ausente');
  const body=Array.isArray(item.body)?item.body.join('\n'):item.body;
  assert.ok(typeof body==='string'&&body.length>0,name+': corpo ausente');
  assert.ok(!/(^|\n)\s*fim\s*(?=\n|$)/m.test(body),name+': terminador fim indevido');
  assert.ok(!/}\s*fim\b/.test(body),name+': fechamento antigo');
 }
});
test('manifesto registra os snippets e a versão corrigida',()=>{
 assert.equal(manifest.version,'0.0.9');
 assert.deepEqual(manifest.contributes.snippets,[{language:'nebula',path:'./snippets/nebula.json'}]);
});
