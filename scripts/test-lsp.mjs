import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const executable = process.env.NEBULA_LSP_PATH ?? resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'nebula-lsp.exe' : 'nebula-lsp'
);

function frame(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`;
}

const child = spawn(executable, [], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
let stdout = Buffer.alloc(0);
let stderr = '';
const messages = [];

child.stdout.on('data', chunk => {
  stdout = Buffer.concat([stdout, chunk]);
  while (true) {
    const boundary = stdout.indexOf('\r\n\r\n');
    if (boundary < 0) break;
    const headers = stdout.subarray(0, boundary).toString('ascii');
    const length = Number(headers.match(/Content-Length:\s*(\d+)/i)?.[1]);
    assert.ok(Number.isInteger(length) && length >= 0, 'Content-Length inválido na resposta LSP.');
    const start = boundary + 4;
    if (stdout.length < start + length) break;
    messages.push(JSON.parse(stdout.subarray(start, start + length).toString('utf8')));
    stdout = stdout.subarray(start + length);
  }
});
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

const requests = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: {} } },
  { jsonrpc: '2.0', method: 'initialized', params: {} },
  { jsonrpc: '2.0', id: 2, method: 'shutdown', params: null },
  { jsonrpc: '2.0', method: 'exit', params: null }
];
child.stdin.end(requests.map(frame).join(''));

const exitCode = await new Promise((resolveExit, reject) => {
  child.once('error', reject);
  child.once('close', resolveExit);
});
assert.equal(exitCode, 0, 'O servidor LSP encerrou com erro: ' + stderr);
assert.equal(stdout.length, 0, 'O servidor deixou bytes incompletos no stdout.');
const initialized = messages.find(message => message.id === 1);
assert.ok(initialized?.result?.capabilities, 'O servidor não respondeu ao initialize.');
for (const capability of [
  'textDocumentSync',
  'completionProvider',
  'hoverProvider',
  'signatureHelpProvider',
  'definitionProvider',
  'referencesProvider',
  'documentSymbolProvider'
]) assert.ok(capability in initialized.result.capabilities, 'Capacidade ausente: ' + capability);
assert.ok(messages.some(message => message.id === 2 && message.result === null), 'O servidor não respondeu ao shutdown.');
console.log('Nebula LSP iniciado e validado por JSON-RPC stdio.');
