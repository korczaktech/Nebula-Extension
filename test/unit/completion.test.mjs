import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const engine=require('../../src/providers/completion/engine.js');
const snippets=JSON.parse(readFileSync(new URL('../../snippets/nebula.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
const provider=readFileSync(new URL('../../src/providers/completion/provider.ts',import.meta.url),'utf8');
const completionDocs=readFileSync(new URL('../../docs/development/completion.md',import.meta.url),'utf8');

test('palavras reservadas acompanham a sintaxe atual',()=>{
 for(const word of ['variavel','constante','funcao','se','sendo','senao','para','enquanto','escolha','caso','padrao','pare','prossiga','passar','retorne','lambda','classe','incluir','de','como','ceder','tente','erro','sempre','lancar','verifique','com','async','aguarda','global','externa','isto','novo','apagar','dentro','fora','identico','nao','e','ou','sim','nulo','herda','estatico','privado','publico','protegido','exportar','construtor','tipoDe','instanciaDe','vazio','seguro','critico','privilegio','montagem','estrutura','enumeracao','objetos','dicionarios'])assert.ok(engine.KEYWORDS.includes(word),'Palavra ausente: '+word);
 for(const old of ['quando','devolver','verdadeiro','falso','mutavel','mutável','avaliar','durante','repetir','pulso','parar','encerrar','seguir','ler_texto','em_paralelo'])assert.ok(!engine.KEYWORDS.includes(old),'Sintaxe antiga ainda sugerida: '+old);
});
test('literais e tipos refletem as especificações principal e nativa',()=>{
 assert.deepEqual(engine.CONSTANTS,['sim','nao','nulo']);
 for(const type of ['inteiro','decimal','complexo','texto','logico','lista','tupla','conjunto','dicionario','u8','u16','u32','u64','u128','i8','i16','i32','i64','i128','f32','f64','endereco','enderecoFisico','tamanho','deslocamento','ponteiro','ponteiroBruto','referencia','vetor','bloco'])assert.ok(engine.TYPES.includes(type),'Tipo ausente: '+type);
});
test('catálogo de funções e módulos cobre biblioteca principal e nativa',()=>{
 for(const name of ['exibir','lerTexto','abrir','fechar','ler','lerLinha','lerLinhas','escrever','escreverLinhas','abs','arredondar','divres','raiz','potencia','faixa','tamanho','ordenar','inverter','enumerar','filtrar','mapear','reduzir'])assert.ok(engine.BUILTINS.includes(name),'Função ausente: '+name);
 for(const name of ['memoria','ponteiro','bits','cpu','simd','hardware','porta','interrupcao','dma','atomico','cache','tempo','energia'])assert.ok(engine.MODULES.includes(name),'Módulo ausente: '+name);
});
test('sugere palavras, funções e tipos por prefixo',()=>{
 assert.ok(engine.getCompletionCandidates('sena',4).candidates.some(x=>x.label==='senao'));
 const fn=engine.getCompletionCandidates('lerT',4).candidates.find(x=>x.label==='lerTexto');
 assert.ok(fn);assert.equal(fn.insertText,'lerTexto($0)');
 const type=engine.getCompletionCandidates('variavel x: u',13);
 assert.equal(type.context,'type');assert.ok(type.candidates.some(x=>x.label==='u64'));
});
test('sugere operações de módulos após ponto',()=>{
 const source='memoria.';const result=engine.getCompletionCandidates(source,source.length);
 assert.equal(result.context,'member');assert.ok(result.candidates.some(x=>x.label==='reservar'));assert.ok(result.candidates.some(x=>x.label==='liberar'));
});
test('coleta símbolos de declarações atuais',()=>{
 const source='variavel contador: inteiro = 0\nconstante LIMITE: inteiro = 10\nfuncao somar(a: inteiro, b: inteiro) -> inteiro: {\n    retorne a + b\n    fim\n} fim';
 const labels=engine.collectSymbols(source).symbols.map(x=>x.label);
 for(const name of ['contador','LIMITE','somar','a','b'])assert.ok(labels.includes(name),'Símbolo ausente: '+name);
});
test('snippets são válidos, descritos e usam Function Body',()=>{
 assert.ok(Object.keys(snippets).length>=40);
 for(const [name,item] of Object.entries(snippets)){
  assert.ok(item.prefix,name+': prefixo ausente');
  assert.ok(typeof item.description==='string'&&item.description.length>0,name+': descrição ausente');
  const body=Array.isArray(item.body)?item.body.join('\n'):item.body;
  assert.ok(typeof body==='string'&&body.length>0,name+': corpo ausente');
  const prefixes=Array.isArray(item.prefix)?item.prefix:[item.prefix];
  if(prefixes.some(p=>['funcao','funcaop','asyncfuncao','se','enquanto','para','classe','escolha','tente','privilegio','critico'].includes(p))){
   assert.ok(body.includes(': {'),name+': falta Function Body');assert.ok(body.includes('fim'),name+': falta fim');
  }
 }
});
test('snippets incluem construções atuais e APIs de sistemas',()=>{
 const prefixes=Object.values(snippets).flatMap(x=>Array.isArray(x.prefix)?x.prefix:[x.prefix]);
 for(const prefix of ['variavel','constante','funcao','funcaop','asyncfuncao','se','sendo','senao','escolha','caso','para','enquanto','tente','lancar','verifique','retorne','pare','prossiga','passar','incluir','incluirmodulo','classe','exportarfuncao','lambda','seta','estrutura','enumeracao','memreservar','memalocar','memescrever','memler','bitsdefinir','privilegio','critico','montagem','exibir','lerTexto','faixa','aguarda','cpuregistro','portaler','interrupcao','dma','atomico'])assert.ok(prefixes.includes(prefix),'Snippet ausente: '+prefix);
});
test('documentação contextual apresenta finalidade, sintaxe e exemplos',()=>{
 for(const term of ['Sintaxe','Exemplo','Function Body','privilegio','montagem','sendo','retorne'])assert.ok(provider.includes(term),'Documentação contextual incompleta: '+term);
 for(const term of ['NEBULA-SINTAXE.md','NEBULA-SINTAXE-2.md','Function Body','fim','APIs propostas'])assert.ok(completionDocs.includes(term),'Documentação do autocomplete ausente: '+term);
});
test('provedor local fica ativo com Language Server conectado',()=>{
 assert.ok(provider.includes('registerCompletionItemProvider'));
 assert.ok(!provider.includes('isNebulaLanguageServerReady'));
 assert.ok(!provider.includes('onNebulaLanguageServerReady'));
});
test('versão 0.0.8 e snippets estão registrados',()=>{
 assert.equal(manifest.version,'0.0.8');
 assert.deepEqual(manifest.contributes.snippets,[{language:'nebula',path:'./snippets/nebula.json'}]);
});
