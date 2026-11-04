import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));

test('package.json identifica Nebula e associa arquivos .nbx', async () => {
  const manifest = await readJson('package.json');
  assert.equal(manifest.name, 'nebula-language');
  assert.ok(manifest.contributes.languages.some((language) =>
    language.id === 'nebula' && language.extensions.includes('.nbx')
  ));
});

test('gramática TextMate declarada existe e contém os escopos principais', async () => {
  const manifest = await readJson('package.json');
  const grammarPath = manifest.contributes.grammars[0].path.replace(/^\.\//, '');
  const grammar = await readJson(grammarPath);
  assert.equal(grammar.scopeName, 'source.nebula');
  for (const section of ['keywords', 'strings', 'numbers', 'comments', 'operators']) {
    assert.ok(grammar.repository[section], `Seção ausente: ${section}`);
  }
});

test('configuração de linguagem e snippets são JSON válidos', async () => {
  const configuration = await readJson('language-configuration.json');
  const snippets = await readJson('snippets/nebula.json');
  assert.ok(configuration.comments.lineComment);
  assert.ok(configuration.brackets.length >= 3);
  assert.ok(Object.keys(snippets).length >= 5);
});

test('ícones associados à linguagem existem', async () => {
  const manifest = await readJson('package.json');
  const language = manifest.contributes.languages.find((entry) => entry.id === 'nebula');
  for (const theme of ['light', 'dark']) {
    const iconPath = language.icon[theme].replace(/^\.\//, '');
    await assert.doesNotReject(readFile(path.join(root, iconPath)));
  }
});
