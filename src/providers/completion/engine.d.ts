export interface NebulaSymbol { label:string; kind:string; detail:string; documentation:string; insertText?:string; fields?:Array<{label:string;type:string}>; variants?:string[]; }
export interface CompletionResult { candidates:NebulaSymbol[]; wordStart:number; context:'member'|'type'|'general'; }
export const KEYWORDS:string[];
export const BUILTINS:string[];
export const CONSTANTS:string[];
export const TYPES:string[];
export function maskNonCode(source:string):string;
export function isCodePosition(source:string,offset:number):boolean;
export function collectSymbols(source:string):{symbols:NebulaSymbol[];variables:Map<string,string>;structures:Map<string,Array<{label:string;type:string}>>;enums:Map<string,string[]>};
export function getCompletionCandidates(source:string,cursorOffset:number):CompletionResult;
