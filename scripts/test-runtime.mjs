import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const executable = resolve(process.argv[2] ?? 'bin/linux-x64/nebula');
const directory = mkdtempSync(join(tmpdir(), 'nebula-runtime-test-'));
const source = join(directory, 'entrada.nbx');

try {
  writeFileSync(source, 'variavel nome = receber("Nome: ")\nexibir(nome)\n', 'utf8');
  const result = spawnSync(executable, ['interpretar', source], {
    cwd: directory,
    input: 'Ada\n',
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr || `Código de saída: ${result.status}`);
  assert.equal(result.stdout, 'Nome: Ada\n');
  console.log('Runtime validado: entrada interativa, prompt, saída e encerramento.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
