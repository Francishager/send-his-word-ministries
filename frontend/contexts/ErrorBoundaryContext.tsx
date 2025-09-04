import { createContext, useCallback, useContext, useState } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from 'react-hot-toast';

interface ErrorBoundaryContextType {
  error: Error | null;
  errorInfo: any;
  handleError: (error: Error, errorInfo?: any) => void;
  resetError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType | undefined>(undefined);

interface ErrorBoundaryProviderProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo?: any) => void;
}

export function ErrorBoundaryProvider({ children, onError }: ErrorBoundaryProviderProps) {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleError = useCallback(
    (error: Error, errorInfo?: any) => {
      console.error('Global error handler caught:', error, errorInfo);
      setError(error);
      setErrorInfo(errorInfo);

      // Show error toast to user
      toast.error(
        error.message || 'An unexpected error occurred. Our team has been notified.'
      );

      // Call the provided error handler if any
      if (onError) {
        onError(error, errorInfo);
      }

      // TODO: Send error to error tracking service (e.g., Sentry, LogRocket)
      // logErrorToService(error, errorInfo);
    },
    [onError]
  );

  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  // If there's an error and we're not in development, show error boundary
  if (error && process.env.NODE_ENV !== 'development') {
    return (
      <ErrorBoundaryContext.Provider value={{ error, errorInfo, handleError, resetError }}>
        <div className="flex h-screen w-full items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
            <p className="mb-6 text-gray-600">
              We're sorry, but an unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={resetError}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </ErrorBoundaryContext.Provider>
    );
  }

  return (
    <ErrorBoundaryContext.Provider value={{ error, errorInfo, handleError, resetError }}>
      <ReactErrorBoundary onError={handleError}>
        {children}
      </ReactErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
}

export function useErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);
  if (context === undefined) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  return context;
}

// Higher-order component to wrap components with error boundary
export function withErrorBoundary<P>(
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundaryProvider>
        <ErrorBoundaryWrapper Component={Component} FallbackComponent={FallbackComponent} {...props} />
      </ErrorBoundaryProvider>
    );
  };
}

function ErrorBoundaryWrapper({
  Component,
  FallbackComponent,
  ...props
}: {
  Component: React.ComponentType<any>;
  FallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
  [key: string]: any;
}) {
  const { error, resetError } = useErrorBoundary();

  if (error) {
    return FallbackComponent ? (
      <FallbackComponent error={error} resetError={resetError} />
    ) : (
      <div className="p-4 text-red-600">
        <p>Something went wrong. Please try again.</p>
        <button onClick={resetError} className="mt-2 text-blue-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  return <Component {...props} />;
}
