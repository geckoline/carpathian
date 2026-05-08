import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VolunteerModal } from '../VolunteerModal';

// Mock Modal component
vi.mock('@/components/common/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => 
    isOpen ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
}));

describe('VolunteerModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const projectId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  it('renders volunteer form', () => {
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} projectId={projectId} onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Area of Expertise/i)).toBeInTheDocument();
  });

  it('submits valid application', async () => {
    const user = userEvent.setup();
    render(<VolunteerModal isOpen={true} onClose={mockOnClose} projectId={projectId} onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/Full Name/i), 'Test User');
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/Area of Expertise/i), 'Data Analysis');
    await user.type(screen.getByLabelText(/Why do you want to volunteer/i), 'This is a motivation statement with more than fifty characters to pass validation');
    await user.selectOptions(screen.getByLabelText(/Availability/i), 'part-time');
    
    await user.click(screen.getByRole('button', { name: /Submit Application/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        projectId,
      }));
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
