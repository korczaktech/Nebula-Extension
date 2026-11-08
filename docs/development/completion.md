# Autocomplete e snippets Nebula

## Fonte de verdade

A extensão acompanha a gramática do repositório `korczaktech/Nebula`, especialmente:

- `especificacao/gramatica.md`: produções sintáticas e blocos.
- `especificacao/tokens.md`: tokens, comentários, identificadores e literais.
- `especificacao/linguagem-e-tipos.md`: semântica e tipos normativos.
- `NEBULA-SINTAXE-2.md`: catálogo complementar de recursos nativos; APIs catalogadas não são necessariamente implementadas.

Em caso de divergência, o compilador e os documentos normativos do repositório principal prevalecem. A extensão não deve criar uma gramática paralela.

## Function Body

Todo bloco executável ou estrutural começa com `: {` e termina na chave correspondente `}`. Blocos aninhados fecham suas próprias chaves.

```nbx
funcao somar(a: inteiro, b: inteiro) -> inteiro: {
    retorne a + b
}

se idade >= 18: {
    exibir("Maior de idade")
}
```

`fim` é um identificador comum, não um terminador de bloco. Ele não deve aparecer como palavra reservada, exemplo de fechamento ou snippet de bloco. A indentação organiza visualmente o corpo, mas não substitui as chaves.

## Recursos do editor

- Palavras-chave e aliases apresentados seguem o inventário aceito pelo Lexer/Parser.
- Literais sugeridos: `sim`, `verdadeiro`, `falso` e `nulo`.
- Tipos incluem primitivos da linguagem e tipos nativos documentados.
- Comentários: `//` e `/* ... */`.
- Pares de agrupamento: `()`, `[]` e `{}`. Os sinais `<` e `>` são tratados como operadores/contexto genérico, não como pares universais de agrupamento.
- Autocomplete local cobre palavras, funções catalogadas, tipos, símbolos locais e membros de módulos.
- A análise de símbolos é heurística e limitada ao arquivo atual; a resolução semântica completa pertence ao compilador/LSP.

## Snippets

Os modelos ficam em `snippets/nebula.json`. Todo snippet de bloco deve gerar Function Body com chaves balanceadas e sem terminador `fim`. Os placeholders do VS Code permitem navegação por Tab.

## Limites

A presença de uma função, tipo ou membro no autocomplete não prova que o recurso esteja implementado no compilador, runtime, backend ou alvo. APIs de baixo nível são identificadas como catálogo da especificação e dependem de suporte efetivo.

## Verificação

`npm test`, `npm run check-types`, `npm run compile`, os testes de integração do VS Code e a validação do VSIX devem ser executados antes de publicar uma versão.
