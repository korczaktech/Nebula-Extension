import * as path from 'path';
import { downloadAndUnzipVSCode, runTests } from '@vscode/test-electron';

async function downloadVSCodeWithRetry(): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await downloadAndUnzipVSCode();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        const delay = attempt * 3000;
        console.warn(`Download do VS Code falhou (tentativa ${attempt}/3). Nova tentativa em ${delay} ms.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function main(): Promise<void> {
  const vscodeExecutablePath = await downloadVSCodeWithRetry();
  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath: path.resolve(__dirname, '../..'),
    extensionTestsPath: path.resolve(__dirname, 'suite')
  });
}

main().catch((error: unknown) => {
  console.error('Falha nos testes de integração do Nebula:', error);
  process.exitCode = 1;
});
