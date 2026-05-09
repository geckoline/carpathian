import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '../ProjectCard';
import { useCardFlip } from '@/hooks/useCardFlip';
import { useAppStore } from '@/store/appStore';

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel: (s: any) => any) => sel({ 
    setSelectedExpertId: vi.fn(),
  }))
}));
vi.mock('@/hooks/useCardFlip', () => ({
  useCardFlip: vi.fn(() => ({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() }))
}));

const mockProject = {
  id: 'p1', name: 'Carpathian Watch', status: 'active' as const, field: 'Biodiversity',
  description: 'Monitoring deforestation across northern ranges. Full text expands on toggle.',
  location: '3 Countries', yearRange: '2021-25', leadExpertId: '123e4567-e89b-12d3-a456-426614174001', leadExpertName: 'Dr. E. Popescu',
  website: 'https://example.com'
};

describe('ProjectCard', () => {
  it('renders front layout with header, metrics, and footer', () => {
    render(<ProjectCard {...mockProject} />);
    expect(screen.getByText('Carpathian Watch')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByTestId('flip-to-back')).toHaveAttribute('aria-label', 'View project details');
  });

  it('sets selectedExpertId when lead is clicked', async () => {
    const setSelectedExpertId = vi.fn();
    vi.mocked(useAppStore).mockImplementation((sel) => sel({ setSelectedExpertId } as any));
    const user = userEvent.setup();
    render(<ProjectCard {...mockProject} />);
    
    await user.click(screen.getByTestId('lead-expert-link'));
    expect(setSelectedExpertId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
  });

  it('toggles description clamp on click', async () => {
    const user = userEvent.setup();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} />);
    const toggleBtn = screen.getByTestId('toggle-description');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggleBtn);
    await waitFor(() => expect(toggleBtn).toHaveAttribute('aria-expanded', 'true'), { timeout: 200 });
    expect(toggleBtn).toHaveTextContent('Show less');
  });

  it('copies link and stops propagation', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const user = userEvent.setup();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} />);
    await user.click(screen.getByTestId('copy-project-link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/project/p1'));
  });

  it('renders full project details on back side when flipped', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} />);
    expect(screen.getByText('Monitoring deforestation across northern ranges. Full text expands on toggle.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
    expect(screen.getByText('3 Countries')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});
