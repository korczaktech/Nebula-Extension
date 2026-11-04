# Snippets e autocomplete

## Snippets
Os modelos ficam em `snippets/nebula.json` e são registrados pelo VS Code via `contributes.snippets`. Os prefixos abrangem declarações, funções, condicionais, correspondência, laços, estruturas, enumerações, aliases, módulos, tipos de função e enumerações com payload, além de funções internas. Há modelos com chaves e com terminador `fim`. Os marcadores (`$1`, `${1:nome}`, `$0`) permitem navegar pelos campos usando Tab.

## Autocomplete
O provedor é registrado para documentos Nebula e sugere palavras reservadas, literais (`verdadeiro`, `falso`, `nulo`), tipos, funções internas, variáveis, constantes, parâmetros, funções, aliases, estruturas, enumerações e módulos importados no arquivo atual (com `::` e alias opcional). Após `.`, sugere campos de estruturas quando o tipo da variável está anotado; após `Tipo::`, sugere variantes de enumeração. Caminhos de importação usam `::`, conforme a gramática. Após `:`, prioriza tipos.

Comentários e strings são mascarados antes da coleta de símbolos. O coletor respeita identificadores Unicode/NFC, parâmetros com tipos genéricos e tipos de função aninhados, campos com tipos compostos e variantes de enumeração com payload. Chamadas de builtins usam inserção em formato snippet para posicionar o cursor no argumento. As sugestões são calculadas sob demanda, sem cache persistente ou acesso à rede.

## Limites
A análise é local e heurística. Não resolve símbolos importados de outros arquivos, não infere tipos de expressões, não descobre membros de módulos, não implementa escopos léxicos completos e não consulta o compilador Nebula. Integração LSP/Rust e inteligência semântica ficam fora desta etapa.

## Verificação
`npm test`, `npm run check-types` e `npm run compile` verificam os recursos. O comportamento interativo deve também ser conferido em uma janela de desenvolvimento do VS Code, especialmente a aceitação de sugestões, a navegação por Tab nos snippets e os gatilhos `.` e `::`.
