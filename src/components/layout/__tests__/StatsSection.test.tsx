import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsSection } from '../StatsSection';

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ target }: any) => <span>{target}</span>,
  AnimatedCounter: ({ target }: any) => <span>{target}</span>,
}));

describe('StatsSection', () => {
  it('renders calculated stats from provided data', () => {
    render(
      <StatsSection
        projects={[
          { id: '1', status: 'active', country: 'Romania' } as any,
          { id: '2', status: 'past', country: 'Poland' } as any,
          { id: '3', status: 'active', country: 'Romania' } as any,
        ]}
        experts={[{ id: 'e1' } as any, { id: 'e2' } as any]}
      />
    );
    expect(screen.getByTestId('stat-projects')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-active')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-experts')).toHaveTextContent('2');
  });
});
