import * as vscode from 'vscode';
import { getCompletionCandidates } from './engine';
const kinds:Record<string,vscode.CompletionItemKind>={keyword:vscode.CompletionItemKind.Keyword,constant:vscode.CompletionItemKind.Constant,function:vscode.CompletionItemKind.Function,variable:vscode.CompletionItemKind.Variable,type:vscode.CompletionItemKind.Class,struct:vscode.CompletionItemKind.Struct,enum:vscode.CompletionItemKind.Enum,enumMember:vscode.CompletionItemKind.EnumMember,field:vscode.CompletionItemKind.Field,module:vscode.CompletionItemKind.Module};
export class NebulaCompletionProvider implements vscode.CompletionItemProvider {
 provideCompletionItems(document:vscode.TextDocument,position:vscode.Position,_token:vscode.CancellationToken,_context:vscode.CompletionContext):vscode.CompletionItem[]{
  const offset=document.offsetAt(position),source=document.getText(),result=getCompletionCandidates(source,offset);
  return result.candidates.map((candidate,index)=>{
   const item=new vscode.CompletionItem(candidate.label,kinds[candidate.kind]??vscode.CompletionItemKind.Text);
   item.detail=candidate.detail;item.documentation=new vscode.MarkdownString(candidate.documentation);
   item.filterText=candidate.label;item.sortText=String(index).padStart(4,'0')+candidate.label;
   item.range=new vscode.Range(document.positionAt(result.wordStart),position);
   item.insertText=candidate.insertText?new vscode.SnippetString(candidate.insertText):candidate.label;return item;
  });
 }
}
export function registerNebulaCompletions(context:vscode.ExtensionContext):void{
 let registration:vscode.Disposable|undefined;
 const sync=()=>{const enabled=vscode.workspace.getConfiguration('nebula.languageServer').get<boolean>('enabled',false);if(enabled){registration?.dispose();registration=undefined;}else if(!registration){registration=vscode.languages.registerCompletionItemProvider({language:'nebula'},new NebulaCompletionProvider(),'.',':');}};
 sync();
 context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('nebula.languageServer.enabled'))sync();}));
 context.subscriptions.push(new vscode.Disposable(()=>registration?.dispose()));
}
