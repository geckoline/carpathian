import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const BuggyComponent = () => { throw new Error('Test crash'); };

const preventExpectedCrashReport = (event: ErrorEvent) => {
  if (event.error instanceof Error && event.error.message === 'Test crash') {
    event.preventDefault();
  }
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    window.removeEventListener('error', preventExpectedCrashReport);
    vi.restoreAllMocks();
  });

  it('renders children when no error', () => {
    render(<ErrorBoundary><p>Safe</p></ErrorBoundary>);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    window.addEventListener('error', preventExpectedCrashReport);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><BuggyComponent /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('renders custom fallback', () => {
    window.addEventListener('error', preventExpectedCrashReport);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary fallback={<div>Custom Error</div>}><BuggyComponent /></ErrorBoundary>);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });
});
