'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">Une erreur est survenue.</p>
          <button
            className="mt-4 text-xs text-primary-950 underline"
            onClick={() => this.setState({ hasError: false })}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
