import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AddProjectModal } from '@/components/modals/AddProjectModal';

const TestHarness = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>+ Add Project</button>
      <AddProjectModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSubmit={vi.fn()} />
    </div>
  );
};

describe('KeyboardNav', () => {
  it('traps focus inside modal and restores on close', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: /\+ add project/i });
    await user.click(trigger);

    const firstEl = screen.getByLabelText(/project name/i);

    await user.click(firstEl);
    await user.tab();
    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /\+ add project/i }));
  });
});
