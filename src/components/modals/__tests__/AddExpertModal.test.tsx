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

  it('stores rich Google Scholar import metadata including thumbnail', async () => {
    mockValidateBoth.mockResolvedValue([{
      source: 'google_scholar', valid: true,
      profile: {
        scholarId: 'nIBF034AAAAJ',
        name: 'Scholar Expert',
        affiliation: 'Leuphana University',
        email: 'Verified email at leuphana.de',
        thumbnail: 'https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=nIBF034AAAAJ',
        keywords: ['Biodiversity'],
        citedBy: 100,
        hIndex: 20,
        i10Index: 30,
        articles: [{ title: 'Important paper', citedBy: 50 }],
      },
    }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/google scholar url \*/i), 'https://scholar.google.com/citations?hl=en&user=nIBF034AAAAJ');
    await user.click(screen.getAllByRole('button', { name: /fetch profile/i })[0]!);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Scholar Expert')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/countries \*/i), 'DE');
    await user.type(screen.getByLabelText(/headline/i), 'Scholar profile import');
    await user.type(screen.getByLabelText(/bio \*/i), 'A valid expert biography for submission.');
    await user.type(screen.getByLabelText(/email \*/i), 'expert@example.com');
    if (!(screen.getByLabelText(/biodiversity/i) as HTMLInputElement).checked) {
      await user.click(screen.getByLabelText(/biodiversity/i));
    }
    await user.click(screen.getByRole('button', { name: /add expert/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Scholar Expert',
        institution: 'Leuphana University',
        email: 'expert@example.com',
        profileImageUrl: expect.stringContaining('medium_photo'),
        importMetadata: expect.objectContaining({
          source: 'google_scholar',
          profileImageUrl: expect.stringContaining('medium_photo'),
          scholar: expect.objectContaining({
            scholarId: 'nIBF034AAAAJ',
            thumbnail: expect.stringContaining('medium_photo'),
            articles: [expect.objectContaining({ title: 'Important paper' })],
          }),
        }),
      }));
    });
  });

  it('derives a Scholar thumbnail preview when profile fetch fails', async () => {
    mockValidateBoth.mockResolvedValue([{
      source: 'google_scholar',
      valid: false,
      error: 'Could not fetch Google Scholar profile. Check VITE_SERPAPI_KEY, or upload a profile picture manually.',
    }]);
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/google scholar url \*/i), 'https://scholar.google.com/citations?hl=en&user=nIBF034AAAAJ');
    await user.click(screen.getAllByRole('button', { name: /fetch profile/i })[0]!);

    expect(await screen.findByRole('alert')).toHaveTextContent(/VITE_SERPAPI_KEY/i);
    expect(screen.getByLabelText(/profile picture url/i)).toHaveValue(
      'https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=nIBF034AAAAJ'
    );
    expect(screen.getByRole('img', { name: /profile preview/i })).toHaveAttribute('src', expect.stringContaining('nIBF034AAAAJ'));
  });

  it('accepts an uploaded profile picture', async () => {
    const user = userEvent.setup();
    render(<AddExpertModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const file = new File(['profile'], 'profile.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/^profile picture$/i), file);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /profile preview/i })).toHaveAttribute('src', expect.stringMatching(/^data:image\/png/));
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
