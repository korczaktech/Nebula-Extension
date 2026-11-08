## [0.0.11] - 2026-11-08\n\n- Auditadas as regras de sintaxe, Lexer/Parser, LSP incorporado, gramática TextMate, snippets, configuração do editor e inteligência local: `fim` não é palavra reservada nem terminador de bloco.\n- Fixada a compilação do LSP incorporado no commit atual do compilador Nebula e validados blocos aninhados sem `fim`, `fim` como identificador, rejeição da sintaxe antiga e fechamento ausente.\n- Adicionado teste de regressão para impedir que recursos do editor voltem a classificar `fim` como palavra-chave ou fechamento.\n- Atualizado o pacote para 0.0.11.\n\n## [0.0.10] - 2026-11-08

- Corrigida a gramática TextMate para reconhecer explicitamente a palavra reservada normativa `se`.
- Atualizados os testes de editor para validar Function Body com `: {` e fechamento por `}`, sem exigir o terminador antigo `fim`.
- Atualizados os testes de conformidade para refletir os tokens, tipos, comentários e delimitadores da gramática normativa.
- Mantida a distinção entre operadores relacionais `<` e `>` e os delimitadores de agrupamento.
- Atualizado o pacote para 0.0.10.

## [0.0.8] - 2026-11-06

- Atualizado o autocomplete para a sintaxe atual de `NEBULA-SINTAXE.md` e `NEBULA-SINTAXE-2.md`.
- Removidas sugestões de palavras e aliases antigos; adicionados comandos, literais, tipos e APIs nativas.
- Adicionada documentação contextual com finalidade, sintaxe e exemplo para cada palavra reservada e função sugerida.
- Mantido o autocomplete local ativo com o Language Server conectado.
- Refeitos os snippets com Function Body, `fim`, indentação e exemplos da sintaxe atual.
- Atualizados testes de conformidade e versão do pacote para 0.0.8.

# Changelog

## [0.0.7] - 2026-11-06

- Refeito o TextMate grammar para acompanhar `NEBULA-SINTAXE.md` e `NEBULA-SINTAXE-2.md`.
- Adicionados escopos distintos para fluxo de controle, declarações, funções, builtins, módulos, tipos, argumentos, membros, operadores, números, strings e comentários.
- Corrigidas as palavras reservadas antigas e reconhecidos os delimitadores e operadores atuais, incluindo Function Body e `fim`.
- Adicionados os temas Nebula Clássico e Nebula Claro; Nebula Vibrante atualizado. Total: três temas.
- Ampliados os testes de gramática e tokenização TextMate.


## [0.0.7] - 2026-11-06

- Atualizada a versão do pacote para 0.0.7.
- Corrigido o teste de release que ainda fixava a versão anterior 0.0.6.
- Mantida a validação do pacote VSIX e do adaptador de depuração DAP no pipeline de CI.


## [0.0.4] - 2026-11-04

- Adicionados comandos para compilar e interpretar arquivos `.nbx` pelo CLI oficial.
- Adicionada saída dedicada e interrupção de processos iniciados pela extensão.
- Documentada a limitação atual do debugger: ausência de informações de depuração no backend e de adaptador DAP.


## [0.0.1] - Em preparação
- Identificação da linguagem Nebula e associação de arquivos .nbx.
- Configuração inicial do editor e gramática TextMate.
- Snippets iniciais e estrutura de desenvolvimento.
- Preparação de testes e empacotamento VSIX.

