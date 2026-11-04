import * as vscode from 'vscode';
import {LanguageClient,LanguageClientOptions,ServerOptions,Trace} from 'vscode-languageclient/node';
import {getNebulaLanguageServerConfiguration} from './configuration';
import {createNebulaInitializationOptions} from '../protocol/capabilities';
let client:LanguageClient|undefined,output:vscode.OutputChannel|undefined,starting=false;
function log(message:string):void{output?.appendLine('[LSP] '+message);}
function serverOptions():ServerOptions{
 const c=getNebulaLanguageServerConfiguration();
 return {command:c.serverPath,args:c.args,options:{cwd:vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,env:process.env}};
}
function clientOptions(context:vscode.ExtensionContext):LanguageClientOptions{
 const watcher=vscode.workspace.createFileSystemWatcher('**/*.nbx');
 context.subscriptions.push(watcher);
 return {documentSelector:[{scheme:'file',language:'nebula'}],synchronize:{fileEvents:watcher},initializationOptions:createNebulaInitializationOptions(),outputChannel:output,traceOutputChannel:output};
}
export async function startNebulaLanguageClient(context:vscode.ExtensionContext):Promise<void>{
 if(client||starting)return;
 const c=getNebulaLanguageServerConfiguration();
 if(!c.enabled){log('Integração desativada. Configure nebula.languageServer.enabled para habilitar.');return;}
 if(!c.serverPath){log('Caminho do servidor não configurado.');return;}
 starting=true;
 try{
  output??=vscode.window.createOutputChannel('Nebula Language Server');
  const instance=new LanguageClient('nebulaLanguageServer','Nebula Language Server',serverOptions(),clientOptions(context));
  instance.setTrace(c.trace==='verbose'?Trace.Verbose:c.trace==='messages'?Trace.Messages:Trace.Off);
  client=instance;context.subscriptions.push(instance);await instance.start();log('Conectado ao servidor: '+c.serverPath);
 }catch(error){
  client=undefined;log('Falha ao iniciar: '+(error instanceof Error?error.message:String(error)));
  void vscode.window.showWarningMessage('Nebula: não foi possível iniciar o Language Server. Consulte o canal de saída.');
 }finally{starting=false;}
}
export async function stopNebulaLanguageClient():Promise<void>{
 const current=client;client=undefined;if(!current)return;
 try{await current.stop();log('Conexão encerrada.');}catch(error){log('Erro ao encerrar: '+(error instanceof Error?error.message:String(error)));}
}
export async function restartNebulaLanguageClient(context:vscode.ExtensionContext):Promise<void>{await stopNebulaLanguageClient();await startNebulaLanguageClient(context);}
export function registerNebulaLanguageClient(context:vscode.ExtensionContext):void{
 output=vscode.window.createOutputChannel('Nebula Language Server');context.subscriptions.push(output);
 context.subscriptions.push(vscode.commands.registerCommand('nebula.restartLanguageServer',()=>restartNebulaLanguageClient(context)));
 context.subscriptions.push(vscode.commands.registerCommand('nebula.languageServerStatus',()=>{const state=client?'conectado':getNebulaLanguageServerConfiguration().enabled?'desconectado':'desativado';void vscode.window.showInformationMessage('Nebula Language Server: '+state+'.');}));
 context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('nebula.languageServer'))void restartNebulaLanguageClient(context);}));
 context.subscriptions.push({dispose:()=>{void stopNebulaLanguageClient();}});
 void startNebulaLanguageClient(context);
}