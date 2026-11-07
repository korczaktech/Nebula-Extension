import * as vscode from 'vscode';
import { getCompletionCandidates } from './engine';

type CommandHelp = { description: string; syntax: string; example: string };
const commandHelp: Record<string, CommandHelp> = {
  variavel:{description:'Declara uma variável mutável.',syntax:'variavel nome: tipo = valor',example:'variavel idade: inteiro = 20'},
  constante:{description:'Declara um valor que não pode ser reatribuído.',syntax:'constante NOME: tipo = valor',example:'constante TAMANHO_PAGINA: tamanho = 4096'},
  funcao:{description:'Declara uma função com corpo Function Body obrigatório.',syntax:'funcao nome(parametros) -> tipo: { ... fim } fim',example:'funcao somar(a: inteiro, b: inteiro) -> inteiro: {\n    retorne a + b\n    fim\n} fim'},
  async:{description:'Marca uma função como assíncrona.',syntax:'async funcao nome(): { ... fim } fim',example:'async funcao buscarDados(): {\n    variavel resultado = aguarda consultar()\n    retorne resultado\n    fim\n} fim'},
  se:{description:'Executa o bloco quando a condição é verdadeira.',syntax:'se condicao: { ... fim } fim',example:'se idade >= 18: {\n    exibir("Maior de idade")\n    fim\n} fim'},
  sendo:{description:'Adiciona uma condição alternativa à cadeia iniciada por se.',syntax:'sendo condicao: { ... fim }',example:'sendo nota >= 7: {\n    exibir("Aprovado")\n    fim\n}'},
  senao:{description:'Executa quando nenhuma condição anterior é satisfeita.',syntax:'senao: { ... fim }',example:'senao: {\n    exibir("Reprovado")\n    fim\n}'},
  escolha:{description:'Seleciona um bloco conforme o valor analisado.',syntax:'escolha valor: { caso ...; padrao: ...; fim } fim',example:'escolha opcao: {\n    caso 1: {\n        exibir("Iniciar")\n        fim\n    }\n    padrao: {\n        exibir("Invalido")\n        fim\n    }\n    fim\n} fim'},
  caso:{description:'Define uma alternativa dentro de escolha.',syntax:'caso valor: { ... fim }',example:'caso 1: {\n    exibir("Iniciar")\n    fim\n}'},
  padrao:{description:'Define a alternativa padrão de escolha.',syntax:'padrao: { ... fim }',example:'padrao: {\n    exibir("Opcao invalida")\n    fim\n}'},
  para:{description:'Percorre os elementos de uma sequência.',syntax:'para item dentro sequencia: { ... fim } fim',example:'para numero dentro faixa(0, 10): {\n    exibir(numero)\n    fim\n} fim'},
  enquanto:{description:'Repete o bloco enquanto a condição for verdadeira.',syntax:'enquanto condicao: { ... fim } fim',example:'enquanto contador < 10: {\n    contador =+ 1\n    fim\n} fim'},
  pare:{description:'Interrompe imediatamente o laço atual.',syntax:'pare',example:'se numero == 10: {\n    pare\n    fim\n}'},
  prossiga:{description:'Encerra a iteração atual e inicia a próxima.',syntax:'prossiga',example:'se numero == 5: {\n    prossiga\n    fim\n}'},
  passar:{description:'Instrução vazia explícita, sem efeito.',syntax:'passar',example:'funcao futura(): {\n    passar\n    fim\n} fim'},
  retorne:{description:'Encerra a função e devolve o valor indicado.',syntax:'retorne expressao',example:'retorne a + b'},
  lambda:{description:'Cria uma função anônima em uma expressão.',syntax:'lambda parametro: expressao',example:'variavel dobrar = lambda x: x * 2'},
  classe:{description:'Declara uma classe com corpo estrutural.',syntax:'classe Nome: { ... fim } fim',example:'classe Pessoa: {\n    funcao apresentar(): {\n        exibir(isto.nome)\n        fim\n    } fim\n    fim\n} fim'},
  incluir:{description:'Importa uma biblioteca e, opcionalmente, um módulo.',syntax:'incluir(modulo: nome, biblioteca: nome)',example:'incluir(modulo: arquivos, biblioteca: sistema)'},
  como:{description:'Define um apelido para a biblioteca importada.',syntax:'incluir(biblioteca: nome) como apelido',example:'incluir(biblioteca: matematica) como mat'},
  ceder:{description:'Produz valores incrementalmente em uma função geradora.',syntax:'ceder expressao',example:'ceder numero'},
  tente:{description:'Inicia um bloco de tratamento de erros.',syntax:'tente: { ... fim } erro Tipo: { ... fim } sempre: { ... fim } fim',example:'tente: {\n    variavel numero = inteiro("abc")\n    fim\n}\nerro ValorInvalido: {\n    exibir("Valor incorreto")\n    fim\n}\nsempre: {\n    exibir("Finalizado")\n    fim\n}\nfim'},
  erro:{description:'Define o bloco que captura um erro.',syntax:'erro TipoErro: { ... fim }',example:'erro ValorInvalido: {\n    exibir("Valor incorreto")\n    fim\n}'},
  sempre:{description:'Define a etapa de finalização do tratamento.',syntax:'sempre: { ... fim }',example:'sempre: {\n    exibir("Finalizado")\n    fim\n}'},
  lancar:{description:'Lança um erro para o fluxo de tratamento.',syntax:'lancar erro expressao',example:'lancar erro "Operacao invalida"'},
  verifique:{description:'Verifica uma condição e pode emitir uma mensagem.',syntax:'verifique condicao, mensagem',example:'verifique idade >= 18, "Idade insuficiente"'},
  com:{description:'Inicia um contexto de uso controlado.',syntax:'com recurso como nome ... fim',example:'com abrir("dados.txt", "leitura") como arquivo\n    exibir(ler(arquivo))\nfim'},
  aguarda:{description:'Aguarda a conclusão de uma operação assíncrona.',syntax:'aguarda chamadaAssincrona()',example:'variavel resultado = aguarda buscarDados()'},
  global:{description:'Declara acesso a uma variável global.',syntax:'global identificador',example:'global contador'},
  externa:{description:'Declara acesso a uma variável de função externa.',syntax:'externa identificador',example:'externa contador'},
  isto:{description:'Referencia a instância atual dentro de uma classe.',syntax:'isto.membro',example:'isto.nome = nome'},
  novo:{description:'Cria uma instância de classe.',syntax:'novo Nome(argumentos)',example:'variavel pessoa = novo Pessoa("Ana", 20)'},
  apagar:{description:'Solicita a remoção de um valor conforme o tipo e as regras de memória.',syntax:'apagar expressao',example:'apagar recurso'},
  dentro:{description:'Operador de pertencimento.',syntax:'valor dentro sequencia',example:'para item dentro faixa(0, 10): { ... fim } fim'},
  fora:{description:'Operador de não pertencimento.',syntax:'valor fora sequencia',example:'se nome fora nomesPermitidos: { ... fim } fim'},
  identico:{description:'Compara identidade conforme a semântica dos tipos.',syntax:'valor identico outro',example:'se referencia identico outraReferencia: { ... fim } fim'},
  nao:{description:'Negação lógica; também representa o literal falso conforme o contexto.',syntax:'nao condicao',example:'se nao autorizado: { ... fim } fim'},
  e:{description:'Combina condições com E lógico.',syntax:'condicao e outraCondicao',example:'se idade >= 18 e autorizado == sim: { ... fim } fim'},
  ou:{description:'Combina condições com OU lógico.',syntax:'condicao ou outraCondicao',example:'se admin == sim ou proprietario == sim: { ... fim } fim'},
  sim:{description:'Literal lógico verdadeiro.',syntax:'sim',example:'variavel ativo: logico = sim'},
  nulo:{description:'Literal que representa ausência de valor.',syntax:'nulo',example:'variavel usuario: Pessoa = nulo'},
  herda:{description:'Declara a classe-base de uma classe derivada.',syntax:'classe Nome herda Base: { ... fim } fim',example:'classe Cachorro herda Animal: {\n    passar\n    fim\n} fim'},
  estatico:{description:'Modificador de membro associado à classe.',syntax:'estatico funcao nome(): { ... fim } fim',example:'estatico funcao quantidade(): {\n    retorne 0\n    fim\n} fim'},
  privado:{description:'Modificador de visibilidade restrita à classe.',syntax:'privado variavel nome: tipo = valor',example:'privado variavel segredo: texto = "..."'},
  publico:{description:'Modificador de visibilidade pública.',syntax:'publico funcao nome(): { ... fim } fim',example:'publico funcao iniciar(): {\n    passar\n    fim\n} fim'},
  protegido:{description:'Modificador de visibilidade para classe e subclasses.',syntax:'protegido variavel nome: tipo = valor',example:'protegido variavel estado: inteiro = 0'},
  exportar:{description:'Expõe uma declaração para uso externo.',syntax:'exportar funcao nome(): { ... fim } fim',example:'exportar funcao somar(a, b): {\n    retorne a + b\n    fim\n} fim'},
  construtor:{description:'Declara o construtor de uma classe.',syntax:'funcao construtor(parametros): { ... fim } fim',example:'funcao construtor(nome: texto): {\n    isto.nome = nome\n    fim\n} fim'},
  tipoDe:{description:'Consulta ou testa o tipo de um valor.',syntax:'tipoDe(expressao)',example:'variavel nomeTipo = tipoDe(valor)'},
  instanciaDe:{description:'Verifica se um valor pertence a uma classe.',syntax:'valor instanciaDe Nome',example:'se pessoa instanciaDe Pessoa: { ... fim } fim'},
  obter:{description:'Nome reservado associado a operações de obtenção; não declara getter isolado.',syntax:'obter expressao',example:'variavel valor = dados.obter("chave")'},
  definir:{description:'Alias de declaração/definição de variável; não é setter de propriedade.',syntax:'definir nome = valor',example:'definir limite = 10'},
  vazio:{description:'Tipo de retorno que indica ausência de valor.',syntax:'funcao nome() -> vazio: { ... fim } fim',example:'funcao iniciar() -> vazio: {\n    exibir("Inicio")\n    fim\n} fim'},
  seguro:{description:'Marca um contexto seguro conforme as regras do compilador.',syntax:'seguro: { ... fim }',example:'seguro: {\n    passar\n    fim\n} fim'},
  critico:{description:'Abre uma região crítica com regras especiais de acesso.',syntax:'critico: { ... fim }',example:'critico: {\n    passar\n    fim\n} fim'},
  privilegio:{description:'Declara um bloco que exige perfil e permissões privilegiadas.',syntax:'privilegio sistema: { ... fim } fim',example:'privilegio sistema: {\n    cpu.interrupcoes.desabilitar()\n    cpu.parar()\n    fim\n} fim'},
  montagem:{description:'Declara expressão ou bloco Assembly dependente da arquitetura.',syntax:'montagem arquitetura<T>(argumentos)',example:'variavel resultado = montagem x86_64<u64>(entradas: [10, 20], saidas: [registrador.rax], efeitos: [registradores, flags], instrucoes: ["add rax, rbx"])'},
  estrutura:{description:'Declara tipo estruturado na camada nativa; suporte depende do compilador.',syntax:'estrutura Nome: { campos ... fim } fim',example:'estrutura Cabecalho: {\n    codigo: u32\n    tamanho: u16\n    fim\n} fim'},
  enumeracao:{description:'Declara enumeração; suporte depende do compilador.',syntax:'enumeracao Nome: { variantes ... fim } fim',example:'enumeracao Estado: {\n    Ativo\n    Inativo\n    fim\n} fim'},
  objetos:{description:'Inicia declaração de bloco estrutural de objetos.',syntax:'objetos Nome: { ... fim } fim',example:'objetos Pessoa: {\n    nome: texto\n    fim\n} fim'},
  dicionarios:{description:'Inicia declaração de bloco estrutural de dicionários.',syntax:'dicionarios Nome: { ... fim } fim',example:'dicionarios Configuracao: {\n    idioma: texto\n    fim\n} fim'},
  fim:{description:'Encerra o conteúdo de um corpo Function Body; não substitui a chave de fechamento.',syntax:'fim',example:'funcao exemplo(): {\n    passar\n    fim\n} fim'},
  de:{description:'Palavra reservada usada em construções de origem definidas pela gramática.',syntax:'de caminho',example:'incluir(modulo: arquivos, biblioteca: sistema)'}
};

const builtinDescriptions: Record<string, string> = {
  exibir:'Exibe um valor.',lerTexto:'Lê texto informado pelo usuário.',abrir:'Abre arquivo em modo especificado.',fechar:'Fecha arquivo.',ler:'Lê conteúdo.',lerLinha:'Lê uma linha.',lerLinhas:'Lê várias linhas.',escrever:'Escreve conteúdo.',escreverLinhas:'Escreve várias linhas.',
  abs:'Calcula valor absoluto.',arredondar:'Arredonda número.',divres:'Retorna quociente e resto.',raiz:'Calcula raiz quadrada.',potencia:'Calcula potência.',piso:'Arredonda para baixo.',teto:'Arredonda para cima.',truncar:'Remove parte decimal.',minimo:'Obtém menor valor.',maximo:'Obtém maior valor.',somar:'Soma valores.',
  inteiro:'Converte para inteiro.',decimal:'Converte para decimal.',complexo:'Cria/converte número complexo.',texto:'Converte para texto.',logico:'Converte para lógico.',lista:'Cria lista.',tupla:'Cria tupla.',conjunto:'Cria conjunto sem duplicatas.',conImutavel:'Cria conjunto imutável.',dicionario:'Cria dicionário.',octetos:'Cria sequência imutável de bytes.',vetorOctetos:'Cria sequência mutável de bytes.',tipoDe:'Identifica o tipo.',
  faixa:'Gera sequência numérica.',tamanho:'Obtém quantidade ou tamanho.',ordenar:'Ordena coleção.',inverter:'Inverte coleção.',enumerar:'Produz pares de índice e elemento.',agrupar:'Combina sequências.',filtrar:'Seleciona elementos por condição.',mapear:'Transforma elementos.',reduzir:'Acumula elementos.',
  visualizarMemoria:'Inspeciona memória quando suportado.',enderecoDe:'Consulta endereço de valor elegível.',tamanhoDe:'Consulta tamanho em bytes.',alinhamentoDe:'Consulta alinhamento de tipo.',identidade:'Obtém identidade de objeto.',
  dividir:'Divide texto.',juntar:'Junta elementos.',substituir:'Substitui ocorrências.',maiusculo:'Converte para maiúsculas.',minusculo:'Converte para minúsculas.',localizar:'Localiza ocorrência.',contar:'Conta ocorrências ou elementos.',diretorioAtual:'Obtém diretório atual.',listarArquivos:'Lista arquivos.',criarDiretorio:'Cria diretório.',removerArquivo:'Remove arquivo.',existe:'Verifica existência.',executar:'Executa operação permitida.'
};

function documentation(candidate: {label:string;kind:string;documentation?:string}): vscode.MarkdownString {
  const help = commandHelp[candidate.label];
  const md = new vscode.MarkdownString();
  if (help) {
    md.appendMarkdown('**' + candidate.label + '**\n\n' + help.description + '\n\n');
    md.appendMarkdown('**Sintaxe**\n\n');
    md.appendCodeblock(help.syntax, 'nebula');
    md.appendMarkdown('**Exemplo**\n\n');
    md.appendCodeblock(help.example, 'nebula');
    if (['estrutura','enumeracao','montagem','seguro','critico','privilegio'].includes(candidate.label)) {
      md.appendMarkdown('_Construção descrita na especificação; o suporte efetivo depende do compilador e do alvo._');
    }
    return md;
  }
  if (candidate.kind === 'function') {
    md.appendMarkdown('**' + candidate.label + '()**\n\n' + (builtinDescriptions[candidate.label] || 'Função catalogada na biblioteca padrão Nebula.') + '\n\n');
    md.appendMarkdown('**Sintaxe**\n\n');
    md.appendCodeblock(candidate.label + '(argumentos)', 'nebula');
    const example = candidate.label === 'exibir' ? 'exibir("Ola, Nebula")' :
      candidate.label === 'lerTexto' ? 'variavel nome = lerTexto("Seu nome: ")' :
      candidate.label === 'raiz' ? 'variavel resultado = raiz(25)' :
      candidate.label === 'faixa' ? 'para numero dentro faixa(0, 10): {\n    exibir(numero)\n    fim\n} fim' :
      'variavel resultado = ' + candidate.label + '(...)';
    md.appendMarkdown('**Exemplo**\n\n');
    md.appendCodeblock(example, 'nebula');
    md.appendMarkdown('_A presença no catálogo não garante implementação semântica no compilador._');
    return md;
  }
  md.appendMarkdown(candidate.documentation || ('Palavra reservada ou símbolo da linguagem Nebula: **' + candidate.label + '**.'));
  md.appendMarkdown('\n\n**Exemplo**\n\n');
  md.appendCodeblock(candidate.label, 'nebula');
  return md;
}

const kinds: Record<string, vscode.CompletionItemKind> = {
  keyword:vscode.CompletionItemKind.Keyword,constant:vscode.CompletionItemKind.Constant,
  function:vscode.CompletionItemKind.Function,variable:vscode.CompletionItemKind.Variable,
  type:vscode.CompletionItemKind.Class,struct:vscode.CompletionItemKind.Struct,
  enum:vscode.CompletionItemKind.Enum,enumMember:vscode.CompletionItemKind.EnumMember,
  field:vscode.CompletionItemKind.Field,module:vscode.CompletionItemKind.Module
};

export class NebulaCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(document:vscode.TextDocument,position:vscode.Position,_token:vscode.CancellationToken,_context:vscode.CompletionContext):vscode.CompletionItem[] {
    const offset=document.offsetAt(position),source=document.getText(),result=getCompletionCandidates(source,offset);
    return result.candidates.map((candidate,index)=>{
      const item=new vscode.CompletionItem(candidate.label,kinds[candidate.kind]??vscode.CompletionItemKind.Text);
      item.detail=candidate.detail;
      item.documentation=documentation(candidate);
      item.filterText=candidate.label;
      item.sortText=String(index).padStart(4,'0')+candidate.label;
      item.range=new vscode.Range(document.positionAt(result.wordStart),position);
      item.insertText=candidate.insertText?new vscode.SnippetString(candidate.insertText):candidate.label;
      return item;
    });
  }
}

export function registerNebulaCompletions(context:vscode.ExtensionContext):void {
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
    {language:'nebula'},new NebulaCompletionProvider(),'.',':'
  ));
}
