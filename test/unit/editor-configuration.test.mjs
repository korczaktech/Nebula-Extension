import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const configuration = JSON.parse(
  readFileSync(new URL('../../language-configuration.json', import.meta.url), 'utf8')
);

test('configura comentários de linha e bloco', () => {
  assert.equal(configuration.comments.lineComment, '//');
  assert.deepEqual(configuration.comments.blockComment, ['/*', '*/']);
});

test('delimitadores possuem pares completos e colorização correspondente', () => {
  const expected = [['{', '}'], ['[', ']'], ['(', ')']];
  assert.deepEqual(configuration.brackets, expected);
  assert.deepEqual(configuration.colorizedBracketPairs, expected);
  assert.deepEqual(configuration.surroundingPairs.slice(0, 3), expected);
});

test('pares automáticos incluem delimitadores, aspas e comentário de bloco', () => {
  const pairs = configuration.autoClosingPairs;
  for (const [open, close] of [['{', '}'], ['[', ']'], ['(', ')'], ['"', '"'], ["'", "'"], ['/*', '*/']]) {
    assert.ok(pairs.some(pair => pair.open === open && pair.close === close), 'Par ausente: ' + open + close);
  }
  for (const pair of pairs) assert.deepEqual(pair.notIn, ['string', 'comment']);
});

test('regras de indentação reconhecem Function Body e delimitadores abertos', () => {
  const rules = configuration.indentationRules;
  const increase = new RegExp(rules.increaseIndentPattern);
  const decrease = new RegExp(rules.decreaseIndentPattern);

  for (const line of [
    'funcao principal() -> vazio: {',
    'se ativo: {',
    'estrutura Pessoa: {',
    'cada item em itens: {',
    'escolha estado: {',
    'tente: {',
    'chamar( ',
    'valores = ['
  ]) assert.ok(increase.test(line), 'Não aumenta indentação: ' + line);

  for (const line of ['}', '    }', '    )', '    ]']) {
    assert.ok(decrease.test(line), 'Não reduz indentação: ' + line);
  }
  assert.equal(decrease.test('fim'), false, 'fim não pode fechar blocos');
});

test('regras ao pressionar Enter possuem padrões válidos e ações reconhecidas', () => {
  assert.ok(Array.isArray(configuration.onEnterRules));
  assert.ok(configuration.onEnterRules.length >= 5);
  const allowedIndentActions = new Set(['none', 'indent', 'outdent', 'indentOutdent']);

  for (const rule of configuration.onEnterRules) {
    assert.ok(typeof rule.beforeText === 'string');
    assert.doesNotThrow(() => new RegExp(rule.beforeText));
    if (rule.afterText) assert.doesNotThrow(() => new RegExp(rule.afterText));
    assert.ok(allowedIndentActions.has(rule.action.indent));
    if (rule.action.appendText !== undefined) assert.equal(typeof rule.action.appendText, 'string');
  }
});

test('Enter cria indentação após abertura de Function Body e continua comentários', () => {
  const rules = configuration.onEnterRules;
  const bodyRule = rules.find(rule => new RegExp(rule.beforeText).test('funcao principal() -> vazio: {'));
  assert.ok(bodyRule);
  assert.equal(bodyRule.action.indent, 'indentOutdent');

  const blockComment = rules.find(rule => rule.action.appendText === ' * ');
  assert.ok(blockComment);
  assert.equal(blockComment.action.appendText, ' * ');
  assert.equal(blockComment.action.indent, 'indent');
  assert.ok(rules.some(rule => rule.action.appendText === '// '));
});

test('configuração não declara pares ou comentários duplicados', () => {
  const keys = configuration.autoClosingPairs.map(pair => pair.open + '\0' + pair.close);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(configuration.comments.lineComment, '//');
  assert.ok(configuration.autoCloseBefore.includes('\n'));
  assert.ok(configuration.autoCloseBefore.includes('\t'));
});

test('VS Code recebe padrões de edição específicos para Nebula', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
  );
  const defaults = packageJson.contributes.configurationDefaults['[nebula]'];

  assert.equal(defaults['editor.insertSpaces'], true);
  assert.equal(defaults['editor.tabSize'], 4);
  assert.equal(defaults['editor.detectIndentation'], false);
  assert.equal(defaults['editor.autoIndent'], 'full');
  assert.equal(defaults['editor.bracketPairColorization.enabled'], true);
  assert.equal(defaults['editor.guides.bracketPairs'], true);
  assert.equal(defaults['editor.guides.indentation'], true);
  assert.equal(defaults['editor.matchBrackets'], 'always');
  assert.equal(defaults['editor.autoClosingBrackets'], 'languageDefined');
  assert.equal(defaults['editor.autoClosingQuotes'], 'languageDefined');
  assert.equal(defaults['editor.autoSurround'], 'languageDefined');
});
