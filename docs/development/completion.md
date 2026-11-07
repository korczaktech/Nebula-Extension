# Autocomplete e snippets Nebula

## Referências normativas

O catálogo do editor acompanha `NEBULA-SINTAXE.md` e `NEBULA-SINTAXE-2.md`. A especificação principal define palavras reservadas, literais, tipos, declarações, funções, classes, controle de fluxo, tratamento de erros, importação, entrada/saída e biblioteca padrão. A especificação complementar acrescenta tipos de largura fixa e APIs propostas para memória, ponteiros, bits, CPU, SIMD, hardware, portas de I/O, interrupções, DMA, operações atômicas, cache, tempo e energia.

A documentação distingue palavras reservadas da linguagem de APIs propostas. Uma sugestão de API não garante que o compilador, runtime, backend ou alvo já a implemente.

## Sugestões

- Palavras reservadas atuais: declarações, modificadores, controle de fluxo, erros, assincronismo, escopo, operações e Function Body.
- Literais: `sim`, `nao` e `nulo`.
- Tipos: tipos básicos, coleções e tipos nativos de largura fixa, endereços, ponteiros e vetores.
- Biblioteca padrão: matemática, conversão, coleções, texto, arquivos e sistema.
- APIs de sistemas: módulos e membros da especificação complementar.
- Símbolos locais: variáveis, constantes, funções e parâmetros identificados no arquivo atual.
- Membros: operações de módulos após `.` e campos/variantes reconhecidos localmente.

## Documentação de cada sugestão

O painel de detalhes de cada comando inclui finalidade, forma sintática e exemplo `.nbx`. Funções recebem chamada-modelo com cursor posicionado nos argumentos. APIs de baixo nível são identificadas como catalogadas/propostas, sem prometer suporte de execução.

## Snippets

Os modelos estão em `snippets/nebula.json` e usam placeholders do VS Code para navegação por Tab. Blocos gerados usam a abertura `: {`, `fim` interno, chave de fechamento e `fim` externo conforme o Function Body. Há snippets para funções, condicionais, seleção, laços, classes, importações, erros, tipos e operações nativas.

## Language Server

O provedor local permanece registrado mesmo quando o Language Server Rust está conectado. Isso garante o catálogo novo no editor enquanto a implementação de completion do servidor evolui. O VS Code pode mesclar resultados semelhantes do LSP e do provedor local.

## Limites

A análise de símbolos locais continua heurística e restrita ao arquivo atual. Não há resolução semântica completa de escopos, inferência geral de tipos, busca de símbolos em dependências ou confirmação de disponibilidade de APIs por arquitetura. Para esses recursos, a fonte de verdade deve ser o compilador e o servidor de linguagem.

## Verificação

`npm test`, `npm run check-types`, `npm run compile` e os testes de integração do VS Code validam o catálogo, os snippets e o empacotamento.
