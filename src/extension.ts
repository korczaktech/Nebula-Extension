import * as vscode from 'vscode';
import { registerNebulaCompletions } from './providers/completion/provider';
export function activate(context:vscode.ExtensionContext):void{
 const output=vscode.window.createOutputChannel('Nebula');
 output.appendLine('Suporte à linguagem Nebula ativado.');
 registerNebulaCompletions(context);
 output.appendLine('Autocomplete contextual e sugestões Nebula registrados.');
 context.subscriptions.push(output);
}
export function deactivate():void{
 // O VS Code libera os recursos registrados em context.subscriptions.
}
