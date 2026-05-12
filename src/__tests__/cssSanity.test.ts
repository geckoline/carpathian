import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const readSource = (relativePath: string) => readFileSync(resolve(__dirname, relativePath), 'utf-8');

describe('CSS safety checks', () => {
  it('app CSS contains no IE-specific filter properties', () => {
    const css = readSource('../../src/index.css');
    expect(css).not.toMatch(/progid:DXImageTransform/i);
    expect(css).not.toMatch(/filter:\s*alpha/i);
    expect(css).not.toMatch(/behavior:\s*url\(/i);
  });

  it('app CSS contains -webkit-text-size-adjust for proper mobile rendering', () => {
    const css = readSource('../../src/index.css');
    expect(css).toMatch(/-webkit-text-size-adjust\s*:\s*100%/);
  });

  it('app CSS respects reduced-motion preference', () => {
    const css = readSource('../../src/index.css');
    expect(css).toMatch(/prefers-reduced-motion/i);
    expect(css).toMatch(/reduced-motion-forced/i);
    expect(css).toMatch(/high-contrast/i);
  });

  it('app map/sidebar layout has explicit mobile and desktop classes', () => {
    const app = readSource('../../src/App.tsx');

    expect(app).toMatch(/flex-col\s+lg:flex-row/);
    expect(app).toMatch(/w-full\s+lg:w-\[380px\]/);
  });

  it('defines and uses shared app surface tokens', () => {
    const css = readSource('../../src/index.css');
    const app = readSource('../../src/App.tsx');
    const sidebar = readSource('../../src/components/map/MapSidebar.tsx');

    expect(css).toContain('--color-app-bg');
    expect(css).toContain('--color-panel-border');
    expect(css).toContain('--radius-panel');
    expect(css).toContain('--shadow-panel');

    expect(app).toContain('rounded-[var(--radius-panel)]');
    expect(app).toContain('shadow-[var(--shadow-panel)]');
    expect(sidebar).toContain('rounded-[var(--radius-panel)]');
    expect(sidebar).toContain('shadow-[var(--shadow-panel)]');
  });

  it('mounts the accessibility hook in the app shell', () => {
    const app = readSource('../../src/App.tsx');
    expect(app).toContain('useApplyAccessibility()');
  });
});
