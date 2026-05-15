import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';

describe('ExportButton', () => {
  it('renders export button', () => {
    render(<ExportButton onExportCSV={vi.fn()} onExportJSON={vi.fn()} />);
    expect(screen.getByLabelText('Export data')).toBeInTheDocument();
  });

  it('shows dropdown on click', () => {
    render(<ExportButton onExportCSV={vi.fn()} onExportJSON={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Export data'));
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
    expect(screen.getByText('Export as JSON')).toBeInTheDocument();
  });

  it('calls onExportCSV when CSV option clicked', () => {
    const onExportCSV = vi.fn();
    render(<ExportButton onExportCSV={onExportCSV} onExportJSON={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Export data'));
    fireEvent.click(screen.getByText('Export as CSV'));
    expect(onExportCSV).toHaveBeenCalledOnce();
  });

  it('calls onExportJSON when JSON option clicked', () => {
    const onExportJSON = vi.fn();
    render(<ExportButton onExportCSV={vi.fn()} onExportJSON={onExportJSON} />);
    fireEvent.click(screen.getByLabelText('Export data'));
    fireEvent.click(screen.getByText('Export as JSON'));
    expect(onExportJSON).toHaveBeenCalledOnce();
  });

  it('disables button when disabled is true', () => {
    render(<ExportButton onExportCSV={vi.fn()} onExportJSON={vi.fn()} disabled />);
    expect(screen.getByLabelText('Export data')).toBeDisabled();
  });
});
