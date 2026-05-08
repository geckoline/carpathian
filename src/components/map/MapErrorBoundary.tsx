import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('MapErrorBoundary caught:', error, info); }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center" role="alert">
          <h3 className="text-red-700 font-semibold">Map failed to load</h3>
          <p className="text-sm text-text-muted mt-2">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-2 text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default MapErrorBoundary;
