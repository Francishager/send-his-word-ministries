import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundaryProvider } from '@/contexts/ErrorBoundaryContext';
import { ToastProvider } from '@/components/ui/use-toast';

// Create a test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

// Create a mock router
const createMockRouter = (router: Partial<NextRouter>): NextRouter => ({
  basePath: '',
  isReady: true,
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isPreview: false,
  isLocaleDomain: false,
  ...router,
});

// Custom render function with all the providers
export const renderWithProviders = (
  ui: ReactElement,
  {
    routerOptions = {},
    ...renderOptions
  }: {
    routerOptions?: Partial<NextRouter>;
  } & Omit<RenderOptions, 'queries'> = {}
) => {
  const queryClient = createTestQueryClient();
  const mockRouter = createMockRouter(routerOptions);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RouterContext.Provider value={mockRouter}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundaryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ErrorBoundaryProvider>
      </QueryClientProvider>
    </RouterContext.Provider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    router: mockRouter,
  };
};

// Re-export everything from testing-library
// so we don't have to import from multiple files
export * from '@testing-library/react';

export { renderWithProviders as render };

// Helper to mock API responses
export const mockApiResponse = (
  endpoint: string,
  response: any,
  status = 200,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    delay?: number;
    once?: boolean;
  } = {}
) => {
  const { method = 'GET', delay = 0, once = true } = options;
  const mockFn = jest.fn().mockImplementation(
    () =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              status,
              ok: status >= 200 && status < 300,
              json: async () => response,
            }),
          delay
        );
      })
  );

  const mock = once ? mockFn.mockResolvedValueOnce : mockFn;

  switch (method.toUpperCase()) {
    case 'GET':
      (require('@/lib/api').get as jest.Mock) = mock;
      break;
    case 'POST':
      (require('@/lib/api').post as jest.Mock) = mock;
      break;
    case 'PUT':
      (require('@/lib/api').put as jest.Mock) = mock;
      break;
    case 'DELETE':
      (require('@/lib/api').del as jest.Mock) = mock;
      break;
    case 'PATCH':
      (require('@/lib/api').patch as jest.Mock) = mock;
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return mockFn;
};

// Helper to wait for loading to finish
export const waitForLoadingToFinish = async (delay = 0) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  await new Promise((resolve) => setTimeout(resolve, 0)); // Wait for React to update
};

// Helper to test form submission
export const submitForm = async (form: HTMLElement, values: Record<string, any>) => {
  // Fill in form fields
  Object.entries(values).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;

    const inputType = input.getAttribute('type');
    const tagName = input.tagName.toLowerCase();

    if (tagName === 'input' && inputType === 'checkbox') {
      if (value) {
        fireEvent.click(input);
      }
    } else if (tagName === 'select') {
      fireEvent.change(input, { target: { value } });
    } else {
      fireEvent.input(input, {
        target: { name, value },
      });
    }
  });

  // Submit the form
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    fireEvent.click(submitButton);
  } else {
    fireEvent.submit(form);
  }

  // Wait for any async operations to complete
  await waitForLoadingToFinish();
};

// Helper to test error boundaries
export const TestErrorBoundary = ({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError: (error: Error, errorInfo: React.ErrorInfo) => void;
}) => {
  return <ErrorBoundaryProvider onError={onError}>{children}</ErrorBoundaryProvider>;
};

// Helper to test protected routes
export const withAuth = (
  Component: React.ComponentType,
  { roles = [], redirectTo = '/login' } = {}
) => {
  const WrappedComponent = (props: any) => {
    const { isAuthenticated, hasRole, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      const router = useRouter();
      useEffect(() => {
        router.push(redirectTo);
      }, [router]);
      return null;
    }

    if (roles.length > 0 && !roles.some((role) => hasRole(role))) {
      return <div>Unauthorized</div>;
    }

    return <Component {...props} />;
  };

  return WrappedComponent;
};
