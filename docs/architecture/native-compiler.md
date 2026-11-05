# Compilador nativo incorporado

## Objetivo

A extensão oficial executa o compilador Nebula empacotado para a plataforma do host. O usuário não precisa instalar Rust/Cargo, clonar o repositório Nebula ou configurar `nebula.executablePath`.

## Origem e construção

O binário é construído a partir do repositório oficial `korczaktech/Nebula`, usando o pacote Rust `nebula-cli` e o binário `nebula`. O build é reproduzível por `Cargo.lock` e a revisão do repositório é fixada no workflow de CI.

O script `scripts/build-native.sh` prepara atualmente Linux x86-64 em `bin/linux-x64/nebula`. Outras plataformas serão adicionadas na fase de distribuição.

## Resolução em tempo de execução

`src/compiler/native.ts` seleciona o executável a partir de `process.platform` e `process.arch`, sempre dentro da pasta da própria extensão. Não há fallback para PATH nem configuração de executável externo.

## Escopo desta fase

O binário oficial mantém os comandos já implementados no CLI. A extensão integra os comandos compilar, interpretar e executar. O runtime e a depuração passo a passo continuam sendo fases posteriores.

## Licenciamento

A Korczak Technologies autorizou expressamente, nesta etapa de desenvolvimento, a inclusão e redistribuição do compilador oficial não modificado dentro da extensão oficial. O pacote inclui a licença do Nebula. As licenças de dependências de terceiros continuam aplicáveis e devem ser preservadas na distribuição final.
