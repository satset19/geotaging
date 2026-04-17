import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

// Error boundary klasik. Untuk fatal errors saja; runtime error biasa ditangani lokal.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info);
  }

  private reset = () => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div
        role="alert"
        className="flex min-h-full items-center justify-center p-6"
      >
        <div className="max-w-md rounded-lg border bg-card p-6 shadow">
          <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}
