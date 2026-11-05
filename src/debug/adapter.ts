import * as path from 'node:path';
import * as vscode from 'vscode';
import { getNebulaCompilerPath } from '../compiler/native';

class NebulaDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    configuration: vscode.DebugConfiguration,
  ): vscode.DebugConfiguration | undefined {
    if (!configuration.type) configuration.type = 'nebula';
    if (!configuration.request) configuration.request = 'launch';
    if (!configuration.name) configuration.name = 'Depurar Nebula';
    if (!configuration.program) {
      const editor = vscode.window.activeTextEditor;
      if (editor?.document.languageId === 'nebula' && !editor.document.isUntitled) {
        configuration.program = editor.document.uri.fsPath;
      }
    }
    if (!configuration.program) {
      void vscode.window.showErrorMessage('Nebula: informe o arquivo .nbx em "program".');
      return undefined;
    }
    configuration.program = path.resolve(folder?.uri.fsPath ?? process.cwd(), configuration.program);
    configuration.stopOnEntry ??= true;
    return configuration;
  }
}

class NebulaDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
  constructor(private readonly context: vscode.ExtensionContext) {}

  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    let executable: string;
    try {
      executable = getNebulaCompilerPath(this.context.extensionPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage('Nebula: não foi possível iniciar o depurador: ' + message);
      throw error;
    }
    const program = session.configuration.program as string;
    const cwd = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(program))?.uri.fsPath
      ?? path.dirname(program);
    const args = ['depurar', '--dap', program];
    if (session.configuration.stopOnEntry === false) args.push('--continuar-inicializacao');
    return new vscode.DebugAdapterExecutable(executable, args, { cwd });
  }
}

export function registerNebulaDebugger(context: vscode.ExtensionContext): void {
  const provider = new NebulaDebugConfigurationProvider();
  const factory = new NebulaDebugAdapterDescriptorFactory(context);
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('nebula', provider),
    vscode.debug.registerDebugAdapterDescriptorFactory('nebula', factory),
  );
}
