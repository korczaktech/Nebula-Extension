import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

const NEBULA_REPOSITORY = 'https://github.com/korczaktech/Nebula';

export function getNebulaLanguageServerPath(context: vscode.ExtensionContext, configuredPath = ''): string {
  const override = configuredPath.trim();
  if (override) return override;
  const executable = process.platform === 'win32' ? 'nebula-lsp.exe' : 'nebula-lsp';
  return path.join(context.globalStorageUri.fsPath, 'bin', executable);
}

export function hasNebulaLanguageServer(context: vscode.ExtensionContext, configuredPath = ''): boolean {
  return fs.existsSync(getNebulaLanguageServerPath(context, configuredPath));
}

export async function installNebulaLanguageServer(
  context: vscode.ExtensionContext,
  output: vscode.OutputChannel
): Promise<string> {
  const root = context.globalStorageUri.fsPath;
  fs.mkdirSync(root, { recursive: true });
  const args = [
    'install',
    '--git', NEBULA_REPOSITORY,
    '--locked',
    '--root', root,
    '--force',
    'nebula-lsp'
  ];

  output.appendLine('[Instalador] cargo ' + args.join(' '));
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Instalando o servidor LSP da Nebula…', cancellable: false },
    () => new Promise<void>((resolve, reject) => {
      const process = spawn('cargo', args, { env: process.env, windowsHide: true });
      process.stdout.on('data', chunk => output.append(chunk.toString()));
      process.stderr.on('data', chunk => output.append(chunk.toString()));
      process.once('error', error => reject(new Error(
        error.message.includes('ENOENT')
          ? 'Rust/Cargo não foi encontrado. Instale o Rust pelo site oficial e tente novamente.'
          : 'Não foi possível executar o instalador: ' + error.message
      )));
      process.once('close', code => {
        if (code === 0) resolve();
        else reject(new Error('cargo install terminou com código ' + String(code) + '. Consulte o canal de saída Nebula Language Server.'));
      });
    })
  );

  const executable = getNebulaLanguageServerPath(context);
  if (!fs.existsSync(executable)) {
    throw new Error('A instalação terminou, mas o executável não foi encontrado em ' + executable);
  }
  output.appendLine('[Instalador] Servidor instalado em ' + executable);
  return executable;
}
