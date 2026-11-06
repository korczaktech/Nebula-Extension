import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'nebula-cli-wrapper-'));
try {
  const compiler = join(directory, 'nebula-core');
  const wrapper = join(directory, 'nebula');
  const log = join(directory, 'args.txt');
  writeFileSync(compiler, '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > "' + log + '"\n');
  chmodSync(compiler, 0o755);
  writeFileSync(wrapper, (await import('node:fs')).readFileSync(resolve(process.argv[2] ?? 'bin/linux-x64/nebula'), 'utf8'));
  chmodSync(wrapper, 0o755);

  let result = spawnSync(wrapper, ['programa.nbx', '--otimizacao', 'O2'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  let args = (await import('node:fs')).readFileSync(log, 'utf8').trim().split('\n');
  assert.deepEqual(args, ['compilar', 'programa.nbx', '--otimizacao', 'O2']);

  result = spawnSync(wrapper, ['depurar', '--dap', 'programa.nbx'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  args = (await import('node:fs')).readFileSync(log, 'utf8').trim().split('\n');
  assert.deepEqual(args, ['depurar', '--dap', 'programa.nbx']);

  result = spawnSync(wrapper, ['--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  args = (await import('node:fs')).readFileSync(log, 'utf8').trim().split('\n');
  assert.deepEqual(args, ['--version']);
  console.log('CLI wrapper validado: compilação direta, DAP e repasse de comandos oficiais.');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
