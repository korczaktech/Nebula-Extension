import * as fs from 'node:fs';
import * as path from 'node:path';

const PLATFORM_BINARIES: Record<string, string> = {
  'linux-x64': 'linux-x64/nebula',
  'linux-arm64': 'linux-arm64/nebula',
  'win32-x64': 'win32-x64/nebula.exe',
  'darwin-x64': 'darwin-x64/nebula',
  'darwin-arm64': 'darwin-arm64/nebula'
};

export function getNebulaCompilerPath(
  extensionPath: string,
  platform = process.platform,
  architecture = process.arch
): string {
  const target = PLATFORM_BINARIES[`${platform}-${architecture}`];
  if (!target) {
    throw new Error(`A extensão Nebula ainda não inclui compilador para ${platform}/${architecture}.`);
  }

  const executable = path.join(extensionPath, 'bin', target);
  if (!fs.existsSync(executable)) {
    throw new Error(
      `O compilador nativo da Nebula não foi incluído nesta instalação (${platform}/${architecture}). ` +
      'Reinstale a extensão oficial ou obtenha um pacote correspondente à sua plataforma.'
    );
  }

  return executable;
}
