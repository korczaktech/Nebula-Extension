import * as fs from 'node:fs';
import * as path from 'node:path';

const BINARIES: Record<string, { compiler: string; lsp: string }> = {
  'linux-x64': { compiler: 'linux-x64/nebula', lsp: 'linux-x64/nebula-lsp' },
  'linux-arm64': { compiler: 'linux-arm64/nebula', lsp: 'linux-arm64/nebula-lsp' },
  'win32-x64': { compiler: 'win32-x64/nebula.exe', lsp: 'win32-x64/nebula-lsp.exe' },
  'darwin-x64': { compiler: 'darwin-x64/nebula', lsp: 'darwin-x64/nebula-lsp' },
  'darwin-arm64': { compiler: 'darwin-arm64/nebula', lsp: 'darwin-arm64/nebula-lsp' }
};

function resolveBinary(extensionPath: string, kind: 'compiler' | 'lsp', platform: string, architecture: string): string {
  const target = BINARIES[`${platform}-${architecture}`];
  if (!target) throw new Error(`A extensão Nebula ainda não inclui binários para ${platform}/${architecture}.`);
  const executable = path.join(extensionPath, 'bin', target[kind]);
  if (!fs.existsSync(executable)) {
    throw new Error(`O ${kind === 'compiler' ? 'compilador' : 'servidor LSP'} da Nebula não está incluído para ${platform}/${architecture}. Reinstale a extensão oficial ou obtenha um pacote compatível.`);
  }
  return executable;
}

export function getNebulaCompilerPath(extensionPath: string, platform = process.platform, architecture = process.arch): string {
  return resolveBinary(extensionPath, 'compiler', platform, architecture);
}

export function getNebulaLanguageServerBinaryPath(extensionPath: string, platform = process.platform, architecture = process.arch): string {
  return resolveBinary(extensionPath, 'lsp', platform, architecture);
}
