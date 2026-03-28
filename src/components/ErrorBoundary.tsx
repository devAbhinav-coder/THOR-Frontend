'use client';

import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = { hasError: boolean; error?: Error };

/** Use inside client layouts for isolated failure surfaces (does not catch server components). */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200/80 bg-rose-50/95 p-5 text-sm text-rose-950 shadow-sm"
          >
            <p className="font-semibold text-rose-900">This section could not be loaded</p>
            <p className="mt-1.5 text-rose-800/90 leading-relaxed">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 rounded-lg bg-rose-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
