import * as vscode from 'vscode';

export interface NebulaLanguageServerConfiguration {
  enabled: boolean;
  serverPath: string;
  args: string[];
  trace: 'off' | 'messages' | 'verbose';
}

export function getNebulaLanguageServerConfiguration(): NebulaLanguageServerConfiguration {
  const configuration = vscode.workspace.getConfiguration('nebula.languageServer');
  return {
    enabled: configuration.get<boolean>('enabled', true),
    serverPath: configuration.get<string>('serverPath', '').trim(),
    args: configuration.get<string[]>('args', []),
    trace: configuration.get<'off' | 'messages' | 'verbose'>('trace', 'off')
  };
}
