import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsSection from '../StatsSection';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({ useAppStore: vi.fn() }));
vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ target }: { target: number }) => <span>{target}</span>,
}));

describe('StatsSection', () => {
  it('renders dynamic stats from store', () => {
    vi.mocked(useAppStore).mockReturnValue({
      data: {
        projects: [{ id: '1', status: 'active' } as any, { id: '2', status: 'past' } as any],
        experts: [{ id: 'e1' } as any],
        loading: false,
        error: null,
      }
    } as any);
    render(<StatsSection />);
    expect(screen.getByTestId('stat-projects')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-active')).toHaveTextContent('1');
    expect(screen.getByTestId('stat-experts')).toHaveTextContent('1');
  });
});
