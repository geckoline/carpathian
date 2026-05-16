import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard } from '../SkeletonCard';

describe('SkeletonCard', () => {
  it('renders project skeleton by default', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders expert skeleton when type is expert', () => {
    const { container } = render(<SkeletonCard type="expert" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelector('.grid-cols-2')).toBeInTheDocument();
  });

  it('applies aria-hidden="true" for accessibility', () => {
    const { container } = render(<SkeletonCard type="project" />);
    const skeleton = container.querySelector('[role="presentation"]');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('has correct Tailwind classes for loading state', () => {
    const { container } = render(<SkeletonCard />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('bg-[var(--color-panel-surface)]');
    expect(el).toHaveClass('border');
  });
});
