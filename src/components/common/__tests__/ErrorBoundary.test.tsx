import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const BuggyComponent = () => { throw new Error('Test crash'); };

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><p>Safe</p></ErrorBoundary>);
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('renders fallback UI on error', () => {
    render(<ErrorBoundary><BuggyComponent /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('renders custom fallback', () => {
    render(<ErrorBoundary fallback={<div>Custom Error</div>}><BuggyComponent /></ErrorBoundary>);
    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });
});
