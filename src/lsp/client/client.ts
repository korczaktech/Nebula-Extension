import * as vscode from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, Trace, State } from 'vscode-languageclient/node';
import { getNebulaLanguageServerConfiguration } from './configuration';
import { createNebulaInitializationOptions } from '../protocol/capabilities';
import { getNebulaLanguageServerPath, hasNebulaLanguageServer, installNebulaLanguageServer } from './installer';
import { setNebulaLanguageServerReady } from './state';

let client: LanguageClient | undefined;
let output: vscode.OutputChannel | undefined;
let fileWatcher: vscode.FileSystemWatcher | undefined;
let starting = false;
let installationPrompted = false;

function log(message: string): void {
  output?.appendLine('[LSP] ' + message);
}

function serverOptions(context: vscode.ExtensionContext): ServerOptions {
  const configuration = getNebulaLanguageServerConfiguration();
  return {
    command: getNebulaLanguageServerPath(context, configuration.serverPath),
    args: configuration.args,
    options: {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      env: process.env
    }
  };
}

function clientOptions(context: vscode.ExtensionContext): LanguageClientOptions {
  fileWatcher ??= vscode.workspace.createFileSystemWatcher('**/*.nbx');
  if (!context.subscriptions.includes(fileWatcher)) context.subscriptions.push(fileWatcher);
  return {
    documentSelector: [{ scheme: 'file', language: 'nebula' }],
    synchronize: { fileEvents: fileWatcher },
    initializationOptions: createNebulaInitializationOptions(),
    outputChannel: output,
    traceOutputChannel: output
  };
}

async function ensureServerInstalled(context: vscode.ExtensionContext): Promise<boolean> {
  const configuration = getNebulaLanguageServerConfiguration();
  if (hasNebulaLanguageServer(context, configuration.serverPath)) return true;
  let expected = 'bin/<plataforma>/nebula-lsp';
  try { expected = getNebulaLanguageServerPath(context, configuration.serverPath); }
  catch (error) { expected = error instanceof Error ? error.message : String(error); }
  log('Servidor LSP incorporado indisponível: ' + expected);
  void vscode.window.showErrorMessage('Nebula: servidor LSP desta plataforma indisponível. ' + expected);
  return false;
}

export async function startNebulaLanguageClient(context: vscode.ExtensionContext): Promise<void> {
  if (client || starting) return;
  const configuration = getNebulaLanguageServerConfiguration();
  if (!configuration.enabled) {
    setNebulaLanguageServerReady(false);
    log('Integração desativada em nebula.languageServer.enabled.');
    return;
  }

  starting = true;
  try {
    output ??= vscode.window.createOutputChannel('Nebula Language Server');
    if (!(await ensureServerInstalled(context))) return;

    const command = getNebulaLanguageServerPath(context, configuration.serverPath);
    const instance = new LanguageClient(
      'nebulaLanguageServer',
      'Nebula Language Server',
      serverOptions(context),
      clientOptions(context)
    );
    instance.setTrace(
      configuration.trace === 'verbose' ? Trace.Verbose :
      configuration.trace === 'messages' ? Trace.Messages : Trace.Off
    );
    client = instance;
    context.subscriptions.push(instance);
    instance.onDidChangeState(event => {
      setNebulaLanguageServerReady(event.newState === State.Running);
      log('Estado: ' + (event.newState === State.Running ? 'conectado' : 'desconectado'));
    });
    await instance.start();
    setNebulaLanguageServerReady(true);
    log('Conectado ao servidor: ' + command);
  } catch (error) {
    const current = client;
    client = undefined;
    setNebulaLanguageServerReady(false);
    const message = error instanceof Error ? error.message : String(error);
    log('Falha ao iniciar: ' + message);
    if (current) {
      try { await current.stop(); } catch { /* O processo pode já ter terminado. */ }
    }
    void vscode.window.showWarningMessage('Nebula: não foi possível iniciar o Language Server. Consulte o canal de saída.');
  } finally {
    starting = false;
  }
}

export async function stopNebulaLanguageClient(): Promise<void> {
  const current = client;
  client = undefined;
  setNebulaLanguageServerReady(false);
  if (!current) return;
  try {
    await current.stop();
    log('Conexão encerrada.');
  } catch (error) {
    log('Erro ao encerrar: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function restartNebulaLanguageClient(context: vscode.ExtensionContext): Promise<void> {
  await stopNebulaLanguageClient();
  await startNebulaLanguageClient(context);
}

export function registerNebulaLanguageClient(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('Nebula Language Server');
  context.subscriptions.push(output);

  context.subscriptions.push(vscode.commands.registerCommand(
    'nebula.installLanguageServer',
    async () => {
      try {
        await stopNebulaLanguageClient();
        const executable = await installNebulaLanguageServer(context, output!);
        installationPrompted = true;
        void vscode.window.showInformationMessage('Servidor LSP instalado: ' + executable);
        await restartNebulaLanguageClient(context);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log('Falha na instalação: ' + message);
        void vscode.window.showErrorMessage('Nebula: falha ao instalar o servidor LSP. ' + message);
      }
    }
  ));
  context.subscriptions.push(vscode.commands.registerCommand(
    'nebula.restartLanguageServer',
    () => restartNebulaLanguageClient(context)
  ));
  context.subscriptions.push(vscode.commands.registerCommand(
    'nebula.languageServerStatus',
    () => {
      const state = client?.state === State.Running ? 'conectado' :
        client?.state === State.Starting ? 'iniciando' :
        getNebulaLanguageServerConfiguration().enabled ? 'desconectado' : 'desativado';
      void vscode.window.showInformationMessage('Nebula Language Server: ' + state + '.');
    }
  ));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('nebula.languageServer')) {
      installationPrompted = false;
      void restartNebulaLanguageClient(context);
    }
  }));
  context.subscriptions.push({ dispose: () => { void stopNebulaLanguageClient(); } });
  void startNebulaLanguageClient(context);
}
