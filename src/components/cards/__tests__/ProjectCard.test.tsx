import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '../ProjectCard';
import { useCardFlip } from '@/hooks/useCardFlip';

const storeMocks = vi.hoisted(() => ({
  setSelectedExpertId: vi.fn(),
  setActiveTab: vi.fn(),
}));

vi.mock('@/store/appStore', () => ({
  useAppStore: vi.fn((sel: (s: any) => any) => sel({
    setSelectedExpertId: storeMocks.setSelectedExpertId,
    setActiveTab: storeMocks.setActiveTab,
    filters: { searchTerm: '' },
    a11y: { reducedMotion: false },
  }))
}));
vi.mock('@/hooks/useCardFlip', () => ({
  useCardFlip: vi.fn(() => ({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() }))
}));
vi.mock('@/utils/highlightText', () => ({
  highlightText: vi.fn((text: string) => ({ __html: text }))
}));

const mockProject = {
  id: 'p1', name: 'Carpathian Watch', status: 'active' as const, field: 'Biodiversity',
  description: 'Monitoring deforestation across northern ranges. Full text expands on toggle.',
  location: 'POLYGON((24.9 47.4, 25.1 47.4, 25.1 47.6, 24.9 47.6, 24.9 47.4))',
  displayLocation: '3 Countries',
  yearRange: '2021-2025',
  leadExpertId: '123e4567-e89b-12d3-a456-426614174001',
  leadExpertName: 'Dr. E. Popescu',
  regionLabel: '3-country mountain corridor',
  cardSummary: 'Draft-ready project summary for the front face.',
  focusSummary: 'Pollinators, habitat fragmentation, community mapping',
  outputsSummary: 'Atlas layers, species reports, volunteer participation metrics',
  website: 'https://example.com',
  contact: 'citizen-science@carpathian.org',
  isCitizenScience: true,
};

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
  });

  it('renders the variation c front layout with atmospheric header, region/timeline meta, and footer actions', () => {
    const { container } = render(<ProjectCard {...mockProject} />);
    const front = screen.getByTestId('project-face-front');
    expect(within(front).getByText('Carpathian Watch')).toBeInTheDocument();
    expect(within(front).getByTestId('project-status')).toHaveTextContent('Active');
    expect(within(front).getByTestId('project-field')).toHaveTextContent('Biodiversity');
    expect(within(front).getByText('Region')).toBeInTheDocument();
    expect(within(front).getByText('Timeline')).toBeInTheDocument();
    expect(within(front).getByText('Lead')).toBeInTheDocument();
    expect(within(front).getByTestId('project-badge-row')).toBeInTheDocument();
    expect(within(front).getByTestId('project-title-row')).toHaveClass('project-title-row');
    expect(within(front).getByTestId('project-badge-row')).toHaveClass('project-badge-stack');
    expect(within(front).getByTestId('project-status')).toHaveClass('badge-single-line', 'project-status-pill', 'project-status-pill-active');
    expect(within(front).getByTestId('project-field')).toHaveAttribute('title', 'Biodiversity');
    expect(within(front).getByTestId('project-field')).toHaveClass('project-category-pill');
    expect(within(front).getByTestId('project-card-title')).toHaveTextContent('Carpathian Watch');
    expect(within(front).getByTestId('project-lead-expert')).toHaveClass('lead-meta-row');
    expect(within(front).getByTestId('project-lead-expert').querySelector('.pulse')).not.toBeInTheDocument();
    expect(within(front).getByTestId('project-location')).toHaveTextContent('3-country mountain corridor');
    expect(within(front).getByTestId('project-year')).toHaveTextContent('2021-2025');
    expect(within(front).getByTestId('project-summary')).toHaveTextContent('Draft-ready project summary for the front face.');
    expect(within(front).getByTestId('project-meta-grid')).toBeInTheDocument();
    expect(within(front).getByTestId('project-lead-expert')).toHaveTextContent('Dr. E. Popescu');
    expect(within(front).getByRole('link', { name: /website/i })).toHaveAttribute('href', 'https://example.com');
    expect(within(front).getByRole('button', { name: /copy project link/i })).toBeInTheDocument();
    expect(within(front).queryByRole('button', { name: /volunteer/i })).not.toBeInTheDocument();
    expect(within(front).getByTestId('flip-to-back')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="project-card-stage"]')).toHaveClass('card-flip-stage');
    expect(screen.getByTestId('project-face-back')).toHaveClass('project-card-backdrop');
    expect(container.querySelector('article')).toHaveClass('project-card-shell', 'card-auto-height-shell');
  });

  it('keeps long category labels compact while preserving the full accessible label', () => {
    render(<ProjectCard {...mockProject} field="Industry & Infrastructure" />);
    const fieldBadge = within(screen.getByTestId('project-face-front')).getByTestId('project-field');

    expect(fieldBadge).toHaveTextContent('Infrastructure');
    expect(fieldBadge).toHaveAttribute('title', 'Industry & Infrastructure');
    expect(fieldBadge).toHaveAttribute('aria-label', 'Category: Industry & Infrastructure');
    expect(fieldBadge).toHaveClass('badge-single-line', 'project-category-pill');
  });

  it.each([
    ['active', 'Active', 'project-status-pill-active'],
    ['planned', 'Planned', 'project-status-pill-planned'],
    ['past', 'Past', 'project-status-pill-past'],
  ] as const)('uses the subtle color-coded %s status pill', (status, label, statusClass) => {
    render(<ProjectCard {...mockProject} status={status} />);

    const statusBadge = within(screen.getByTestId('project-face-front')).getByTestId('project-status');
    expect(statusBadge).toHaveTextContent(label);
    expect(statusBadge).toHaveClass('project-status-pill', statusClass);
  });

  it('renders lead expert action and selects the related expert', async () => {
    const user = userEvent.setup();
    const expertEl = document.createElement('div');
    expertEl.id = 'expert-card-123e4567-e89b-12d3-a456-426614174001';
    expertEl.scrollIntoView = vi.fn();
    document.body.appendChild(expertEl);

    render(<ProjectCard {...mockProject} />);
    await user.click(within(screen.getByTestId('project-face-front')).getByRole('button', { name: /show lead expert dr\. e\. popescu/i }));

    expect(storeMocks.setSelectedExpertId).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001');
    expect(storeMocks.setActiveTab).toHaveBeenCalledWith('experts');
    expect(expertEl.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expertEl.remove();
  });

  it('copies link and stops propagation', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const user = userEvent.setup();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} />);
    await user.click(within(screen.getByTestId('project-face-front')).getByTestId('copy-project-link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/project/p1'));
  });

  it('does not render per-project volunteer actions because volunteer signup is global', () => {
    render(<ProjectCard {...mockProject} />);
    expect(screen.queryByRole('button', { name: /volunteer/i })).not.toBeInTheDocument();
  });

  it('flips from card-surface clicks and explicit controls, but not from interactive child actions', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle, clear: vi.fn() });

    render(<ProjectCard {...mockProject} />);

    const front = screen.getByTestId('project-face-front');
    await user.click(within(front).getByRole('link', { name: /website/i }));
    await user.click(within(front).getByRole('button', { name: /copy project link/i }));
    expect(toggle).not.toHaveBeenCalled();

    await user.click(within(front).getByTestId('project-summary'));
    expect(toggle).toHaveBeenCalledTimes(1);

    await user.click(within(front).getByTestId('flip-to-back'));
    expect(toggle).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard activation for details and copy controls', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: false, isFlipping: false, flip: vi.fn(), toggle, clear: vi.fn() });

    render(<ProjectCard {...mockProject} />);

    const front = screen.getByTestId('project-face-front');
    within(front).getByRole('button', { name: /copy project link/i }).focus();
    await user.keyboard('[Enter]');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/project/p1'));

    within(front).getByRole('button', { name: /view project details/i }).focus();
    await user.keyboard('[Enter]');
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('renders the variation c back layout with premium summary and structured details', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} />);
    const back = screen.getByTestId('project-face-back');
    expect(within(back).getByTestId('project-badge-row')).toHaveClass('project-badge-stack');
    expect(within(back).getByText('Monitoring deforestation across northern ranges. Full text expands on toggle.')).toBeInTheDocument();
    expect(within(back).getByText('Overview')).toBeInTheDocument();
    expect(within(back).getByTestId('project-back-summary')).toBeInTheDocument();
    expect(within(back).getByTestId('project-back-summary').closest('.notebook-section')).not.toBeNull();
    expect(within(back).getByTestId('project-detail-list')).toHaveClass('notebook-detail-list');
    expect(within(back).getByText('Contact')).toBeInTheDocument();
    expect(within(back).getByText('Focus')).toBeInTheDocument();
    expect(within(back).getByText('Outputs')).toBeInTheDocument();
    expect(within(back).getByTestId('project-contact-detail')).toHaveClass('notebook-detail-item');
    expect(within(back).getByTestId('project-focus-detail')).toHaveClass('notebook-detail-item');
    expect(within(back).getByTestId('project-outputs-detail')).toHaveClass('notebook-detail-item');
    expect(within(back).getByText('citizen-science@carpathian.org')).toBeInTheDocument();
    expect(within(back).getByText('Pollinators, habitat fragmentation, community mapping')).toBeInTheDocument();
    expect(within(back).getByText('Atlas layers, species reports, volunteer participation metrics')).toBeInTheDocument();
    expect(within(back).getByRole('button', { name: /copy project link/i })).toBeInTheDocument();
    expect(within(back).getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('keeps long back content scrollable while footer actions remain reachable', () => {
    vi.mocked(useCardFlip).mockReturnValue({ isFlipped: true, isFlipping: false, flip: vi.fn(), toggle: vi.fn(), clear: vi.fn() });
    render(<ProjectCard {...mockProject} description={'Long project details. '.repeat(80)} />);

    expect(screen.getByRole('button', { name: /copy project link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByTestId('project-back-summary')).toHaveTextContent('Long project details.');
  });

  it('uses the draft structural classes for the front surface', () => {
    const { container } = render(<ProjectCard {...mockProject} />);
    const header = container.querySelector('[data-testid="project-front-header"]');
    expect(header).toHaveClass('header');
    expect(container.querySelector('[data-testid="project-face-front"]')).toHaveClass('card', 'project-front');
  });

  it('includes reduced-motion transition guard', () => {
    const { container } = render(<ProjectCard {...mockProject} />);
    expect(container.querySelector('article')).toHaveClass('motion-reduce:transition-none');
  });
});
