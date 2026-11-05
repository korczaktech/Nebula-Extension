import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { getNebulaCompilerPath } from '../compiler/native';

let output: vscode.OutputChannel | undefined;
let running: ReturnType<typeof spawn> | undefined;
const runtimeTerminals = new Set<vscode.Terminal>();

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

function shellQuote(value: string): string {
  if (process.platform === 'win32') return "'" + value.replace(/'/g, "''") + "'";
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

function runtimeCommand(executable: string, args: string[]): string {
  const quoted = [executable, ...args].map(shellQuote).join(' ');
  return process.platform === 'win32' ? '& ' + quoted : quoted;
}

function runInRuntimeTerminal(context: vscode.ExtensionContext, target: string): void {
  let executable: string;
  try {
    executable = getNebulaCompilerPath(context.extensionPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage('Nebula: ' + message);
    channel().appendLine('[Runtime] ' + message);
    return;
  }
  const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(target))?.uri.fsPath
    ?? path.dirname(target);
  const terminal = vscode.window.createTerminal({ name: 'Nebula — Runtime', cwd });
  runtimeTerminals.add(terminal);
  terminal.show(true);
  terminal.sendText(runtimeCommand(executable, ['interpretar', target]), true);
}

function runCli(context: vscode.ExtensionContext, args: string[], title: string, target: string): Promise<number> {
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

async function saveCurrentFile(): Promise<string | undefined> {
  const target = activeNebulaFile();
  if (!target) return undefined;
  await vscode.workspace.saveAll(false);
  return target;
}

export function registerNebulaExecutionCommands(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Nebula — Execução');
  context.subscriptions.push(output);
  context.subscriptions.push(vscode.window.onDidCloseTerminal(terminal => runtimeTerminals.delete(terminal)));

  context.subscriptions.push(vscode.commands.registerCommand('nebula.run', async () => {
    const target = await saveCurrentFile();
    if (target) runInRuntimeTerminal(context, target);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('nebula.interpret', async () => {
    const target = await saveCurrentFile();
    if (target) runInRuntimeTerminal(context, target);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('nebula.runNative', async () => {
    const target = await saveCurrentFile();
    if (target) await runCli(context, ['executar', target], 'execução nativa', target);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('nebula.compile', async () => {
    const target = await saveCurrentFile();
    if (target) await runCli(context, ['compilar', target], 'compilação', target);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('nebula.stopExecution', () => {
    let stopped = false;
    if (running) {
      running.kill();
      running = undefined;
      stopped = true;
    }
    for (const terminal of runtimeTerminals) {
      terminal.dispose();
      stopped = true;
    }
    runtimeTerminals.clear();
    if (!stopped) {
      void vscode.window.showInformationMessage('Nebula: não há execução ativa.');
      return;
    }
    channel().appendLine('Execução interrompida pelo usuário.');
    void vscode.window.showInformationMessage('Nebula: execução interrompida.');
  }));
  context.subscriptions.push({
    dispose: () => {
      if (running) running.kill();
      running = undefined;
      for (const terminal of runtimeTerminals) terminal.dispose();
      runtimeTerminals.clear();
    }
  });
}
