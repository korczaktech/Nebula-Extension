import * as vscode from 'vscode';
import { collectSymbols, findWord, findReferences, findFunctionAtCall, getDiagnostics, getDocumentSymbols, getSemanticTokens, formatDocument } from './engine';
import { isNebulaLanguageServerReady, onNebulaLanguageServerReady } from '../../lsp/client/state';
const selector: vscode.DocumentSelector = { language: 'nebula' };
const legend = new vscode.SemanticTokensLegend(['keyword','type','function','variable','parameter','number','string','comment'],['declaration','defaultLibrary']);
const semanticModifiers=['declaration','defaultLibrary'];
function modifierBits(modifiers:string[]|undefined):number{return (modifiers||[]).reduce((bits,name)=>{const index=semanticModifiers.indexOf(name);return index<0?bits:bits|(1<<index);},0);}
function wordRange(d:vscode.TextDocument,s:number,e:number):vscode.Range{return new vscode.Range(d.positionAt(s),d.positionAt(e));}
function symbolAt(d:vscode.TextDocument,o:number){const word=findWord(d.getText(),o);if(!word)return null;const symbols=collectSymbols(d.getText());return {word,symbols,declaration:symbols.find(s=>s.normalized===word.normalized)};}
class Hover implements vscode.HoverProvider{provideHover(d:vscode.TextDocument,p:vscode.Position):vscode.Hover|undefined{const f=symbolAt(d,d.offsetAt(p));if(!f)return;const {word,declaration}=f,md=new vscode.MarkdownString();if(declaration){md.appendCodeblock(declaration.kind==='function'?'funcao '+declaration.name+'('+(declaration.parameters||[]).map(x=>x.name+': '+x.type).join(', ')+')':declaration.name,'nebula');md.appendMarkdown('**'+declaration.kind+'** · '+declaration.detail);if(declaration.owner)md.appendMarkdown('\n\nParâmetro de **'+declaration.owner+'**.');}else if(['exibir','receber','perguntar','ler_texto','aguardar','dormir','gerar','em_paralelo'].includes(word.text)){md.appendCodeblock(word.text+'(...)','nebula');md.appendMarkdown('Função interna da biblioteca padrão Nebula.');}else return;return new vscode.Hover(md,wordRange(d,word.start,word.end));}}
class Definition implements vscode.DefinitionProvider{provideDefinition(d:vscode.TextDocument,p:vscode.Position):vscode.Definition|undefined{const f=symbolAt(d,d.offsetAt(p));if(!f?.declaration)return;const s=f.declaration;return new vscode.Location(d.uri,wordRange(d,s.start,s.end));}}
class References implements vscode.ReferenceProvider{provideReferences(d:vscode.TextDocument,p:vscode.Position,c:vscode.ReferenceContext):vscode.Location[]{const w=findWord(d.getText(),d.offsetAt(p));if(!w)return [];const decl=collectSymbols(d.getText()).find(s=>s.normalized===w.normalized);return findReferences(d.getText(),w.text).filter(t=>c.includeDeclaration||!decl||t.start!==decl.start).map(t=>new vscode.Location(d.uri,wordRange(d,t.start,t.end)));}}
class Signature implements vscode.SignatureHelpProvider{provideSignatureHelp(d:vscode.TextDocument,p:vscode.Position):vscode.SignatureHelp|undefined{const call=findFunctionAtCall(d.getText(),d.offsetAt(p));if(!call)return;const sig=new vscode.SignatureInformation(call.name+'('+call.parameters.map(x=>x.name+': '+x.type).join(', ')+')');sig.parameters=call.parameters.map(x=>new vscode.ParameterInformation(x.name+': '+x.type));const help=new vscode.SignatureHelp();help.signatures=[sig];help.activeSignature=0;help.activeParameter=Math.min(call.activeParameter,Math.max(0,call.parameters.length-1));return help;}}
class Symbols implements vscode.DocumentSymbolProvider{provideDocumentSymbols(d:vscode.TextDocument):vscode.DocumentSymbol[]{return getDocumentSymbols(d.getText()).map(s=>{const r=wordRange(d,s.start,s.end),k=s.kind==='function'?vscode.SymbolKind.Function:['variable','parameter'].includes(s.kind)?vscode.SymbolKind.Variable:s.kind==='constant'?vscode.SymbolKind.Constant:s.kind==='struct'?vscode.SymbolKind.Struct:s.kind==='enum'?vscode.SymbolKind.Enum:vscode.SymbolKind.Class;return new vscode.DocumentSymbol(s.name,s.detail,k,r,r);});}}
class Semantic implements vscode.DocumentSemanticTokensProvider{
 provideDocumentSemanticTokens(d:vscode.TextDocument):vscode.SemanticTokens{
  const b=new vscode.SemanticTokensBuilder(legend);
  for(const t of getSemanticTokens(d.getText())){
   let type:string|undefined=t.semanticType;
   if(!type&&['keyword','type','number','string','comment'].includes(t.type))type=t.type;
   if(!type)continue;
   const p=d.positionAt(t.start),e=d.positionAt(t.end);
   if(p.line===e.line){b.push(p.line,p.character,Math.max(1,e.character-p.character),type,modifierBits(t.modifiers));continue;}
   if(t.type==='comment'||t.type==='string'){
    for(let line=p.line;line<=e.line;line++){
     const start=line===p.line?p.character:0;
     const end=line===e.line?e.character:d.lineAt(line).text.length;
     if(end>start)b.push(line,start,end-start,type,modifierBits(t.modifiers));
    }
   }
  }
  return b.build();
 }
}
class Formatting implements vscode.DocumentFormattingEditProvider{provideDocumentFormattingEdits(d:vscode.TextDocument,o:vscode.FormattingOptions):vscode.TextEdit[]{const text=d.getText(),formatted=formatDocument(text,o.tabSize,o.insertSpaces);return formatted===text?[]:[vscode.TextEdit.replace(new vscode.Range(d.positionAt(0),d.positionAt(text.length)),formatted)];}}
class Actions implements vscode.CodeActionProvider{provideCodeActions(d:vscode.TextDocument,_r:vscode.Range,c:vscode.CodeActionContext):vscode.CodeAction[]{const out:vscode.CodeAction[]=[];for(const diag of c.diagnostics){const code=typeof diag.code==='object'&&diag.code!==null?diag.code.value:diag.code;if(code==='unmatched-delimiter'){const a=new vscode.CodeAction('Remover delimitador sem abertura',vscode.CodeActionKind.QuickFix);a.diagnostics=[diag];a.edit=new vscode.WorkspaceEdit();a.edit.delete(d.uri,diag.range);out.push(a);}else if(code==='unclosed-delimiter'){const open=d.getText(diag.range),close:Record<string,string>={'(':')','[':']','{':'}'},end=new vscode.Position(d.lineCount-1,d.lineAt(d.lineCount-1).text.length);if(close[open]){const a=new vscode.CodeAction('Inserir "'+close[open]+'" no final',vscode.CodeActionKind.QuickFix);a.diagnostics=[diag];a.edit=new vscode.WorkspaceEdit();a.edit.insert(d.uri,end,close[open]);out.push(a);}}}return out;}}
class Rename implements vscode.RenameProvider{prepareRename(d:vscode.TextDocument,p:vscode.Position):vscode.ProviderResult<vscode.Range|{range:vscode.Range;placeholder:string}>{const w=findWord(d.getText(),d.offsetAt(p));if(!w)throw new Error('O cursor não está sobre um identificador Nebula.');return {range:wordRange(d,w.start,w.end),placeholder:w.text};}provideRenameEdits(d:vscode.TextDocument,p:vscode.Position,name:string):vscode.WorkspaceEdit|undefined{if(!new RegExp('^[\\p{XID_Start}_][\\p{XID_Continue}_]*$','u').test(name.normalize('NFC')))throw new Error('O novo nome não é um identificador válido da Nebula.');const w=findWord(d.getText(),d.offsetAt(p));if(!w)return;const edit=new vscode.WorkspaceEdit();for(const t of findReferences(d.getText(),w.text))edit.replace(d.uri,wordRange(d,t.start,t.end),name);return edit;}}
function refresh(d:vscode.TextDocument,c:vscode.DiagnosticCollection):void{if(d.languageId!=='nebula')return;c.set(d.uri,getDiagnostics(d.getText()).map(x=>{const diag=new vscode.Diagnostic(wordRange(d,x.start,x.end),x.message,x.severity==='error'?vscode.DiagnosticSeverity.Error:vscode.DiagnosticSeverity.Warning);diag.code=x.code;diag.source='Nebula';return diag;}));}
export function registerNebulaIntelligence(context:vscode.ExtensionContext):void{
 let registrations:vscode.Disposable[]=[];
 const disposeLocal=()=>{for(const item of registrations)item.dispose();registrations=[];};
 const sync=()=>{
  const ready=isNebulaLanguageServerReady();
  if(ready){disposeLocal();return;}
  if(registrations.length)return;
  registrations=[
   vscode.languages.registerHoverProvider(selector,new Hover()),
   vscode.languages.registerDefinitionProvider(selector,new Definition()),
   vscode.languages.registerReferenceProvider(selector,new References()),
   vscode.languages.registerSignatureHelpProvider(selector,new Signature(),'(',','),
   vscode.languages.registerDocumentSymbolProvider(selector,new Symbols()),
   vscode.languages.registerDocumentSemanticTokensProvider(selector,new Semantic(),legend),
   vscode.languages.registerDocumentFormattingEditProvider(selector,new Formatting()),
   vscode.languages.registerCodeActionsProvider(selector,new Actions(),{providedCodeActionKinds:[vscode.CodeActionKind.QuickFix]}),
   vscode.languages.registerRenameProvider(selector,new Rename())
  ];
  const diagnostics=vscode.languages.createDiagnosticCollection('nebula');registrations.push(diagnostics);
  for(const d of vscode.workspace.textDocuments)refresh(d,diagnostics);
  registrations.push(
   vscode.workspace.onDidOpenTextDocument(d=>refresh(d,diagnostics)),
   vscode.workspace.onDidChangeTextDocument(e=>refresh(e.document,diagnostics)),
   vscode.workspace.onDidSaveTextDocument(d=>refresh(d,diagnostics)),
   vscode.workspace.onDidCloseTextDocument(d=>diagnostics.delete(d.uri))
  );
 };
 sync();
 context.subscriptions.push(onNebulaLanguageServerReady(sync));
 context.subscriptions.push(new vscode.Disposable(disposeLocal));
}
