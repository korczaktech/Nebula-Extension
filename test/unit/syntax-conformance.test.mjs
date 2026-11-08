import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const grammar=JSON.parse(read('syntaxes/nebula.tmLanguage.json'));
const language=JSON.parse(read('language-configuration.json'));
const provider=read('src/providers/completion/provider.ts');
const docs=read('docs/development/completion.md');

test('gramática TextMate reconhece comentários oficiais e não trata # como comentário',()=>{
 const comments=grammar.repository.comments.patterns;
 assert.ok(comments.some(x=>x.match==='//[^\\r\\n]*'));
 assert.ok(comments.some(x=>x.begin==='/\\*'&&x.end==='\\*/'));
 assert.ok(!comments.some(x=>String(x.match||'').startsWith('#')));
 const controls=grammar.repository.control.patterns[0].match;
 for(const alias of ['quando','devolver','durante','repetir','avaliar','parar','encerrar','seguir','mutável'])assert.ok(controls.includes(alias)||grammar.repository.declarations.patterns[0].match.includes(alias),'Alias aceito não colorizado: '+alias);
});
test('chaves, parênteses e colchetes são os únicos pares de agrupamento',()=>{
 assert.deepEqual(language.brackets,[['{','}'],['[',']'],['(',')']]);
 const punctuation=grammar.repository.punctuation.patterns;
 assert.ok(punctuation.some(x=>x.match==='[({\\[]'));
 assert.ok(punctuation.some(x=>x.match==='[)}\\]]'));
 assert.ok(!punctuation.some(x=>String(x.match||'').includes('<')));
});
test('indentação depende de delimitadores e não de palavras de fechamento',()=>{
 assert.ok(language.indentationRules.increaseIndentPattern.includes('\\{'));
 assert.ok(!language.indentationRules.decreaseIndentPattern.includes('fim'));
 assert.ok(!language.indentationRules.decreaseIndentPattern.includes('senao'));
});
test('documentação e exemplos não ensinam o terminador antigo',()=>{
 assert.ok(!/\bfim\b/.test(provider));
 assert.ok(!docs.includes('fim interno'));
 assert.ok(docs.includes('correspondente'));
});
