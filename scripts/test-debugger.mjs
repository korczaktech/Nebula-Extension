import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const executable = resolve(process.argv[2] ?? 'bin/linux-x64/nebula');
const directory = mkdtempSync(join(tmpdir(), 'nebula-dap-'));
const program = join(directory, 'depuracao.nbx');
writeFileSync(program, [
  'variavel itens = [4, 5, 6]',
  'variavel contador = 1',
  'contador = contador + 1',
  'contador = contador + 1',
  'exibir(contador)',
  '',
].join('\\n'));

const child = spawn(executable, ['depurar', '--dap', program], {
  cwd: directory,
  stdio: ['pipe', 'pipe', 'pipe'],
});

const encerramento = new Promise((resolver, rejeitar) => {
  child.once('exit', code => code === 0 ? resolver() : rejeitar(new Error('CLI terminou com código ' + code)));
  child.once('error', rejeitar);
});
void encerramento.catch(() => {});

let buffer = Buffer.alloc(0);
let stderr = '';
const mensagens = [];
const aguardando = [];

child.stdout.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const separador = buffer.indexOf('\\r\\n\\r\\n');
    if (separador < 0) break;
    const cabecalho = buffer.subarray(0, separador).toString('ascii');
    const tamanho = Number(cabecalho.match(/Content-Length:\\s*(\\d+)/i)?.[1]);
    if (!Number.isFinite(tamanho)) throw new Error('Cabeçalho DAP sem Content-Length.');
    const inicio = separador + 4;
    if (buffer.length < inicio + tamanho) break;
    const corpo = buffer.subarray(inicio, inicio + tamanho);
    buffer = buffer.subarray(inicio + tamanho);
    const mensagem = JSON.parse(corpo.toString('utf8'));
    const indice = aguardando.findIndex(item => item.predicado(mensagem));
    if (indice >= 0) aguardando.splice(indice, 1)[0].resolver(mensagem);
    else mensagens.push(mensagem);
  }
});
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

function esperar(predicado, descricao, limiteMs = 10000) {
  const indice = mensagens.findIndex(predicado);
  if (indice >= 0) return Promise.resolve(mensagens.splice(indice, 1)[0]);
  return new Promise((resolver, rejeitar) => {
    const temporizador = setTimeout(() => {
      const indiceAguardando = aguardando.findIndex(item => item.resolver === resolver);
      if (indiceAguardando >= 0) aguardando.splice(indiceAguardando, 1);
      rejeitar(new Error('Tempo esgotado aguardando ' + descricao + '. ' + stderr));
    }, limiteMs);
    aguardando.push({
      predicado,
      resolver: mensagem => {
        clearTimeout(temporizador);
        resolver(mensagem);
      },
    });
  });
}

let sequencia = 1;
async function requisitar(comando, argumentos = {}) {
  const seq = sequencia++;
  const resposta = esperar(
    mensagem => mensagem.type === 'response' && mensagem.request_seq === seq,
    'resposta ' + comando,
  );
  const corpo = Buffer.from(JSON.stringify({
    seq,
    type: 'request',
    command: comando,
    arguments: argumentos,
  }));
  child.stdin.write('Content-Length: ' + corpo.length + '\\r\\n\\r\\n');
  child.stdin.write(corpo);
  const mensagem = await resposta;
  assert.equal(mensagem.success, true, comando + ': ' + JSON.stringify(mensagem.body));
  return mensagem.body ?? {};
}

try {
  await requisitar('initialize', {
    adapterID: 'nebula',
    linesStartAt1: true,
    columnsStartAt1: true,
  });
  await esperar(m => m.type === 'event' && m.event === 'initialized', 'evento initialized');

  await requisitar('launch', { program, stopOnEntry: true });
  const pontos = await requisitar('setBreakpoints', {
    source: { name: 'depuracao.nbx', path: program },
    breakpoints: [{ line: 3 }],
  });
  assert.equal(pontos.breakpoints[0].verified, true, 'breakpoint precisa ser verificado');
  await requisitar('configurationDone');

  const entrada = await esperar(
    m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'entry',
    'pausa de entrada',
  );
  assert.equal(entrada.body.threadId, 1);

  await requisitar('continue', { threadId: 1 });
  await esperar(
    m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'breakpoint',
    'breakpoint na linha 3',
  );

  const pilha = await requisitar('stackTrace', { threadId: 1 });
  assert.equal(pilha.stackFrames[0].name, 'Programa');
  assert.equal(pilha.stackFrames[0].line, 3);
  assert.equal(pilha.stackFrames[0].source.path, program);

  const escoposPrograma = await requisitar('scopes', { frameId: pilha.stackFrames[0].id });
  const escopoGlobalPrograma = escoposPrograma.scopes.find(escopo => escopo.name === 'Globais');
  assert.ok(escopoGlobalPrograma);
  const variaveisPrograma = await requisitar('variables', { variablesReference: escopoGlobalPrograma.variablesReference });
  const lista = variaveisPrograma.variables.find(variavel => variavel.name === 'itens');
  assert.ok(lista && lista.variablesReference > 0, 'listas devem ser expansíveis');
  const elementos = await requisitar('variables', { variablesReference: lista.variablesReference });
  assert.equal(elementos.variables.find(variavel => variavel.name === '0').value, 'Inteiro(4)');
  assert.ok(variaveisPrograma.variables.some(variavel => variavel.name === 'contador' && variavel.value === 'Inteiro(1)'));

  await requisitar('next', { threadId: 1 });
  await esperar(m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'step', 'avanço sobre instrução');
  const pilhaSeguinte = await requisitar('stackTrace', { threadId: 1 });
  assert.equal(pilhaSeguinte.stackFrames[0].line, 4);

  await requisitar('continue', { threadId: 1 });
  const saida = await esperar(
    m => m.type === 'event' && m.event === 'output' && m.body.output.includes('3'),
    'saída do runtime',
  );
  assert.match(saida.body.output, /3/);
  await esperar(m => m.type === 'event' && m.event === 'terminated', 'evento terminated');
  child.stdin.end();
  await encerramento;
  console.log('DAP: inicialização, breakpoint, step-over, pilha, escopos e variáveis validados.');
} catch (error) {
  child.kill();
  throw error;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
