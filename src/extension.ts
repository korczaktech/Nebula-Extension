import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Nebula');
  output.appendLine('Suporte à linguagem Nebula ativado.');
  context.subscriptions.push(output);
}

export function deactivate(): void {
  // O VS Code libera os recursos registrados em context.subscriptions.
}
