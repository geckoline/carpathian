import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
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

  it('renders in a top-layer modal portal with map-safe z-index', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(document.body.contains(dialog)).toBe(true);
    expect(dialog).toHaveAttribute('data-testid', 'modal-overlay');
    expect(dialog).toHaveClass('z-[4000]');
  });

  it('calls onClose on ESC key', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test"><button>OK</button></Modal>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
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

  it('has no accessibility violations', async () => {
    const { container } = render(<Modal isOpen={true} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
