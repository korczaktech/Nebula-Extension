'use strict';
const KEYWORDS=new Set(['variavel','definir','mutavel','mutável','alterar','constante','funcao','função','quando','senao','senão','avaliar','escolha','caso','para','cada','em','enquanto','durante','repetir','pulso','devolver','incluir','como','fim','parar','encerrar','seguir','e','ou','nao','não','publico','público','privado','tipo','estrutura','enumeracao','enumeração','verdadeiro','falso','nulo']);
const TYPES=new Set(['vazio','logico','lógico','inteiro','inteiro8','inteiro16','inteiro32','inteiro64','inteiro128','inteiro_u8','inteiro_u16','inteiro_u32','inteiro_u64','inteiro_u128','decimal','decimal32','decimal64','texto','caractere','byte','vetor','matriz','Tupla','Opcional','Resultado']);
const BUILTINS=new Set(['exibir','receber','perguntar','ler_texto','aguardar','dormir','gerar','em_paralelo']);
const ID='[\\p{XID_Start}_][\\p{XID_Continue}_]*';
function scan(source){
 const tokens=[];let i=0;
 while(i<source.length){const start=i,c=source[i],n=source[i+1];
  if(/\s/u.test(c)){i++;continue;}
  if(c==='/'&&n==='/'){i+=2;while(i<source.length&&source[i]!=='\n')i++;tokens.push({type:'comment',start,end:i,text:source.slice(start,i)});continue;}
  if(c==='/'&&n==='*'){i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;if(i<source.length)i+=2;tokens.push({type:'comment',start,end:i,text:source.slice(start,i)});continue;}
  if(c==='"'||c==="'"){const q=c;i++;while(i<source.length){if(source[i]==='\\'){i+=2;continue;}if(source[i++]===q)break;}tokens.push({type:'string',start,end:Math.min(i,source.length),text:source.slice(start,i)});continue;}
  const id=source.slice(i).match(new RegExp('^'+ID,'u'));
  if(id){i+=id[0].length;const text=id[0],normalized=text.normalize('NFC');tokens.push({type:KEYWORDS.has(normalized)?'keyword':TYPES.has(normalized)?'type':'identifier',start,end:i,text,normalized});continue;}
  const num=source.slice(i).match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|[0-9](?:_?[0-9])*(?:\.[0-9](?:_?[0-9])*)?(?:[eE][+-]?[0-9]+)?)/u);
  if(num){i+=num[0].length;tokens.push({type:'number',start,end:i,text:num[0]});continue;}
  tokens.push({type:'punctuation',start,end:i+1,text:c});i++;
 }
 return tokens;
}
function matchingClose(source,at,open,close){let depth=0;for(let i=at;i<source.length;i++){if(source[i]===open)depth++;else if(source[i]===close&&--depth===0)return i;}return -1;}
function splitTopLevel(text){const out=[];let start=0,a=0,p=0,b=0,c=0;for(let i=0;i<text.length;i++){const x=text[i];if(x==='<')a++;else if(x==='>'&&a)a--;else if(x==='(')p++;else if(x===')'&&p)p--;else if(x==='[')b++;else if(x===']'&&b)b--;else if(x==='{')c++;else if(x==='}'&&c)c--;else if(x===','&&!a&&!p&&!b&&!c){out.push(text.slice(start,i));start=i+1;}}out.push(text.slice(start));return out;}
function collectSymbols(source){
 const ts=scan(source).filter(t=>t.type!=='comment'&&t.type!=='string'),symbols=[];
 const add=(name,kind,start,end,detail,extra={})=>{if(name)symbols.push({name,normalized:name.normalize('NFC'),kind,start,end,detail,...extra});};
 for(let i=0;i<ts.length-1;i++){const t=ts[i],n=ts[i+1];
  if(t.type==='keyword'&&['variavel','definir','mutavel','mutável','constante'].includes(t.text)&&n.type==='identifier'){const type=ts[i+2]?.text===':'?ts[i+3]?.text:undefined;add(n.text,t.text==='constante'?'constant':'variable',n.start,n.end,type?'Variável · '+type:'Variável');}
  if(t.type==='keyword'&&['funcao','função'].includes(t.text)&&n.type==='identifier'){
   let pi=i+2;if(ts[pi]?.text==='<'){while(pi<ts.length&&ts[pi].text!=='(')pi++;}
   const params=[];let signature='Função';
   if(ts[pi]?.text==='('){const close=matchingClose(source,ts[pi].start,'(',')');if(close>=0){for(const raw of splitTopLevel(source.slice(ts[pi].end,close))){const m=raw.trim().match(new RegExp('^('+ID+')\\\\s*:\\\\s*(.+)$','u'));if(m)params.push({name:m[1],type:m[2].trim()});}signature='('+params.map(p=>p.name+': '+p.type).join(', ')+')';}}
   add(n.text,'function',n.start,n.end,signature,{parameters:params});
   for(const p of params){const at=source.indexOf(p.name,n.end);if(at>=0)add(p.name,'parameter',at,at+p.name.length,'Parâmetro · '+p.type,{owner:n.text});}
  }
  if(t.type==='keyword'&&['tipo','estrutura','enumeracao','enumeração'].includes(t.text)&&n.type==='identifier'){const kind=t.text==='tipo'?'type':t.text==='estrutura'?'struct':'enum';add(n.text,kind,n.start,n.end,kind==='type'?'Alias de tipo':kind==='struct'?'Estrutura':'Enumeração');}
 }
 const seen=new Set();return symbols.filter(s=>{const k=s.kind+':'+s.normalized+':'+s.start;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>a.start-b.start);
}
function findWord(source,offset){return scan(source).find(t=>t.type==='identifier'&&t.start<=offset&&offset<=t.end)||null;}
function findReferences(source,name){const key=name.normalize('NFC');return scan(source).filter(t=>t.type==='identifier'&&t.normalized===key);}
function findFunctionAtCall(source,offset){
 const ts=scan(source).filter(t=>t.type!=='comment'&&t.type!=='string');let depth=0,open=-1,activeParameter=0;
 for(let i=ts.length-1;i>=0;i--){const t=ts[i];if(t.start>=offset)continue;if(t.text===')')depth++;else if(t.text==='('){if(depth===0){open=i;break;}depth--;}else if(t.text===','&&depth===0)activeParameter++;}
 if(open<1)return null;const name=ts[open-1];if(name.type!=='identifier')return null;
 const fn=collectSymbols(source).find(s=>s.kind==='function'&&s.normalized===name.normalized);return fn?{name:fn.name,parameters:fn.parameters||[],activeParameter}:null;
}
function getDiagnostics(source){
 const ts=scan(source),out=[],stack=[],pairs={')':'(',']':'[','}':'{'};
 for(const t of ts){if(t.type==='comment'||t.type==='string')continue;if(['(','[','{'].includes(t.text))stack.push(t);else if(pairs[t.text]){const top=stack.pop();if(!top||top.text!==pairs[t.text])out.push({start:t.start,end:t.end,severity:'error',code:'unmatched-delimiter',message:'Delimitador de fechamento sem abertura correspondente.'});}}
 for(const t of stack)out.push({start:t.start,end:t.end,severity:'error',code:'unclosed-delimiter',message:'Delimitador não foi fechado.'});
 const seen=new Set();for(const s of collectSymbols(source)){if(!['variable','constant','function','type','struct','enum'].includes(s.kind))continue;const key=s.kind+':'+s.normalized;if(seen.has(key))out.push({start:s.start,end:s.end,severity:'error',code:'duplicate-declaration',message:'Declaração duplicada de "'+s.name+'".'});else seen.add(key);}
 return out.sort((a,b)=>a.start-b.start);
}
function getDocumentSymbols(source){return collectSymbols(source);}
function getSemanticTokens(source){const symbols=collectSymbols(source);return scan(source).map(t=>{if(t.type!=='identifier')return t;const s=symbols.find(x=>x.start===t.start);if(s)return {...t,semanticType:s.kind==='function'?'function':s.kind==='parameter'?'parameter':['type','struct','enum'].includes(s.kind)?'type':'variable',modifiers:['declaration']};if(BUILTINS.has(t.text))return {...t,semanticType:'function',modifiers:['defaultLibrary']};return t;});}
function formatDocument(source,tabSize=4,insertSpaces=true){
 const unit=insertSpaces?' '.repeat(Math.max(1,tabSize)):'\t';let depth=0,block=false;
 return source.replace(/\r\n/g,'\n').split('\n').map(line=>{const s=line.trim();if(!s)return '';if(s.startsWith('*/'))block=false;
  const close=/^[}\])]/u.test(s)||/^(?:fim|senao|senão)\b/u.test(s)?1:0;const current=Math.max(0,depth-close);const result=unit.repeat(current)+s;
  if(s.includes('/*')&&!s.includes('*/'))block=true;
  if(!block){const opens=(s.match(/[{\[(]/gu)||[]).length,closes=(s.match(/[}\])]/gu)||[]).length;depth=Math.max(0,current+opens-closes);if(/^(?:funcao|função|quando|enquanto|durante|repetir|cada|para|pulso|caso)\b/u.test(s)&&!/[{]\s*$/u.test(s)&&!/[;]\s*$/u.test(s))depth++;if(/^fim\b/u.test(s))depth=Math.max(0,depth-1);}
  return result;}).join('\n');
}
module.exports={scan,collectSymbols,findWord,findReferences,findFunctionAtCall,getDiagnostics,getDocumentSymbols,getSemanticTokens,formatDocument};
