import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { VolunteerModal } from '../VolunteerModal';

vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
}));

describe('VolunteerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  const fillVolunteerForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/Full name/i), 'Test User');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/City/i), 'Brasov');
    await user.type(screen.getByLabelText(/Country/i), 'Romania');
    await user.clear(screen.getByLabelText(/Radius in km/i));
    await user.type(screen.getByLabelText(/Radius in km/i), '75');
    await user.click(screen.getByLabelText('Biodiversity'));
    await user.click(screen.getByLabelText(/I consent/i));
  };

  it('renders global volunteer subscription form', () => {
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Radius in km/i)).toBeInTheDocument();
    expect(screen.getByText(/Interested categories/i)).toBeInTheDocument();
  });

  it('submits valid subscription data', async () => {
    const user = userEvent.setup();
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillVolunteerForm(user);
    await user.click(screen.getByRole('button', { name: /Subscribe for alerts/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Test User',
        email: 'test@example.com',
        city: 'Brasov',
        country: 'Romania',
        radiusKm: 75,
        categoryIds: ['biodiversity'],
        consent: true,
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('requires consent before submitting', async () => {
    const user = userEvent.setup();
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/Full name/i), 'Test User');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/City/i), 'Brasov');
    await user.type(screen.getByLabelText(/Country/i), 'Romania');
    await user.click(screen.getByLabelText('Biodiversity'));
    await user.click(screen.getByRole('button', { name: /Subscribe for alerts/i }));

    expect(await screen.findByText(/Consent is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows submit error and keeps modal open when onSubmit rejects', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Volunteer subscription failed'));
    const user = userEvent.setup();
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await fillVolunteerForm(user);
    await user.click(screen.getByRole('button', { name: /Subscribe for alerts/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Volunteer subscription failed');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables submit while offline', () => {
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isOnline={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    expect(screen.getByRole('button', { name: /subscribe for alerts/i })).toBeDisabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<VolunteerModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
