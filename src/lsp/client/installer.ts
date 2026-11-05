import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { getNebulaLanguageServerBinaryPath } from '../../compiler/native';

export function getNebulaLanguageServerPath(context: vscode.ExtensionContext, configuredPath = ''): string {
  const override = configuredPath.trim();
  if (override) {
    if (!fs.existsSync(override)) throw new Error('O caminho configurado em nebula.languageServer.serverPath não existe: ' + override);
    return override;
  }
  return getNebulaLanguageServerBinaryPath(context.extensionPath);
}

export function hasNebulaLanguageServer(context: vscode.ExtensionContext, configuredPath = ''): boolean {
  try {
    fs.accessSync(getNebulaLanguageServerPath(context, configuredPath), fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function installNebulaLanguageServer(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<string> {
  const executable = getNebulaLanguageServerPath(context);
  fs.accessSync(executable, fs.constants.X_OK);
  output.appendLine('[LSP] Servidor incorporado encontrado em ' + executable);
  return executable;
}
