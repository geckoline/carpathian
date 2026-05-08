import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('CSS safety checks', () => {
  it('app CSS contains no IE-specific filter properties', () => {
    const cssPath = resolve(__dirname, '../../src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).not.toMatch(/progid:DXImageTransform/i);
    expect(css).not.toMatch(/filter:\s*alpha/i);
    expect(css).not.toMatch(/behavior:/i);
  });

  it('app CSS contains -webkit-text-size-adjust for proper mobile rendering', () => {
    const cssPath = resolve(__dirname, '../../src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/-webkit-text-size-adjust\s*:\s*100%/);
  });

  it('app CSS respects reduced-motion preference', () => {
    const cssPath = resolve(__dirname, '../../src/index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/prefers-reduced-motion/i);
  });
});
