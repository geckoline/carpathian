import { describe, it, expect, vi } from 'vitest';
import { makeSurfaceFlipHandler, extractFirstSentence } from '../cardInteraction';

describe('makeSurfaceFlipHandler', () => {
  it('calls toggle when clicking plain surface', () => {
    const toggle = vi.fn();
    const handler = makeSurfaceFlipHandler(toggle);
    const event = { target: document.createElement('div'), currentTarget: document.createElement('div') } as any;
    handler(event);
    expect(toggle).toHaveBeenCalled();
  });

  it('does not call toggle when clicking a button', () => {
    const toggle = vi.fn();
    const handler = makeSurfaceFlipHandler(toggle);
    const button = document.createElement('button');
    const event = { target: button, currentTarget: document.createElement('div') } as any;
    handler(event);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('does not call toggle on element with data-no-card-flip', () => {
    const toggle = vi.fn();
    const handler = makeSurfaceFlipHandler(toggle);
    const div = document.createElement('div');
    div.setAttribute('data-no-card-flip', 'true');
    const event = { target: div, currentTarget: document.createElement('div') } as any;
    handler(event);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('does not call toggle when clicking a child of a button', () => {
    const toggle = vi.fn();
    const handler = makeSurfaceFlipHandler(toggle);
    const button = document.createElement('button');
    const span = document.createElement('span');
    button.appendChild(span);
    const event = { target: span, currentTarget: document.createElement('div') } as any;
    handler(event);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('does not call toggle on anchor elements', () => {
    const toggle = vi.fn();
    const handler = makeSurfaceFlipHandler(toggle);
    const link = document.createElement('a');
    const event = { target: link, currentTarget: document.createElement('div') } as any;
    handler(event);
    expect(toggle).not.toHaveBeenCalled();
  });
});

describe('extractFirstSentence', () => {
  it('returns first sentence when under maxLength', () => {
    expect(extractFirstSentence('Hello world. More text here.', 50)).toBe('Hello world.');
  });

  it('truncates long text without punctuation', () => {
    const long = 'a'.repeat(200);
    const result = extractFirstSentence(long, 100);
    expect(result).toBe('a'.repeat(100) + '...');
  });

  it('handles empty string', () => {
    expect(extractFirstSentence('', 100)).toBe('');
  });

  it('handles exclamation and question marks', () => {
    expect(extractFirstSentence('Stop! Go away.', 100)).toBe('Stop!');
    expect(extractFirstSentence('What? No way.', 100)).toBe('What?');
  });

  it('returns full text when short and no punctuation', () => {
    expect(extractFirstSentence('short text', 100)).toBe('short text');
  });
});
