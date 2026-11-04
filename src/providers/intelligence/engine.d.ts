export interface NebulaToken { type:string; start:number; end:number; text:string; normalized?:string; semanticType?:string; modifiers?:string[]; }
export interface NebulaParameter { name:string; type:string; }
export interface NebulaSymbol { name:string; normalized:string; kind:string; start:number; end:number; detail:string; parameters?:NebulaParameter[]; owner?:string; }
export interface NebulaDiagnostic { start:number; end:number; severity:'error'|'warning'; code:string; message:string; }
export interface NebulaCall { name:string; parameters:NebulaParameter[]; activeParameter:number; }
export function scan(source:string):NebulaToken[];
export function collectSymbols(source:string):NebulaSymbol[];
export function findWord(source:string,offset:number):NebulaToken|null;
export function findReferences(source:string,name:string):NebulaToken[];
export function findFunctionAtCall(source:string,offset:number):NebulaCall|null;
export function getDiagnostics(source:string):NebulaDiagnostic[];
export function getDocumentSymbols(source:string):NebulaSymbol[];
export function getSemanticTokens(source:string):NebulaToken[];
export function formatDocument(source:string,tabSize?:number,insertSpaces?:boolean):string;
