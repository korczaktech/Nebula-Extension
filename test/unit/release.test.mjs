import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
const manifest = JSON.parse(read('package.json'));

test('configura testes reais no host do VS Code', () => {
  assert.ok(manifest.devDependencies['@vscode/test-electron']);
  assert.ok(manifest.devDependencies.mocha);
  assert.ok(manifest.scripts['test:integration'].includes('out-test/test/runTest.js'));
  assert.ok(manifest.scripts['compile-tests'].includes('tsconfig.test.json'));
  assert.ok(read('test/suite/index.ts').includes('openTextDocument'));
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
