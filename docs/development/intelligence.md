# Inteligência de código

A etapa de inteligência local registra provedores nativos do VS Code para documentos .nbx, sem iniciar servidor externo e sem executar o compilador.

## Recursos

- **Hover:** mostra o nome, a categoria e a assinatura conhecida de símbolos declarados no arquivo; também documenta as funções internas conhecidas.
- **Definição:** navega até a declaração encontrada no documento atual.
- **Referências:** lista ocorrências do identificador no documento, com opção de incluir a declaração.
- **Diagnósticos:** identifica delimitadores sem par, fechamentos excedentes e declarações duplicadas da mesma categoria no arquivo.
- **Signature Help:** apresenta parâmetros de funções declaradas localmente e acompanha o parâmetro ativo durante a chamada.
- **Document Symbols:** expõe funções, variáveis, constantes, aliases, estruturas e enumerações na visão de símbolos.
- **Semantic Tokens:** classifica palavras reservadas, tipos, números, strings, comentários, declarações, parâmetros e funções internas.
- **Formatter:** aplica recuo básico configurado pelo VS Code para blocos delimitados por chaves e blocos reconhecidos por palavra-chave.
- **Code Actions:** oferece correções locais para delimitadores excedentes ou não fechados.
- **Rename:** renomeia ocorrências do identificador no documento atual.

## Limites conhecidos

A análise é local e heurística. Não faz resolução de módulos entre arquivos, inferência de tipos, análise completa de escopos, validação semântica normativa ou diagnóstico de nomes não declarados. A busca de referências e renomeação é limitada ao documento ativo; não altera outros arquivos. A formatação não substitui um formatter baseado na AST. Diagnósticos semânticos completos dependem da integração com o compilador Rust/LSP, prevista para a etapa 6.

## Validação

npm test, npm run check-types, npm run compile e npm run check-output fazem parte da CI. O comportamento interativo dos provedores ainda deve ser conferido numa janela de desenvolvimento do VS Code.
