import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const engine=require('../../src/providers/intelligence/engine.js');
const nl=String.fromCharCode(10);

test('coleta declarações de variáveis, funções, parâmetros e tipos',()=>{
 const source=['tipo Codigo = inteiro','estrutura Pessoa { nome: texto }','enumeracao Estado { Ativo }','variavel pessoa: Pessoa = nulo','constante limite: inteiro = 10','funcao saudar(nome: texto, vezes: inteiro): vazio { }'].join(nl);
 const symbols=engine.collectSymbols(source);
 for(const name of ['Codigo','Pessoa','Estado','pessoa','limite','saudar','nome','vezes'])assert.ok(symbols.some(s=>s.name===name),'Símbolo ausente: '+name);
 assert.equal(symbols.find(s=>s.name==='saudar').parameters.length,2);
});

test('ignora identificadores dentro de strings e comentários',()=>{
 const source=['// fantasma','variavel real: texto = "fantasma" /* oculto */'].join(nl);
 assert.deepEqual(engine.collectSymbols(source).map(s=>s.name),['real']);
 assert.equal(engine.findReferences(source,'fantasma').length,0);
});

test('encontra todas as referências e a definição local',()=>{
 const source=['variavel contador: inteiro = 0','contador = contador + 1'].join(nl);
 assert.equal(engine.findReferences(source,'contador').length,3);
 assert.equal(engine.findWord(source,source.lastIndexOf('contador')).text,'contador');
});

test('detecta delimitadores não fechados, excedentes e declarações duplicadas',()=>{
 const source=['variavel x: inteiro = (1','variavel x: inteiro = 2'].join(nl);
 const result=engine.getDiagnostics(source);
 assert.ok(result.some(d=>d.code==='unclosed-delimiter'));
 assert.ok(result.some(d=>d.code==='duplicate-declaration'));
 assert.ok(engine.getDiagnostics('exibir(1))').some(d=>d.code==='unmatched-delimiter'));
});

test('resolve assinatura e parâmetro ativo de chamada',()=>{
 const source=['funcao somar(a: inteiro, b: inteiro): inteiro { devolver a + b }','somar(1, '].join(nl);
 const call=engine.findFunctionAtCall(source,source.length);
 assert.equal(call.name,'somar');
 assert.equal(call.parameters.length,2);
 assert.equal(call.activeParameter,1);
});

test('gera símbolos de documento e tokens semânticos',()=>{
 const source='funcao executar(valor: inteiro) { exibir(valor) }';
 assert.ok(engine.getDocumentSymbols(source).some(s=>s.name==='executar'));
 assert.ok(engine.getSemanticTokens(source).some(t=>t.semanticType==='function'));
 assert.ok(engine.getSemanticTokens(source).filter(t=>t.semanticType==='parameter').length>=2);
});

test('formata recuo básico de blocos sem alterar o conteúdo',()=>{
 const source=['funcao teste() {','exibir("ok")','}'].join(nl);
 assert.equal(engine.formatDocument(source,2,true),['funcao teste() {','  exibir("ok")','}'].join(nl));
});

test('registra todos os provedores da etapa 5 na ativação',async()=>{
 const {readFileSync}=await import('node:fs');
 const extension=readFileSync(new URL('../../src/extension.ts',import.meta.url),'utf8');
 const provider=readFileSync(new URL('../../src/providers/intelligence/provider.ts',import.meta.url),'utf8');
 for(const feature of ['registerHoverProvider','registerDefinitionProvider','registerReferenceProvider','registerSignatureHelpProvider','registerDocumentSymbolProvider','registerDocumentSemanticTokensProvider','registerDocumentFormattingEditProvider','registerCodeActionsProvider','registerRenameProvider','createDiagnosticCollection'])assert.ok(provider.includes(feature),'Provedor ausente: '+feature);
 assert.ok(extension.includes('registerNebulaIntelligence(context)'));
});

test('formatador preserva CRLF e ignora delimitadores em strings',()=>{
 const crlf=String.fromCharCode(13)+String.fromCharCode(10);
 const source=['funcao teste() {','exibir("}")','}'].join(crlf);
 const expected=['funcao teste() {','    exibir("}")','}'].join(crlf);
 assert.equal(engine.formatDocument(source,4,true),expected);
});

test('nao trata fim como palavra-chave nem como terminador de bloco',()=>{
 const legacy=engine.scan('fim');
 assert.equal(legacy.length,1);
 assert.equal(legacy[0].type,'identifier');
 const source=['funcao teste() {','se verdadeiro: {','exibir(1)','}','}'].join(nl);
 const expected=['funcao teste() {','    se verdadeiro: {','        exibir(1)','    }','}'].join(nl);
 assert.equal(engine.formatDocument(source,4,true),expected);
 assert.deepEqual(engine.getDiagnostics('fim'),[]);
});
