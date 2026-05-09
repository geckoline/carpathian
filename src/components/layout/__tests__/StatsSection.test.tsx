// src/components/layout/__tests__/StatsSection.test.tsx
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsSection } from '../StatsSection';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ target }: any) => <span>{target}</span>,
  AnimatedCounter: ({ target }: any) => <span>{target}</span>,
}));

describe('StatsSection', () => {
  it('renders calculated stats from store data', () => {
    vi.mocked(useAppStore).mockReturnValue({
      data: {
        projects: [
          { id: '1', status: 'active', country: 'Romania' },
          { id: '2', status: 'past', country: 'Poland' },
          { id: '3', status: 'active', country: 'Romania' },
        ],
        experts: [{ id: 'e1' }, { id: 'e2' }],
        loading: false,
        error: null,
      },
    } as any);

    render(<StatsSection />);
    expect(screen.getByTestId('stat-projects')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-active')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-experts')).toHaveTextContent('2');
  });
});