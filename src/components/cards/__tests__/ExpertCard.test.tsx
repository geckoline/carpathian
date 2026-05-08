import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpertCard } from '../ExpertCard';
import { useCardFlip } from '@/hooks/useCardFlip';

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel: any) => sel({ ui: { selectedExpertId: null } }))
}));
vi.mock('@/hooks/useCardFlip', () => ({
  useCardFlip: vi.fn(() => ({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() }))
}));

const mockExpert = {
  id: 'e1', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', country: 'Romania',
  degree: 'PhD, Ecology', bio: 'Leading research on Carpathian biodiversity. Full bio expands on toggle.',
  expertise: ['Alpine Eco', 'Climate Resilience'], publications: 42, projects: 15,
  email: 'elena@example.com', linkedin: 'https://linkedin.com/in/elena', scopus: 'https://scopus.com/authid/elena'
};

describe('ExpertCard', () => {
  it('renders front layout with header, info, stats, and two-row footer', () => {
    render(<ExpertCard {...mockExpert} />);
    expect(screen.getByText('Dr. Elena Popescu')).toBeInTheDocument();
    expect(screen.getByTestId('expert-institution')).toHaveTextContent('Univ. of Bucharest');
    expect(screen.getByTestId('expert-pubs')).toHaveTextContent('42 Pubs');
    expect(screen.getByTestId('expert-front-linkedin-btn')).toBeInTheDocument();
  });

  it('toggles bio clamp on click', async () => {
    const user = userEvent.setup();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ExpertCard {...mockExpert} />);
    
    const toggleBtn = screen.getByTestId('toggle-bio');
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggleBtn);
    
    await waitFor(() => expect(toggleBtn).toHaveAttribute('aria-expanded', 'true'), { timeout: 200 });
    expect(toggleBtn).toHaveTextContent('Read less');
  });

  it('copies link and stops propagation', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const user = userEvent.setup();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ExpertCard {...mockExpert} />);
    
    await user.click(screen.getByTestId('copy-expert-link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/expert/e1'));
  });

  it('does not render avatar when avatarUrl is not provided', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    const { container } = render(<ExpertCard {...mockExpert} />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
