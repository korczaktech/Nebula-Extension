'use strict';
const KEYWORDS=['variavel','definir','mutavel','mutável','alterar','constante','funcao','função','quando','senao','senão','avaliar','escolha','caso','para','cada','em','enquanto','durante','repetir','pulso','devolver','incluir','como','fim','parar','encerrar','seguir','e','ou','nao','não','publico','público','privado','tipo','estrutura','enumeracao','enumeração','verdadeiro','falso','nulo'];
const BUILTINS=['exibir','receber','perguntar','ler_texto','aguardar','dormir','gerar','em_paralelo'];
const CONSTANTS=['verdadeiro','falso','nulo'];
const TYPES=['vazio','logico','lógico','inteiro','inteiro8','inteiro16','inteiro32','inteiro64','inteiro128','inteiro_u8','inteiro_u16','inteiro_u32','inteiro_u64','inteiro_u128','decimal','decimal32','decimal64','texto','caractere','byte','vetor','matriz','Tupla','Opcional','Resultado','funcao'];

function maskNonCode(source){
 const chars=source.split('');let state='code',quote='';
 for(let i=0;i<chars.length;i++){const c=chars[i],n=chars[i+1];
  if(state==='line'){if(c==='\n')state='code';else chars[i]=' ';continue;}
  if(state==='block'){if(c==='*'&&n==='/'){chars[i]=chars[i+1]=' ';i++;state='code';}else if(c!=='\n')chars[i]=' ';continue;}
  if(state==='string'){if(c==='\\'){chars[i]=' ';if(n!==undefined&&n!=='\n'){chars[i+1]=' ';i++;}}else if(c===quote){chars[i]=' ';state='code';}else if(c!=='\n')chars[i]=' ';continue;}
  if(c==='/'&&n==='/'){chars[i]=chars[i+1]=' ';i++;state='line';}
  else if(c==='/'&&n==='*'){chars[i]=chars[i+1]=' ';i++;state='block';}
  else if(c==='"'||c==="'"){quote=c;chars[i]=' ';state='string';}
 }
 return chars.join('');
}
function isCodePosition(source,offset){
 const end=Math.max(0,Math.min(offset,source.length));let state='code',quote='';
 for(let i=0;i<end;i++){const c=source[i],n=source[i+1];
  if(state==='line'){if(c==='\n')state='code';continue;}
  if(state==='block'){if(c==='*'&&n==='/'){i++;state='code';}continue;}
  if(state==='string'){if(c==='\\')i++;else if(c===quote)state='code';continue;}
  if(c==='/'&&n==='/'){i++;state='line';}
  else if(c==='/'&&n==='*'){i++;state='block';}
  else if(c==='"'||c==="'"){quote=c;state='string';}
 }
 return state==='code';
}
function splitTopLevelBy(source,separators){
 const parts=[],set=new Set(separators);let start=0,angle=0,paren=0,bracket=0;
 for(let i=0;i<source.length;i++){const c=source[i];
  if(c==='<')angle++;else if(c==='>'&&angle>0)angle--;
  else if(c==='(')paren++;else if(c===')'&&paren>0)paren--;
  else if(c==='[')bracket++;else if(c===']'&&bracket>0)bracket--;
  else if(set.has(c)&&angle===0&&paren===0&&bracket===0){parts.push(source.slice(start,i));start=i+1;}
 }
 parts.push(source.slice(start));return parts;
}
function splitTopLevel(source,separator){return splitTopLevelBy(source,[separator]);}
function collectSymbols(source){
 const code=maskNonCode(source),symbols=[],variables=new Map(),structures=new Map(),enums=new Map();
 const add=(label,kind,detail,documentation,extra={})=>{if(label&&!symbols.some(x=>x.label===label&&x.kind===kind))symbols.push({label,kind,detail,documentation,...extra});};
 const varRe=/(?<![\p{L}\p{N}_])(?:variavel|definir|mutavel|mutável|constante)\s+([\p{L}_][\p{L}\p{N}_]*)(?:\s*:\s*([\p{L}_][\p{L}\p{N}_]*))?/gu;
 for(const m of code.matchAll(varRe)){variables.set(m[1],m[2]||'');add(m[1],'variable',m[2]?'Variável · '+m[2]:'Variável','Símbolo declarado neste arquivo.');}
 const fnRe=/(?<![\p{L}\p{N}_])(?:publico|público|privado)?\s*(?:funcao|função)\s+([\p{L}_][\p{L}\p{N}_]*)(?:\s*<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([\p{L}_][\p{L}\p{N}_]*))?/gu;
 for(const m of code.matchAll(fnRe)){
  const params=splitTopLevel(m[2],',').map(part=>part.trim().match(/^([\p{L}_][\p{L}\p{N}_]*)\s*:\s*(.+)$/u)).filter(Boolean);
  add(m[1],'function','('+params.map(p=>p[1]+': '+p[2].trim()).join(', ')+')'+(m[3]?': '+m[3]:''),'Função declarada neste arquivo.');
  for(const p of params)add(p[1],'variable','Parâmetro · '+p[2].trim(),'Parâmetro da função '+m[1]+'.');
 }
 for(const m of code.matchAll(/(?<![\p{L}\p{N}_])tipo\s+([\p{L}_][\p{L}\p{N}_]*)/gu))add(m[1],'type','Alias de tipo','Tipo definido neste arquivo.');
 const structs=/(?<![\p{L}\p{N}_])estrutura\s+([\p{L}_][\p{L}\p{N}_]*)\s*\{/gu;
 for(const m of code.matchAll(structs)){
  const open=m.index+m[0].lastIndexOf('{');let depth=1,end=open+1;
  for(;end<code.length&&depth>0;end++){if(code[end]==='{')depth++;else if(code[end]==='}')depth--;}
  const body=code.slice(open+1,Math.max(open+1,end-1));
  const fields=splitTopLevelBy(body,[',',';','\n']).map(part=>part.trim().match(/^([\p{L}_][\p{L}\p{N}_]*)\s*:\s*(.+)$/u)).filter(Boolean).map(x=>({label:x[1],type:x[2].trim()}));
  structures.set(m[1],fields);add(m[1],'struct','Estrutura','Estrutura declarada neste arquivo.',{fields});
 }
 const enumsRe=/(?<![\p{L}\p{N}_])(?:enumeracao|enumeração)\s+([\p{L}_][\p{L}\p{N}_]*)\s*\{/gu;
 for(const m of code.matchAll(enumsRe)){
  const open=m.index+m[0].lastIndexOf('{'),close=code.indexOf('}',open+1),body=code.slice(open+1,close<0?code.length:close);
  const variants=body.split(/[,\n;]/).map(part=>part.trim().match(/^([\p{L}_][\p{L}\p{N}_]*)/u)).filter(Boolean).map(x=>x[1]);
  enums.set(m[1],variants);add(m[1],'enum','Enumeração','Enumeração declarada neste arquivo.',{variants});
 }
 for(const m of code.matchAll(/(?<![\p{L}\p{N}_])incluir\s+([\p{L}_][\p{L}\p{N}_]*(?:::\s*[\p{L}_][\p{L}\p{N}_]*)*)(?:\s+como\s+([\p{L}_][\p{L}\p{N}_]*))?/gu)){
  const path=m[1].replace(/\s/g,''),alias=m[2]||path.split('::').at(-1);add(alias,'module','Módulo · '+path,'Módulo incluído neste arquivo.');
 }
 return {symbols,variables,structures,enums};
}
function getCompletionCandidates(source,cursorOffset){
 const safeOffset=Math.max(0,Math.min(cursorOffset,source.length)),before=source.slice(0,safeOffset);
 if(!isCodePosition(source,safeOffset))return {candidates:[],wordStart:safeOffset,context:'general'};
 const masked=maskNonCode(before),lineStart=masked.lastIndexOf('\n')+1,line=masked.slice(lineStart);
 const current=line.match(/[\p{L}_][\p{L}\p{N}_]*$/u)?.[0]||'',wordStart=safeOffset-current.length;
 const symbols=collectSymbols(source),trimmed=line.trimEnd();
 const member=trimmed.match(/([\p{L}_][\p{L}\p{N}_]*)\s*(::|\.)\s*[\p{L}\p{N}_]*$/u);
 if(member){
  const receiver=member[1],operator=member[2],items=[];
  if(operator==='::'&&symbols.enums.has(receiver))for(const label of symbols.enums.get(receiver))items.push({label,kind:'enumMember',detail:'Variante de '+receiver,documentation:'Variante da enumeração '+receiver+'.'});
  if(operator==='.'&&symbols.variables.has(receiver)){const type=symbols.variables.get(receiver);for(const field of symbols.structures.get(type)||[])items.push({label:field.label,kind:'field',detail:'Campo · '+field.type,documentation:'Campo da estrutura '+type+'.'});}
  const prefix=current.normalize('NFC').toLocaleLowerCase();
  return {candidates:items.filter(x=>x.label.normalize('NFC').toLocaleLowerCase().startsWith(prefix)),wordStart,context:'member'};
 }
 const typeAnnotation=trimmed.match(/:\s*([^=;{}]*)$/u),expectsType=Boolean(typeAnnotation),items=[];
 const add=(label,kind,detail,documentation,extra={})=>items.push({label,kind,detail,documentation,...extra});
 if(expectsType){
  for(const t of TYPES)add(t,'type','Tipo Nebula','Tipo primitivo ou composto da linguagem.');
  for(const s of symbols.symbols.filter(x=>['type','struct','enum'].includes(x.kind)))add(s.label,'type',s.detail,s.documentation);
 }else{
  for(const c of CONSTANTS)add(c,'constant','Literal lógico ou nulo','Valor literal da linguagem Nebula.');
  for(const k of KEYWORDS)add(k,'keyword','Palavra reservada','Palavra reservada da linguagem Nebula.');
  for(const b of BUILTINS)add(b,'function','Função interna','Função integrada da biblioteca padrão Nebula.',{insertText:b+'($0)'});
  for(const t of TYPES)add(t,'type','Tipo Nebula','Tipo primitivo ou composto da linguagem.');
  for(const s of symbols.symbols)add(s.label,s.kind,s.detail,s.documentation);
 }
 const unique=new Map();for(const item of items){const key=item.label.normalize('NFC');if(!unique.has(key))unique.set(key,item);}
 const prefix=current.normalize('NFC').toLocaleLowerCase();
 return {candidates:[...unique.values()].filter(x=>x.label.normalize('NFC').toLocaleLowerCase().startsWith(prefix)),wordStart,context:expectsType?'type':'general'};
}
module.exports={KEYWORDS,BUILTINS,CONSTANTS,TYPES,maskNonCode,isCodePosition,splitTopLevel,splitTopLevelBy,collectSymbols,getCompletionCandidates};
