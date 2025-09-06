import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call the onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Use the provided fallback or render the default error UI
      return this.props.fallback || this.renderDefaultErrorUI();
    }

    return this.props.children;
  }

  private renderDefaultErrorUI() {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We're sorry, but an unexpected error occurred. Please try refreshing the page or contact
            support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 rounded-md bg-muted p-4 text-left text-sm">
              <summary className="mb-2 cursor-pointer font-medium">Error details</summary>
              <pre className="overflow-auto rounded bg-background p-2 text-red-600">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button onClick={this.handleReset}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }
}

// Higher-order component for functional components
export function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  

  // Format for display in DevTools
  const name = Component.displayName || Component.name || 'Component';
  Wrapped.displayName = `withErrorBoundary(${name})`;

  return Wrapped;
}
