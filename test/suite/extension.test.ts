import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Nebula — integração com o VS Code', () => {
  const extensionId = 'KorczakTechnologiesBR.nbx-language';

  suiteSetup(async () => {
    // O host de testes não deve abrir prompts nem compilar o servidor durante a suíte.
    await vscode.workspace.getConfiguration('nebula.languageServer')
      .update('enabled', false, vscode.ConfigurationTarget.Global);
  });

  test('a extensão é localizada e ativada', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, 'Extensão Nebula não encontrada no host de testes.');
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('arquivos .nbx são reconhecidos como Nebula', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension);
    const fixture = vscode.Uri.file(path.join(extension.extensionPath, 'test', 'fixtures', 'basic.nbx'));
    const document = await vscode.workspace.openTextDocument(fixture);
    assert.strictEqual(document.languageId, 'nebula');
  });

  test('comandos públicos do cliente LSP são registrados', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension);
    await extension.activate();
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('nebula.installLanguageServer'));
    assert.ok(commands.includes('nebula.restartLanguageServer'));
    assert.ok(commands.includes('nebula.languageServerStatus'));
  });

  test('servidor pode ser desativado para ambientes controlados', () => {
    const configuration = vscode.workspace.getConfiguration('nebula');
    assert.strictEqual(configuration.get('languageServer.enabled'), false);
    assert.strictEqual(configuration.get('languageServer.serverPath'), '');
  });

  test('manifesto publica gramática, snippets e configuração', () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension);
    const contributes = extension.packageJSON.contributes;
    assert.ok(contributes.grammars.some((grammar: { language: string }) => grammar.language === 'nebula'));
    assert.ok(contributes.snippets.some((snippet: { language: string }) => snippet.language === 'nebula'));
    assert.ok(contributes.languages.some((language: { id: string; extensions: string[] }) =>
      language.id === 'nebula' && language.extensions.includes('.nbx')
    ));
  });
});
