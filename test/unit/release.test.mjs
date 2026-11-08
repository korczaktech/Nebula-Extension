import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
const manifest = JSON.parse(read('package.json'));

test('configura testes reais no host do VS Code', () => {
  assert.ok(manifest.devDependencies['@vscode/test-electron']);
  assert.ok(manifest.devDependencies.mocha);
  assert.ok(manifest.scripts['test:integration'].includes('out-test/test/runTest.js'));
  assert.ok(manifest.scripts['compile-tests'].includes('tsconfig.test.json'));
  assert.ok(read('test/suite/extension.test.ts').includes('openTextDocument'));
  assert.ok(read('test/runTest.ts').includes('downloadVSCodeWithRetry'));
  assert.ok(read('test/runTest.ts').includes('attempt <= 3'));
});

test('o pipeline valida e publica o VSIX gerado', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.ok(workflow.includes('npm run test:integration'));
  assert.ok(workflow.includes('npm run package:ci'));
  assert.ok(workflow.includes('actions/upload-artifact@v4'));
  assert.ok(manifest.scripts['package:ci'].includes('verify-vsix.mjs'));
});

test('o pacote inclui dependências de execução necessárias ao cliente LSP', () => {
  assert.ok(manifest.dependencies['vscode-languageclient']);
  assert.equal(manifest.files, undefined, 'VSCE não permite combinar files com .vscodeignore');
  assert.ok(!read('.vscodeignore').split(/\r?\n/).includes('node_modules/**'));
  assert.ok(!read('scripts/package-extension.sh').includes('--no-dependencies'));
  assert.ok(read('scripts/verify-vsix.mjs').includes('extension/node_modules/vscode-languageclient/package.json'));
});

test('o empacotamento exclui fontes, testes e documentação interna', () => {
  const ignore = read('.vscodeignore');
  for (const entry of ['src/**', 'test/**', 'docs/**', '**/*.ts', '**/*.map']) {
    assert.ok(ignore.includes(entry), 'Regra de exclusão ausente: ' + entry);
  }
});

test('CI testa a execução interativa do runtime incorporado', () => {
  const workflow = read('.github/workflows/ci.yml');
  const smoke = read('scripts/test-runtime.mjs');
  const build = read('scripts/build-native.sh');
  assert.ok(workflow.includes('node scripts/test-runtime.mjs bin/linux-x64/nebula'));
  assert.ok(smoke.includes("input: 'Ada\\n'"));
  assert.ok(smoke.includes("assert.equal(result.stdout, 'Nome: Ada\\n')"));
  assert.ok(build.includes('cargo tree'));
  assert.ok(build.includes('nebula-runtime'));
});


test('registra depuração DAP da linguagem Nebula', () => {
  const debuggerAdapter = read('src/debug/adapter.ts');
  const extension = read('src/extension.ts');
  const contribution = manifest.contributes.debuggers?.find(item => item.type === 'nebula');
  assert.ok(contribution);
  assert.ok(contribution.languages.includes('nebula'));
  assert.ok(contribution.initialConfigurations.some(item => item.request === 'launch'));
  assert.ok(manifest.activationEvents.includes('onDebugResolve:nebula'));
  assert.ok(extension.includes('registerNebulaDebugger(context)'));
  assert.ok(debuggerAdapter.includes('registerDebugConfigurationProvider'));
  assert.ok(debuggerAdapter.includes('registerDebugAdapterDescriptorFactory'));
  assert.ok(debuggerAdapter.includes("'depurar', '--dap', program"));
});


test('CI valida o protocolo DAP do compilador incorporado', () => {
  const workflow = read('.github/workflows/ci.yml');
  const smoke = read('scripts/test-debugger.mjs');
  assert.ok(workflow.includes('npm run test:debugger -- bin/linux-x64/nebula'));
  for (const capability of ['initialize', 'launch', 'setBreakpoints', 'configurationDone', 'continue', 'stackTrace', 'scopes', 'variables', 'next']) {
    assert.ok(smoke.includes("'" + capability + "'"));
  }
});


test('inclui adaptador DAP no pacote final', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.version, '0.0.11');
  assert.ok(manifest.scripts['check-output'].includes('out/debug/adapter.js'));
  assert.ok(read('scripts/verify-vsix.mjs').includes('extension/out/debug/adapter.js'));
});

test('nenhum recurso do editor trata fim como palavra-chave ou fechamento de bloco', () => {
  const grammar = read('syntaxes/nebula.tmLanguage.json');
  const snippets = read('snippets/nebula.json');
  const languageConfiguration = read('language-configuration.json');
  const engine = require('../../src/providers/intelligence/engine.js');
  for (const [name, content] of [['gramática TextMate', grammar], ['snippets', snippets], ['configuração do editor', languageConfiguration]]) {
    assert.ok(!/\bfim\b/u.test(content), name + ' ainda contém uma regra textual para fim.');
  }
  const token = engine.scan('fim');
  assert.equal(token.length, 1);
  assert.equal(token[0].type, 'identifier');
  assert.deepEqual(engine.getDiagnostics('fim'), []);
});
