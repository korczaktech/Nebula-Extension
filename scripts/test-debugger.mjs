import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const executable = resolve(process.argv[2] ?? 'bin/linux-x64/nebula');
const directory = mkdtempSync(join(tmpdir(), 'nebula-dap-'));
const program = join(directory, 'depuracao.nbx');
writeFileSync(program, [
  'funcao somar(valor: inteiro): inteiro {',
  '    devolver valor + 1',
  '}',
  'variavel itens = [4, 5, 6]',
  'variavel contador = 1',
  'contador = somar(contador)',
  'contador = contador + 1',
  'exibir(contador)',
  '',
].join('\n'));

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
    const separador = buffer.indexOf('\r\n\r\n');
    if (separador < 0) break;
    const cabecalho = buffer.subarray(0, separador).toString('ascii');
    const tamanho = Number(cabecalho.match(/Content-Length:\s*(\d+)/i)?.[1]);
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
  child.stdin.write('Content-Length: ' + corpo.length + '\r\n\r\n');
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
    breakpoints: [{ line: 4 }],
  });
  assert.equal(pontos.breakpoints[0].verified, true, 'breakpoint de linha precisa ser verificado');
  const pontosModulo = await requisitar('setBreakpoints', {
    source: { name: 'Matematica.nbx', path: moduleFile },
    breakpoints: [{ line: 2 }],
  });
  assert.equal(pontosModulo.breakpoints[0].verified, true, 'breakpoint em módulo importado precisa ser verificado');
  await requisitar('configurationDone');

  const entrada = await esperar(
    m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'entry',
    'pausa de entrada',
  );
  assert.equal(entrada.body.threadId, 1);

  await requisitar('continue', { threadId: 1 });
  await esperar(
    m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'breakpoint',
    'breakpoint na linha 4',
  );

  await requisitar('stepIn', { threadId: 1 });
  await esperar(m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'breakpoint', 'breakpoint no módulo importado');
  const pilha = await requisitar('stackTrace', { threadId: 1 });
  assert.equal(pilha.stackFrames[0].name, 'somar');
  assert.equal(pilha.stackFrames[0].line, 2, 'pilha deve apontar para a linha real da função');
  assert.equal(pilha.stackFrames[0].source.path, moduleFile, 'quadro da função deve apontar para o módulo');
  assert.equal(pilha.stackFrames[1].name, 'Programa');
  assert.equal(pilha.stackFrames[1].line, 4, 'quadro chamador deve apontar para a chamada');
  assert.equal(pilha.stackFrames[1].source.path, program, 'quadro chamador deve apontar para o arquivo principal');
  const avaliado = await requisitar('evaluate', { expression: 'valor', frameId: pilha.stackFrames[0].id, context: 'hover' });
  assert.equal(avaliado.result, 'Inteiro(1)');
  const escoposPrograma = await requisitar('scopes', { frameId: pilha.stackFrames[1].id });
  const escopoGlobalPrograma = escoposPrograma.scopes.find(escopo => escopo.name === 'Globais');
  assert.ok(escopoGlobalPrograma); 
  const variaveisPrograma = await requisitar('variables', { variablesReference: escopoGlobalPrograma.variablesReference });
  const lista = variaveisPrograma.variables.find(variavel => variavel.name === 'itens');
  assert.ok(lista && lista.variablesReference > 0, 'listas devem ser expansíveis');
  const elementos = await requisitar('variables', { variablesReference: lista.variablesReference });
  assert.equal(elementos.variables.find(variavel => variavel.name === '0').value, 'Inteiro(4)');
  const escopos = await requisitar('scopes', { frameId: pilha.stackFrames[0].id });
  const locais = escopos.scopes.find(escopo => escopo.name === 'Escopo 1');
  assert.ok(locais, 'escopo local precisa estar disponível');
  const variaveisLocais = await requisitar('variables', { variablesReference: locais.variablesReference });
  assert.ok(variaveisLocais.variables.some(variavel => variavel.name === 'valor' && variavel.value === 'Inteiro(1)'));

  await requisitar('stepOut', { threadId: 1 });
  await esperar(m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'step', 'retorno da função');
  const pilhaRetorno = await requisitar('stackTrace', { threadId: 1 });
  assert.equal(pilhaRetorno.stackFrames[0].line, 5);
  const escoposGlobais = await requisitar('scopes', { frameId: pilhaRetorno.stackFrames[0].id });
  const globais = escoposGlobais.scopes.find(escopo => escopo.name === 'Globais');
  const variaveisGlobais = await requisitar('variables', { variablesReference: globais.variablesReference });
  assert.ok(variaveisGlobais.variables.some(variavel => variavel.name === 'contador' && variavel.value === 'Inteiro(2)'));

  await requisitar('next', { threadId: 1 });
  await esperar(m => m.type === 'event' && m.event === 'stopped' && m.body.reason === 'step', 'avanço sobre instrução');
  const pilhaSeguinte = await requisitar('stackTrace', { threadId: 1 });
  assert.equal(pilhaSeguinte.stackFrames[0].line, 6);

  await requisitar('continue', { threadId: 1 });
  const saida = await esperar(
    m => m.type === 'event' && m.event === 'output' && m.body.output.includes('3'),
    'saída do runtime',
  );
  assert.match(saida.body.output, /3/);
  await esperar(m => m.type === 'event' && m.event === 'terminated', 'evento terminated');
  child.stdin.end();
  await encerramento;
  console.log('DAP: inicialização, breakpoint por linha, step-in, step-out, step-over, pilha, escopos e variáveis validados.');
} catch (error) {
  child.kill();
  throw error;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
