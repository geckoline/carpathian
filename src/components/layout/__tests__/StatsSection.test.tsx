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

  it('uses compact two-column mobile layout classes', () => {
    render(
      <StatsSection
        projects={[
          { id: '1', status: 'active', country: 'Romania' } as any,
        ]}
        experts={[{ id: 'e1' } as any]}
      />
    );

    expect(screen.getByTestId('stats-grid')).toHaveClass('grid-cols-2', 'lg:grid-cols-4');
    expect(screen.getByTestId('stat-card-projects')).toHaveClass('p-4', 'sm:p-6');
    expect(screen.getByTestId('stat-projects')).toHaveClass('text-2xl', 'sm:text-4xl');
    expect(screen.getByText('Total Projects')).toHaveClass('text-xs', 'sm:text-lg');
  });
});
