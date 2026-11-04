import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  await runTests({
    extensionDevelopmentPath: path.resolve(__dirname, '../..'),
    extensionTestsPath: path.resolve(__dirname, 'suite')
  });
}

main().catch((error: unknown) => {
  console.error('Falha nos testes de integração do Nebula:', error);
  process.exitCode = 1;
});
