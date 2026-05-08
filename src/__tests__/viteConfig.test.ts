import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('vite config', () => {
  it('has HMR configured for localhost WebSocket', () => {
    const configPath = resolve(__dirname, '../../vite.config.ts');
    const config = readFileSync(configPath, 'utf-8');
    expect(config).toMatch(/protocol:\s*['"]ws['"]/);
    expect(config).toMatch(/host:\s*['"]localhost['"]/);
    expect(config).toMatch(/port:\s*5173/);
  });
});
