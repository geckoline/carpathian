import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary caught:', error, info); }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center" role="alert">
          <h3 className="text-red-700 font-semibold">Something went wrong</h3>
          <p className="text-sm text-text-muted mt-2">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 text-sm px-3 py-1 bg-white border rounded-full hover:bg-[var(--color-panel-surface-soft)] transition">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
