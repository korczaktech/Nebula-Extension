import * as vscode from 'vscode';
let ready=false;
const emitter=new vscode.EventEmitter<boolean>();
export const onNebulaLanguageServerReady=emitter.event;
export function isNebulaLanguageServerReady():boolean{return ready;}
export function setNebulaLanguageServerReady(value:boolean):void{if(ready===value)return;ready=value;emitter.fire(value);}
