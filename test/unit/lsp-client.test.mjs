import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));

test('declara cliente LSP compatível com a versão mínima do VS Code', () => {
  assert.ok(pkg.dependencies['vscode-languageclient']);
  assert.equal(pkg.engines.vscode, '^1.85.0');
});

test('ativa a integração por padrão e permite caminho externo', () => {
  const properties = pkg.contributes.configuration.properties;
  assert.equal(properties['nebula.languageServer.enabled'].default, true);
  assert.equal(properties['nebula.languageServer.serverPath'].default, '');
  assert.deepEqual(properties['nebula.languageServer.args'].default, []);
  assert.deepEqual(properties['nebula.languageServer.trace'].enum, ['off', 'messages', 'verbose']);
});

test('publica comandos para instalar, reiniciar e consultar o servidor', () => {
  const commands = pkg.contributes.commands.map(item => item.command);
  assert.ok(commands.includes('nebula.installLanguageServer'));
  assert.ok(commands.includes('nebula.restartLanguageServer'));
  assert.ok(commands.includes('nebula.languageServerStatus'));
});

test('cliente inicia o processo local e observa arquivos Nebula', () => {
  const client = read('src/lsp/client/client.ts');
  for (const value of [
    'new LanguageClient(',
    'getNebulaLanguageServerPath(context',
    'ensureServerInstalled(context)',
    "language: 'nebula'",
    '**/*.nbx',
    'restartNebulaLanguageClient',
    'stopNebulaLanguageClient'
  ]) assert.ok(client.includes(value), value);
});

test('resolve o servidor LSP incorporado sem depender de Cargo', () => {
  const installer = read('src/lsp/client/installer.ts');
  assert.ok(installer.includes('getNebulaLanguageServerBinaryPath'));
  assert.ok(installer.includes('context.extensionPath'));
  assert.ok(installer.includes('fs.accessSync'));
  assert.ok(!installer.includes("spawn('cargo'"));
});

test('anuncia somente recursos realmente suportados pelo servidor Rust', () => {
  const capabilities = read('src/lsp/protocol/capabilities.ts');
  for (const feature of ['diagnostics', 'completion', 'hover', 'definition', 'references', 'signatureHelp', 'documentSymbols']) {
    assert.ok(capabilities.includes(feature), feature);
  }
  for (const unsupported of ['semanticTokens', 'formatting', 'codeActions', 'rename', 'workspaceFolders']) {
    assert.ok(!capabilities.includes(unsupported), unsupported);
  }
  assert.ok(capabilities.includes('3.17'));
});

test('registra o cliente durante a ativação da extensão', () => {
  assert.ok(read('src/extension.ts').includes('registerNebulaLanguageClient(context)'));
});

test('mantém provedores locais para recursos ainda não oferecidos pelo servidor', () => {
  const provider = read('src/providers/intelligence/provider.ts');
  assert.ok(provider.includes("const next=isNebulaLanguageServerReady()?'lsp':'local'"));
  assert.ok(provider.includes('registerDocumentSemanticTokensProvider'));
  assert.ok(provider.includes('registerDocumentFormattingEditProvider'));
  assert.ok(provider.includes('registerCodeActionsProvider'));
  assert.ok(provider.includes('registerRenameProvider'));
});

test('verifica o cliente e o instalador nos artefatos compilados', () => {
  const script = pkg.scripts['check-output'];
  for (const artifact of [
    'out/lsp/client/client.js',
    'out/lsp/client/configuration.js',
    'out/lsp/client/installer.js',
    'out/lsp/client/state.js',
    'out/lsp/protocol/capabilities.js'
  ]) assert.ok(script.includes(artifact), artifact);
});


test('publica executar, compilar e interpretar no editor Nebula', () => {
  const commands = pkg.contributes.commands.map(item => item.command);
  assert.ok(commands.includes('nebula.run'));
  assert.ok(commands.includes('nebula.compile'));
  assert.ok(commands.includes('nebula.interpret'));
  assert.ok(pkg.contributes.menus['editor/title'].some(item => item.command === 'nebula.run'));
  const execution = read('src/commands/execution.ts');
  assert.ok(execution.includes("runCli(['executar'"));
  assert.ok(execution.includes("runCli(['compilar'"));
  assert.ok(execution.includes("runCli(['interpretar'"));
});

test('resolve o compilador empacotado para a plataforma atual', () => {
  const resolver = read('src/compiler/native.ts');
  assert.ok(resolver.includes("path.join(extensionPath, 'bin', target[kind])"));
  assert.ok(resolver.includes('process.platform'));
  assert.ok(resolver.includes('process.arch'));
  assert.ok(resolver.includes('getNebulaLanguageServerBinaryPath'));
});

test('não exige configuração de executável externo', () => {
  assert.equal(pkg.contributes.configuration.properties['nebula.executablePath'], undefined);
  const execution = read('src/commands/execution.ts');
  assert.ok(execution.includes('getNebulaCompilerPath(context.extensionPath)'));
  assert.ok(!execution.includes('executablePath()'));
});
