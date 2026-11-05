import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as vscode from 'vscode';

let output: vscode.OutputChannel | undefined;
let running: ReturnType<typeof spawn> | undefined;

function executablePath(): string {
  return vscode.workspace.getConfiguration('nebula').get<string>('executablePath', 'nebula').trim() || 'nebula';
}

function activeNebulaFile(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'nebula' || editor.document.isUntitled) {
    void vscode.window.showWarningMessage('Abra e salve um arquivo .nbx antes de executar este comando.');
    return undefined;
  }
  return editor.document.uri.fsPath;
}

function channel(): vscode.OutputChannel {
  output ??= vscode.window.createOutputChannel('Nebula — Execução');
  return output;
}

function runCli(args: string[], title: string): Promise<number> {
  const target = activeNebulaFile();
  if (!target) return Promise.resolve(2);

  const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(target))?.uri.fsPath
    ?? path.dirname(target);
  const out = channel();
  out.clear();
  out.show(true);
  out.appendLine(`> ${path.basename(executablePath())} ${args.map(value => JSON.stringify(value)).join(' ')}`);
  out.appendLine('');

  return new Promise(resolve => {
    const child = spawn(executablePath(), args, { cwd, env: process.env, windowsHide: true });
    let settled = false;
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      if (running === child) running = undefined;
      out.appendLine('');
      out.appendLine(`Processo finalizado (código ${code}).`);
      if (code === 0) void vscode.window.showInformationMessage(`Nebula: ${title} concluído.`);
      else void vscode.window.showErrorMessage(`Nebula: ${title} falhou (código ${code}). Consulte “Nebula — Execução”.`);
      resolve(code);
    };
    running = child;
    child.stdout.on('data', chunk => out.append(chunk.toString()));
    child.stderr.on('data', chunk => out.append(chunk.toString()));
    child.once('error', error => {
      out.appendLine('');
      out.appendLine(`Falha ao iniciar ${title}: ${error.message}`);
      out.appendLine('Configure nebula.executablePath com o caminho do executável CLI ou instale o compilador Nebula.');
      finish(127);
    });
    child.once('close', code => finish(code ?? 1));
  });
}

export function registerNebulaExecutionCommands(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Nebula — Execução');
  context.subscriptions.push(output);

  context.subscriptions.push(vscode.commands.registerCommand('nebula.compile', async () => {
    if (!activeNebulaFile()) return;
    await vscode.workspace.saveAll(false);
    await runCli(['compilar', activeNebulaFile()!], 'compilação');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('nebula.interpret', async () => {
    if (!activeNebulaFile()) return;
    await vscode.workspace.saveAll(false);
    await runCli(['interpretar', activeNebulaFile()!], 'interpretação');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('nebula.stopExecution', () => {
    if (!running) {
      void vscode.window.showInformationMessage('Nebula: não há execução ativa.');
      return;
    }
    running.kill();
    running = undefined;
    channel().appendLine('\nExecução interrompida pelo usuário.');
  }));

  context.subscriptions.push({ dispose: () => {
    if (running) running.kill();
    running = undefined;
  } });
}
