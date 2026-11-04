import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const engine=require('../../src/providers/intelligence/engine.js');

test('coleta declarações de variáveis, funções, parâmetros e tipos',()=>{
 const source='tipo Codigo = inteiro\nestrutura Pessoa { nome: texto }\nenumeracao Estado { Ativo }\nvariavel pessoa: Pessoa = nulo\nconstante limite: inteiro = 10\nfuncao saudar(nome: texto, vezes: inteiro): vazio { }';
 const symbols=engine.collectSymbols(source);
 for(const name of ['Codigo','Pessoa','Estado','pessoa','limite','saudar','nome','vezes'])assert.ok(symbols.some(s=>s.name===name),'Símbolo ausente: '+name);
 assert.equal(symbols.find(s=>s.name==='saudar').parameters.length,2);
});

test('ignora identificadores dentro de strings e comentários',()=>{
 const source='// fantasma\nvariavel real: texto = "fantasma" /* oculto */';
 const names=engine.collectSymbols(source).map(s=>s.name);
 assert.deepEqual(names,['real']);
 assert.equal(engine.findReferences(source,'fantasma').length,0);
});

test('encontra todas as referências e a definição local',()=>{
 const source='variavel contador: inteiro = 0\ncontador = contador + 1';
 const refs=engine.findReferences(source,'contador');
 assert.equal(refs.length,3);
 assert.equal(engine.findWord(source,source.lastIndexOf('contador')).text,'contador');
});

test('detecta delimitadores não fechados, excedentes e declarações duplicadas',()=>{
 const result=engine.getDiagnostics('variavel x: inteiro = (1\nvariavel x: inteiro = 2\n)');
 assert.ok(result.some(d=>d.code==='unclosed-delimiter'));
 assert.ok(result.some(d=>d.code==='duplicate-declaration'));
 const extra=engine.getDiagnostics('exibir(1))');
 assert.ok(extra.some(d=>d.code==='unmatched-delimiter'));
});

test('resolve assinatura e parâmetro ativo de chamada',()=>{
 const source='funcao somar(a: inteiro, b: inteiro): inteiro { devolver a + b }\nsomar(1, ';
 const call=engine.findFunctionAtCall(source,source.length);
 assert.equal(call.name,'somar');
 assert.equal(call.parameters.length,2);
 assert.equal(call.activeParameter,1);
});

test('gera símbolos de documento e tokens semânticos',()=>{
 const source='funcao executar(valor: inteiro) { exibir(valor) }';
 assert.ok(engine.getDocumentSymbols(source).some(s=>s.name==='executar'));
 assert.ok(engine.getSemanticTokens(source).some(t=>t.semanticType==='function'));
 assert.ok(engine.getSemanticTokens(source).some(t=>t.semanticType==='parameter'));
});

test('formata recuo básico de blocos sem alterar o conteúdo',()=>{
 const source='funcao teste() {\nexibir("ok")\n}';
 assert.equal(engine.formatDocument(source,2,true),'funcao teste() {\n  exibir("ok")\n}');
});

test('registra todos os provedores da etapa 5 na ativação',async()=>{
 const {readFileSync}=await import('node:fs');
 const extension=readFileSync(new URL('../../src/extension.ts',import.meta.url),'utf8');
 const provider=readFileSync(new URL('../../src/providers/intelligence/provider.ts',import.meta.url),'utf8');
 for(const feature of ['registerHoverProvider','registerDefinitionProvider','registerReferenceProvider','registerSignatureHelpProvider','registerDocumentSymbolProvider','registerDocumentSemanticTokensProvider','registerDocumentFormattingEditProvider','registerCodeActionsProvider','registerRenameProvider','createDiagnosticCollection'])assert.ok(provider.includes(feature),'Provedor ausente: '+feature);
 assert.ok(extension.includes('registerNebulaIntelligence(context)'));
});
