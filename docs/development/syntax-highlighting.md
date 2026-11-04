# Realce de sintaxe Nebula

A gramática TextMate em `syntaxes/nebula.tmLanguage.json` implementa o inventário léxico atualmente mantido neste repositório. Ela é carregada pelo escopo `source.nebula` e aplicada a arquivos `.nbx`. A equivalência integral com o Lexer do compilador ainda depende de uma comparação com sua especificação canônica.

## Cobertura

- Comentários de linha e de bloco.
- Strings, caracteres, escapes válidos e escapes inválidos.
- Inteiros decimais, hexadecimais, binários e octais; decimais fracionários e expoentes.
- Literais lógicos e nulo.
- As palavras reservadas cadastradas nesta versão da extensão, incluindo grafias acentuadas e aliases.
- Palavras reservadas futuras destacadas como construções inválidas, sem tratá-las como recursos implementados.
- Declarações de variáveis, constantes, funções, aliases de tipo, estruturas e enumerações.
- Funções internas, chamadas de função, parâmetros, campos, tipos primitivos e tipos de coleção.
- Operadores de atribuição, comparação, aritmética, intervalo, acesso e lógica.
- Delimitadores e separadores.

## Limites intencionais

TextMate realiza realce lexical e contextual aproximado; não substitui Lexer, Parser ou análise semântica. A gramática não tenta determinar se um identificador existe, se um tipo é compatível ou se um padrão é semanticamente válido. Esses recursos dependem do servidor de linguagem.

A extensão não marca como palavra reservada nomes de tipos, funções internas ou identificadores comuns: a especificação os define como identificadores em seus contextos. `tentar`, `capturar`, `finalmente` e `assinc` são realçados como inválidos porque estão reservados para versões futuras.

## Testes

`npm test` valida a estrutura da gramática, compila suas expressões regulares, confere o inventário léxico normativo e verifica o fixture abrangente.
