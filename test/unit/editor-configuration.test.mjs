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

test('pares automáticos incluem delimitadores e aspas sem atuar em strings/comentários', () => {
  const pairs = configuration.autoClosingPairs;
  for (const [open, close] of [['{', '}'], ['[', ']'], ['(', ')'], ['"', '"'], ["'", "'"]]) {
    assert.ok(pairs.some(pair => pair.open === open && pair.close === close), \`Par ausente: \${open}\${close}\`);
  }
  for (const pair of pairs.filter(pair => pair.open === '"' || pair.open === "'")) {
    assert.deepEqual(pair.notIn, ['string', 'comment']);
  }
});

test('regras de indentação são expressões válidas e reconhecem blocos', () => {
  const rules = configuration.indentationRules;
  const increase = new RegExp(rules.increaseIndentPattern);
  const decrease = new RegExp(rules.decreaseIndentPattern);

  for (const line of [
    'funcao principal(): vazio {',
    'quando ativo {',
    'estrutura Pessoa {',
    'cada item em itens {',
    'chamar( ',
    'valores = ['
  ]) assert.ok(increase.test(line), \`Não aumenta indentação: \${line}\`);

  for (const line of ['}', '    }', '    )', '    ]']) {
    assert.ok(decrease.test(line), \`Não reduz indentação: \${line}\`);
  }
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

test('configuração não declara pares ou comentários duplicados', () => {
  const keys = configuration.autoClosingPairs.map(pair => \`\${pair.open}\\0\${pair.close}\`);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(configuration.comments.lineComment, '//');
});
