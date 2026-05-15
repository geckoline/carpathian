import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddExpertModal } from '@/components/modals/AddExpertModal';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);

vi.mock('@/store/appStore', () => createMockAppStore());

vi.mock('@/services/apiService', () => ({
  apiService: {
    addExpert: vi.fn().mockResolvedValue({ id: 'new-id' }),
  },
}));

vi.mock('@/services/importValidator', () => ({
  importValidator: {
    validateBoth: vi.fn().mockResolvedValue([]),
  },
}));

describe('AddExpertModal', () => {
  const mockOnClose = vi.fn();
  const mockSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (overrides?: { isOnline?: boolean }) =>
    render(
      <AddExpertModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockSubmit}
        isOnline={overrides?.isOnline ?? true}
      />
    );

  it('renders all required fields', () => {
    renderModal();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^institution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /bio \*/i })).toBeInTheDocument();
  });

  it('renders social URL fields', () => {
    renderModal();
    expect(screen.getByLabelText(/google scholar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/orcid/i)).toBeInTheDocument();
  });

  it('renders modal title', () => {
    renderModal();
    expect(screen.getByText('Add New Expert')).toBeInTheDocument();
  });

  it('shows offline warning when offline', () => {
    renderModal({ isOnline: false });
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation errors for missing required fields', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /add expert/i }));
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^name/i), 'Dr. Jane Smith');
    await user.type(screen.getByLabelText(/^institution/i), 'UB');
    await user.type(screen.getByLabelText(/^country/i), 'Romania');
    await user.type(screen.getByLabelText(/^email/i), 'not-an-email');
    await user.type(screen.getByRole('textbox', { name: /bio \*/i }), 'Expert in Carpathian biodiversity with years of experience.');
    await user.type(screen.getByLabelText(/google scholar/i), 'https://scholar.google.com/citations?user=abc123');

    fireEvent.click(screen.getByRole('button', { name: /add expert/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('validates at least one social URL is required', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/^name/i), 'Dr. Jane Smith');
    await user.type(screen.getByLabelText(/^institution/i), 'UB');
    await user.type(screen.getByLabelText(/^country/i), 'Romania');
    await user.type(screen.getByLabelText(/^email/i), 'jane@unibuc.ro');
    await user.type(screen.getByRole('textbox', { name: /bio \*/i }), 'Expert in Carpathian biodiversity with years of experience in the field.');

    fireEvent.click(screen.getByRole('button', { name: /add expert/i }));
    await waitFor(() => {
      const errors = screen.getAllByText(/ORCID URL is required/i);
      expect(errors.length).toBe(2);
    });
  });
});
