import * as vscode from 'vscode';
import { registerNebulaCompletions } from './providers/completion/provider';
import { registerNebulaIntelligence } from './providers/intelligence/provider';
import { registerNebulaLanguageClient } from './lsp/client/client';
import { registerNebulaExecutionCommands } from './commands/execution';
import { registerNebulaDebugger } from './debug/adapter';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Nebula');
  output.appendLine('Suporte à linguagem Nebula ativado.');
  registerNebulaCompletions(context);
  registerNebulaIntelligence(context);
  registerNebulaLanguageClient(context);
  registerNebulaExecutionCommands(context);
  registerNebulaDebugger(context);
  output.appendLine('Provedores locais, integração LSP e comandos de execução e depuração registrados.');
  context.subscriptions.push(output);
}

export function deactivate(): void {
  // O VS Code encerra os recursos registrados em context.subscriptions.
}
