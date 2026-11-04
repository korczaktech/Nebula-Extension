import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
test('declara dependencia oficial do cliente LSP',()=>{assert.ok(pkg.dependencies['vscode-languageclient']);assert.equal(pkg.engines.vscode,'^1.85.0');});
test('configura servidor externo desativado por padrão',()=>{const p=pkg.contributes.configuration.properties;assert.equal(p['nebula.languageServer.enabled'].default,false);assert.equal(p['nebula.languageServer.serverPath'].default,'nebula-lsp');assert.deepEqual(p['nebula.languageServer.args'].default,[]);assert.deepEqual(p['nebula.languageServer.trace'].enum,['off','messages','verbose']);});
test('publica comandos de estado e reinício',()=>{const c=pkg.contributes.commands.map(x=>x.command);assert.ok(c.includes('nebula.restartLanguageServer'));assert.ok(c.includes('nebula.languageServerStatus'));});
test('cliente observa documentos e oferece ciclo de vida',()=>{const c=read('src/lsp/client/client.ts');for(const x of ['new LanguageClient(','language:\'nebula\'','**/*.nbx','createNebulaInitializationOptions()','restartNebulaLanguageClient','stopNebulaLanguageClient'])assert.ok(c.includes(x),x);});
test('declara recursos e versão do protocolo',()=>{const c=read('src/lsp/protocol/capabilities.ts');for(const x of ['diagnostics','completion','hover','definition','references','rename','signatureHelp','documentSymbols','semanticTokens','formatting','codeActions','workspaceFolders'])assert.ok(c.includes(x),x);assert.ok(c.includes('3.17'));});
test('registra cliente durante a ativação',()=>assert.ok(read('src/extension.ts').includes('registerNebulaLanguageClient(context)')));
test('verifica artefatos LSP compilados',()=>{const s=pkg.scripts['check-output'];for(const x of ['out/lsp/client/client.js','out/lsp/client/configuration.js','out/lsp/protocol/capabilities.js'])assert.ok(s.includes(x),x);});

test('desativa provedores locais ao habilitar o LSP e os restaura ao desabilitar',()=>{
 const completion=read('src/providers/completion/provider.ts');
 const intelligence=read('src/providers/intelligence/provider.ts');
 assert.ok(completion.includes("affectsConfiguration('nebula.languageServer.enabled')"));
 assert.ok(completion.includes("get<boolean>('enabled',false)"));
 assert.ok(intelligence.includes("affectsConfiguration('nebula.languageServer.enabled')"));
 assert.ok(intelligence.includes('disposeLocal()'));
});
