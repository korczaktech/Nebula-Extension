import * as vscode from 'vscode';
import { registerNebulaCompletions } from './providers/completion/provider';
import { registerNebulaIntelligence } from './providers/intelligence/provider';
export function activate(context:vscode.ExtensionContext):void{
 const output=vscode.window.createOutputChannel('Nebula');
 output.appendLine('Suporte à linguagem Nebula ativado.');
 registerNebulaCompletions(context);
 registerNebulaIntelligence(context);
 output.appendLine('Autocomplete e inteligência de código Nebula registrados.');
 context.subscriptions.push(output);
}
export function deactivate():void{
 // O VS Code libera os recursos registrados em context.subscriptions.
}
