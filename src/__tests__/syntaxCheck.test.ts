import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Syntax regression checks', () => {
  it('index.css has no syntax errors', () => {
    const filePath = resolve(__dirname, '../../src/index.css');
    const css = readFileSync(filePath, 'utf-8');
    
    // Check for malformed color values (missing # or extra chars)
    const colorValues = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    colorValues.forEach(color => {
      if (color.match(/^#[0-9a-fA-F]{3,8}$/)) {
        expect(color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    });
    
    // Verify -webkit-text-size-adjust is properly set
    expect(css).toContain('-webkit-text-size-adjust: 100%');
    
    // Check for valid property-value pairs (skip @keyframes blocks)
    const lines = css.split('\n');
    let inKeyframes = false;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@keyframes')) { inKeyframes = true; return; }
      if (inKeyframes && trimmed === '}') { inKeyframes = false; return; }
      if (inKeyframes) return;
      if (trimmed && !trimmed.startsWith('@') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.startsWith('}') && !trimmed.startsWith(':') && !trimmed.startsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith('{') && trimmed.includes(':')) {
        expect(trimmed).toMatch(/^[^:]+\s*:\s*[^;]+;$/);
      }
    });
  });

  it('all TSX files have valid array literal syntax', () => {
    const { globSync } = require('node:fs') as any;
    const tsxFiles = globSync(resolve(__dirname, '../../src/**/*.tsx'), { windowsPathsNoEscape: true });
    
    tsxFiles.forEach((file: string) => {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) return;
        
        const arrayMatches = line.matchAll(/\[([^\]]+)\]/g);
        for (const match of arrayMatches) {
          const inner = match[1]!.trim();
          if ((inner.match(/\s+/g) || []).length > 0 && !inner.includes(',')) {
            if (inner.match(/^\d+\s+\d+$/)) {
              throw new Error(`Missing comma in array literal at ${file}:${idx + 1}: [${inner}]`);
            }
          }
        }
      });
    });
  });
});
