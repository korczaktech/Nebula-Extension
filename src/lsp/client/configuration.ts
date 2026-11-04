import * as vscode from 'vscode';
export interface NebulaLanguageServerConfiguration { enabled:boolean; serverPath:string; args:string[]; trace:'off'|'messages'|'verbose'; }
export function getNebulaLanguageServerConfiguration():NebulaLanguageServerConfiguration {
 const c=vscode.workspace.getConfiguration('nebula.languageServer');
 return {enabled:c.get<boolean>('enabled',false),serverPath:c.get<string>('serverPath','nebula-lsp').trim(),args:c.get<string[]>('args',[]),trace:c.get<'off'|'messages'|'verbose'>('trace','off')};
}