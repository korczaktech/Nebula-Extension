# Indentação e configuração do editor

O arquivo \`language-configuration.json\` define o comportamento nativo da linguagem Nebula no Visual Studio Code. Não depende de servidor de linguagem nem executa código do compilador.

## Comentários

- Linha: \`//\`.
- Bloco: \`/* ... */\`.
- Ao pressionar Enter em uma linha de comentário, o prefixo é continuado.

## Delimitadores

- Chaves: \`{ }\`.
- Colchetes: \`[ ]\`.
- Parênteses: \`( )\`.

Os três pares participam da correspondência, colorização e seleção por delimitação. O editor insere automaticamente o fechamento e permite envolver seleções com esses pares.

Aspas simples e duplas são fechadas automaticamente, exceto quando o cursor está dentro de uma string ou comentário.

## Indentação

A configuração reconhece abertura de blocos com chaves, colchetes e parênteses, e reduz o recuo ao iniciar uma linha com o delimitador de fechamento correspondente. Regras de Enter tratam blocos com chaves, linhas de fechamento e continuação de comentários.

As regras são heurísticas de editor baseadas no texto da linha. Elas não substituem o parser e não tentam interpretar estruturas semanticamente.

## Padrões do editor

Para arquivos Nebula, a extensão fornece estes padrões iniciais:

- Recuo com quatro espaços, sem tabulações e sem detecção automática de recuo existente.
- Indentação automática completa.
- Colorização de pares e guias de chaves, colchetes, parênteses e indentação.
- Realce de delimitadores correspondentes.
- Fechamento automático e envolvimento de seleções conforme os pares declarados pela linguagem.

Esses valores são padrões do VS Code para Nebula; configurações pessoais do usuário podem substituí-los.

## Validação

\`npm test\` verifica os pares, comentários, padrões de indentação e regras de Enter, incluindo a compilação das expressões regulares. O comportamento final de edição deve também ser conferido em uma janela de desenvolvimento do VS Code.
