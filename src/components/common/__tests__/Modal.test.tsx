import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders content and dialog role when open', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls onClose on ESC key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><button>OK</button></Modal>);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on overlay click', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><button>OK</button></Modal>);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside content', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><button>OK</button></Modal>);
    fireEvent.click(screen.getByText('OK'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has correct aria attributes', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Settings"><div>Body</div></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
