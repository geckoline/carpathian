import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { AddExpertModal } from '../AddExpertModal';

const createMockAppStore = vi.hoisted(() => (globalThis as any).__createMockAppStore);

vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? <div data-testid="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div id="modal-title">{title}</div>{children}</div> : null,
}));

vi.mock('@/components/modals/ImportConflictDialog', () => ({
  ImportConflictDialog: ({ isOpen, fields, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="conflict-dialog">
        <div data-testid="conflict-fields">{JSON.stringify(fields)}</div>
        <button data-testid="confirm-conflicts" onClick={() => onConfirm(fields.map((f: any) => f.key))}>
          Confirm Conflicts
        </button>
      </div>
    ) : null,
}));

const mockValidateBoth = vi.fn();
vi.mock('@/services/importValidator', () => ({
  importValidator: { validateBoth: (...args: any[]) => mockValidateBoth(...args) },
}));

vi.mock('@/store/appStore', () => createMockAppStore());

describe('AddExpertModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renders form fields when open', () => {
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/institution \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio \*/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddExpertModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: /add expert/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows offline warning and disables submit', () => {
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} isOnline={false} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    expect(screen.getByRole('button', { name: /add expert/i })).toBeDisabled();
  });

  it('fetches profile from ORCID and applies data', async () => {
    mockValidateBoth.mockResolvedValue([{
      source: 'orcid', valid: true,
      profile: { name: 'Dr. Jane', affiliation: 'UBB', biography: 'Researcher', country: 'RO', keywords: ['biodiversity'], citedBy: 10 },
    }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/orcid url \*/i), 'https://orcid.org/0000-0002-1234-5678');
    const fetchButtons = screen.getAllByRole('button', { name: /fetch profile/i });
    await user.click(fetchButtons[1]!);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Dr. Jane')).toBeInTheDocument();
    });
  });

  it('shows fetch error when validation fails', async () => {
    mockValidateBoth.mockResolvedValue([{ source: 'orcid', valid: false, error: 'Invalid ORCID URL format' }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/orcid url \*/i), 'https://orcid.org/bad');
    const fetchButtons = screen.getAllByRole('button', { name: /fetch profile/i });
    await user.click(fetchButtons[1]!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid ORCID URL format');
  });

  it('shows conflict dialog when imported data conflicts', async () => {
    mockValidateBoth.mockResolvedValue([{
      source: 'orcid', valid: true,
      profile: { name: 'Imported Name', affiliation: 'UBB', biography: 'Researcher', country: 'RO', keywords: ['biodiversity'], citedBy: 10 },
    }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name \*/i), 'Existing Name');
    await user.type(screen.getByLabelText(/orcid url \*/i), 'https://orcid.org/0000-0002-1234-5678');
    const fetchButtons = screen.getAllByRole('button', { name: /fetch profile/i });
    await user.click(fetchButtons[1]!);

    await waitFor(() => {
      expect(screen.getByTestId('conflict-fields')).toBeInTheDocument();
    });
  });

  it('closes on cancel', async () => {
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles fetch exception gracefully', async () => {
    mockValidateBoth.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/orcid url \*/i), 'https://orcid.org/0000-0002-1234-5678');
    const fetchButtons = screen.getAllByRole('button', { name: /fetch profile/i });
    await user.click(fetchButtons[1]!);

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to validate profile URL');
  });



  it('resolves conflicts by confirming', async () => {
    mockValidateBoth.mockResolvedValue([{
      source: 'orcid', valid: true,
      profile: { name: 'Imported Name', affiliation: 'UBB', biography: 'Researcher', country: 'RO', keywords: ['biodiversity'], citedBy: 10 },
    }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/name \*/i), 'Existing Name');
    await user.type(screen.getByLabelText(/orcid url \*/i), 'https://orcid.org/0000-0002-1234-5678');
    const fetchButtons = screen.getAllByRole('button', { name: /fetch profile/i });
    await user.click(fetchButtons[1]!);

    await waitFor(() => {
      expect(screen.getByTestId('conflict-fields')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('confirm-conflicts'));

    await waitFor(() => {
      expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
