import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { getNebulaCompilerPath } from '../compiler/native';

let output: vscode.OutputChannel | undefined;
let running: ReturnType<typeof spawn> | undefined;

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

function runCli(context: vscode.ExtensionContext, args: string[], title: string): Promise<number> {
  const target = activeNebulaFile();
  if (!target) return Promise.resolve(2);

  let executable: string;
  try {
    executable = getNebulaCompilerPath(context.extensionPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage('Nebula: ' + message);
    channel().appendLine('[Compilador] ' + message);
    return Promise.resolve(127);
  }

  const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(target))?.uri.fsPath
    ?? path.dirname(target);
  const out = channel();
  out.clear();
  out.show(true);
  out.appendLine(`> Nebula ${args.map(value => JSON.stringify(value)).join(' ')}`);
  out.appendLine('');

  return new Promise(resolve => {
    const child = spawn(executable, args, { cwd, env: process.env, windowsHide: true });
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
      finish(127);
    });
    child.once('close', code => finish(code ?? 1));
  });
}

export function registerNebulaExecutionCommands(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Nebula — Execução');
  context.subscriptions.push(output);

  context.subscriptions.push(vscode.commands.registerCommand('nebula.run', async () => {
    if (!activeNebulaFile()) return;
    await vscode.workspace.saveAll(false);
    await runCli(context, ['executar', activeNebulaFile()!], 'execução');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('nebula.compile', async () => {
    if (!activeNebulaFile()) return;
    await vscode.workspace.saveAll(false);
    await runCli(context, ['compilar', activeNebulaFile()!], 'compilação');
  }));

  context.subscriptions.push(vscode.commands.registerCommand('nebula.interpret', async () => {
    if (!activeNebulaFile()) return;
    await vscode.workspace.saveAll(false);
    await runCli(context, ['interpretar', activeNebulaFile()!], 'interpretação');
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
