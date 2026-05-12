import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { highlightText } from '../highlightText';

describe('highlightText', () => {
  it('returns sanitised text when query is empty', () => {
    const result = highlightText('Carpathian Watch', '');
    expect(result.__html).toBe('Carpathian Watch');
  });

  it('wraps matches in safe <mark> tags', () => {
    const result = highlightText('Monitoring biodiversity', 'bio');
    expect(result.__html).toContain('<mark');
    expect(result.__html).toContain('bio');
    expect(result.__html).not.toContain('<script');
  });

  it('escapes regex special chars', () => {
    const result = highlightText('Test (1) [2]', '(1)');
    expect(result.__html).toContain('<mark');
  });

  it('sanitises unmatched HTML content', () => {
    const result = highlightText('<img src=x onerror=alert(1)>Carpathian', 'Carpathian');
    expect(result.__html).not.toContain('onerror');
    expect(result.__html).toContain('<mark');
  });
});
