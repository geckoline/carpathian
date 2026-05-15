import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ExpertCard } from '../ExpertCard';
import { useCardFlip } from '@/hooks/useCardFlip';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);

vi.mock('@/store/appStore', () => createMockAppStore());
vi.mock('@/hooks/useCardFlip', () => ({
  useCardFlip: vi.fn(() => ({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() }))
}));

const mockExpert = {
  id: 'e1', name: 'Dr. Elena Popescu', institution: 'Univ. of Bucharest', country: 'Romania',
  degree: 'PhD, Ecology', headline: 'Cross-border biodiversity lead and mountain systems researcher', expertiseSubtitle: 'Ecology • Restoration • Citizen-science networks', bio: 'Leading research on Carpathian biodiversity. Full bio expands on toggle.',
  expertise: ['Alpine Eco', 'Climate Resilience'], publications: 42, projects: 15,
  email: 'elena@example.com', linkedin: 'https://linkedin.com/in/elena', scopus: 'https://scopus.com/authid/elena',
  googleScholar: 'https://scholar.google.com/citations?user=abc123',
  orcid: 'https://orcid.org/0000-0002-1825-0097',
};

describe('ExpertCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
  });

  it('renders the variation c front layout with stronger thematic header, identity, stats, and actions', () => {
    const { container } = render(<ExpertCard {...mockExpert} />);
    const front = screen.getByTestId('expert-face-front');
    expect(within(front).getByText('Dr. Elena Popescu')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-subtitle')).toHaveTextContent('Cross-border biodiversity lead and mountain systems researcher');
    expect(within(front).getByTestId('expert-institution')).toHaveTextContent('Univ. of Bucharest');
    expect(within(front).getByTestId('expert-country')).toHaveTextContent('Romania');
    expect(within(front).getByTestId('expert-degree')).toHaveTextContent('PhD, Ecology');
    expect(within(front).getByTestId('expert-pubs')).toHaveTextContent('Publications');
    expect(within(front).getByTestId('expert-pubs')).toHaveTextContent('42');
    expect(within(front).getByTestId('expert-projects')).toHaveTextContent('Projects');
    expect(within(front).getByTestId('expert-projects')).toHaveTextContent('15');
    expect(within(front).getByTestId('expert-social-row')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-front-linkedin-btn')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-front-scopus-btn')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-front-google-scholar-btn')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-front-orcid-btn')).toBeInTheDocument();
    expect(within(front).getByTestId('expert-front-contact-email-btn')).toBeInTheDocument();
    expect(within(front).getByRole('button', { name: /copy expert link/i })).toBeInTheDocument();
    expect(within(front).getByRole('button', { name: /view expert details/i })).toBeInTheDocument();
    expect(container.querySelector('[data-testid="expert-card-stage"]')).toHaveClass('card-flip-stage');
    expect(within(front).getByTestId('expert-front-header')).toHaveClass('header', 'profile-header');
    expect(within(front).getByTestId('expert-front-header')).toHaveClass('profile-header-safe');
    expect(within(front).getByTestId('expert-avatar')).toHaveClass('profile-avatar');
    expect(screen.getByTestId('expert-face-back')).toHaveClass('expert-card-backdrop');
    expect(container.querySelector('article')).toHaveClass('expert-card-shell', 'card-auto-height-shell');
    expect(within(front).getByTestId('expert-front-content')).toHaveClass('card-content-scroll');
  });

  it('links the institution when an institution website is available', () => {
    render(<ExpertCard {...mockExpert} institutionWebsite="https://unibuc.ro" />);
    const institution = within(screen.getByTestId('expert-face-front')).getByTestId('expert-institution');

    expect(within(institution).getByRole('link', { name: 'Univ. of Bucharest' })).toHaveAttribute('href', 'https://unibuc.ro');
  });

  it('copies canonical share link and shows copied preview', async () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<ExpertCard {...mockExpert} />);

    await user.click(within(screen.getByTestId('expert-face-front')).getByTestId('copy-expert-link'));

    const expectedUrl = `${window.location.origin}/?dataset=cs&tab=experts&card=expert&id=e1#expert-card-e1`;
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl));
    expect(screen.queryByTestId('copied-card-preview')).not.toBeInTheDocument();
    expect(screen.queryByText(/expert link copied/i)).not.toBeInTheDocument();
  });

  it('keeps copy failure silent when expert link copy cannot be confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: undefined,
    });
    render(<ExpertCard {...mockExpert} />);

    await user.click(within(screen.getByTestId('expert-face-front')).getByTestId('copy-expert-link'));

    expect(screen.queryByTestId('copied-card-preview')).not.toBeInTheDocument();
    expect(screen.queryByText(/expert share link ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/copy failed/i)).not.toBeInTheDocument();
  });

  it('shows local JPG path on initial render', () => {
    render(<ExpertCard {...mockExpert} />);
    const img = within(screen.getByTestId('expert-face-front')).getByRole('img', { name: /dr\. elena popescu portrait/i });
    expect(img).toHaveAttribute('src', expect.stringContaining('/profile-pictures/'));
  });

  it('renders the variation c back layout with expertise subtitle, tags, and full bio', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ExpertCard {...mockExpert} />);
    const back = screen.getByTestId('expert-face-back');
    expect(within(back).getByTestId('expert-back-subtitle')).toHaveTextContent('Ecology • Restoration • Citizen-science networks');
    expect(within(back).getByText('Leading research on Carpathian biodiversity. Full bio expands on toggle.')).toBeInTheDocument();
    expect(within(back).getByText('Expertise')).toBeInTheDocument();
    expect(within(back).getByText('Bio')).toBeInTheDocument();
    expect(within(back).getByTestId('expert-tags')).toHaveTextContent('Alpine Eco');
    expect(within(back).getByTestId('expert-tags').closest('.notebook-section')).not.toBeNull();
    expect(within(back).getByTestId('expert-bio-box')).toHaveClass('notebook-panel');
    expect(within(back).getByRole('link', { name: /linkedin/i })).toBeInTheDocument();
    expect(within(back).getByRole('link', { name: /send email/i })).toBeInTheDocument();
    expect(within(back).getByRole('link', { name: /scopus/i })).toBeInTheDocument();
    expect(within(back).getByRole('link', { name: /google scholar/i })).toBeInTheDocument();
    expect(within(back).getByRole('link', { name: /orcid/i })).toBeInTheDocument();
    expect(within(back).getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('keeps long bio, many tags, and footer actions reachable on back side', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    const { container } = render(
      <ExpertCard
        {...mockExpert}
        bio={'Long expert biography. '.repeat(80)}
        expertise={['Ecology', 'Hydrology', 'GIS', 'Climate', 'Forestry', 'Policy', 'Wildlife', 'Restoration']}
      />
    );

    expect(screen.getByTestId('expert-tags')).toHaveTextContent('Restoration');
    expect(screen.getByRole('button', { name: /copy expert link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to expert summary/i })).toBeInTheDocument();
    expect(container.querySelector('[data-testid="expert-bio"]')?.closest('.notebook-panel')).not.toBeNull();
  });

  it('flips from card-surface clicks and explicit controls, but not from interactive child actions', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle, clear: vi.fn() });
    render(<ExpertCard {...mockExpert} />);

    const linkedin = screen.getByRole('link', { name: /linkedin profile/i });
    const email = screen.getByRole('link', { name: /send email/i });
    linkedin.addEventListener('click', (event) => event.preventDefault(), { once: true });
    email.addEventListener('click', (event) => event.preventDefault(), { once: true });

    await user.click(linkedin);
    await user.click(email);
    await user.click(within(screen.getByTestId('expert-face-front')).getByRole('button', { name: /copy expert link/i }));
    expect(toggle).not.toHaveBeenCalled();

    await user.click(within(screen.getByTestId('expert-face-front')).getByTestId('expert-subtitle'));
    expect(toggle).toHaveBeenCalledTimes(1);

    await user.click(within(screen.getByTestId('expert-face-front')).getByRole('button', { name: /view expert details/i }));
    expect(toggle).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard activation for details and copy controls', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle, clear: vi.fn() });
    render(<ExpertCard {...mockExpert} />);

    const front = screen.getByTestId('expert-face-front');
    within(front).getByRole('button', { name: /copy expert link/i }).focus();
    await user.keyboard('[Enter]');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/?dataset=cs&tab=experts&card=expert&id=e1#expert-card-e1`);

    within(front).getByRole('button', { name: /view expert details/i }).focus();
    await user.keyboard('[Enter]');
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('includes focus-within ring and hover lift utilities', () => {
    const { container } = render(<ExpertCard {...mockExpert} />);
    const card = container.querySelector('article');
    expect(card).toHaveClass(/focus-within:ring-offset-2/);
    expect(card).toHaveClass('card-interactive-shell');
    expect(card).toHaveClass(/hover:-translate-y-1/);
    expect(card).toHaveClass('motion-reduce:transition-none');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ExpertCard {...mockExpert} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
