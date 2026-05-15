import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportConflictDialog } from '@/components/modals/ImportConflictDialog';

const mockFields = [
  { key: 'name', label: 'Name', current: 'Dr. Jane Smith', imported: 'Dr. Jane Doe' },
  { key: 'institution', label: 'Institution', current: 'University of Bucharest', imported: 'UB' },
  { key: 'country', label: 'Country', current: 'Romania', imported: 'RO' },
];

describe('ImportConflictDialog', () => {
  it('renders field comparison table', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Institution')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('shows current and imported values', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('University of Bucharest')).toBeInTheDocument();
    expect(screen.getByText('UB')).toBeInTheDocument();
  });

  it('all checkboxes are checked by default', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach(cb => expect(cb.checked).toBe(true));
  });

  it('calls onConfirm with selected field keys on confirm', () => {
    const onConfirm = vi.fn();
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith(['name', 'institution', 'country']);
  });

  it('calls onConfirm with only checked fields when some unchecked', () => {
    const onConfirm = vi.fn();
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={onConfirm}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    fireEvent.click(checkboxes[1]!); // uncheck institution
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith(['name', 'country']);
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={onClose}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ImportConflictDialog
        isOpen={false}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('renders Select All / Deselect All toggle', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Deselect All')).toBeInTheDocument();
  });

  it('toggles all checkboxes with Select All / Deselect All', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    const toggle = screen.getByText('Deselect All');
    fireEvent.click(toggle);
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    checkboxes.forEach(cb => expect(cb.checked).toBe(false));
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('renders warning title about duplicate detection', () => {
    render(
      <ImportConflictDialog
        isOpen={true}
        onClose={vi.fn()}
        fields={mockFields}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
  });
});
