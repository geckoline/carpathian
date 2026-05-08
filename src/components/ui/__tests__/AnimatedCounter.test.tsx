import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedCounter } from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  it('starts at 0', () => {
    render(<AnimatedCounter target={100} duration={50} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('reaches target after duration', async () => {
    render(<AnimatedCounter target={42} duration={50} />);
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument(), { timeout: 200 });
  });

  it('formats large numbers with commas', async () => {
    render(<AnimatedCounter target={10000} duration={50} />);
    await waitFor(() => expect(screen.getByText('10,000')).toBeInTheDocument(), { timeout: 200 });
  });
});
