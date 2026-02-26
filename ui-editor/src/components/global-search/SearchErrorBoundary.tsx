import type React from 'react';
import { Component } from 'react';

interface SearchErrorBoundaryProps {
  children: React.ReactNode;
}

interface SearchErrorBoundaryState {
  hasError: boolean;
}

export class SearchErrorBoundary extends Component<
  SearchErrorBoundaryProps,
  SearchErrorBoundaryState
> {
  state: SearchErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidUpdate(prevProps: SearchErrorBoundaryProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div
          className="px-4 py-8 text-center text-sm"
          style={{ color: 'hsl(var(--destructive))' }}
        >
          Search failed to render results. Your data files may contain invalid
          YAML.
        </div>
      );
    }
    return this.props.children;
  }
}
