import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock next/router
jest.mock('next/router', () => require('next-router-mock'));

// Mock next/head
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: Array<React.ReactElement> }) => {
    return <>{children}</>;
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  getSession: jest.fn(() => Promise.resolve(null)),
  getCsrfToken: jest.fn(),
  getProviders: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock the API client
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
  createApiClient: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
  __esModule: true,
  default: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Clean up after each test case
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock the ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverStub as any;

// Mock IntersectionObserver
class IntersectionObserverStub {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = IntersectionObserverStub as any;

// Mock the fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock the console.error to reduce noise in test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress specific error messages
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('ReactDOM.unstable_renderSubtreeIntoContainer()') ||
            arg.includes('Warning: useLayoutEffect does nothing on the server') ||
            arg.includes('Warning: An update to %s inside a test was not wrapped in act'))
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Suppress specific warnings
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('componentWillReceiveProps') ||
            arg.includes('componentWillUpdate') ||
            arg.includes('React does not recognize the') ||
            arg.includes('A component is changing an uncontrolled input'))
      )
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
});
