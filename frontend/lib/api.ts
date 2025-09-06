import { getSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Default to same-origin proxy path to avoid CORS/mixed-content during dev.
// Configure proxy via next.config.js rewrites.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/backend';

function resolveBaseUrl(): string {
  // Absolute URL provided
  if (/^https?:\/\//i.test(API_URL)) return API_URL.replace(/\/$/, '');
  // Relative path provided: resolve against origin (browser) or env (SSR)
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${origin.replace(/\/$/, '')}${API_URL.startsWith('/') ? '' : '/'}${API_URL}`.replace(/\/$/, '');
}

function joinUrl(base: string, endpoint: string): string {
  const b = base.replace(/\/$/, '');
  const e = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${b}/${e}`;
}

interface RequestOptions extends RequestInit {
  /** Whether to include authentication token */
  auth?: boolean;
  /** Whether to handle errors automatically (show toast) */
  handleError?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Number of retry attempts for failed requests */
  retry?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Query parameters */
  params?: Record<string, any>;
}

// Request interceptor
async function requestInterceptor(options: RequestOptions): Promise<RequestInit> {
  const { auth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  // Set content type if not already set
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Add auth token if needed
  if (auth !== false) {
    const session = await getSession();
    if (session?.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  return {
    ...fetchOptions,
    headers,
    credentials: 'include', // Important for cookies
  };
}

// Response interceptor
async function responseInterceptor<T>(response: Response, options: RequestOptions): Promise<T> {
  // Handle empty responses (e.g., 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  // Handle error responses
  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

// Error handler
function handleApiError(error: any, options: RequestOptions) {
  const errorMessage = options.errorMessage || error.message || 'An unexpected error occurred';

  if (options.handleError !== false) {
    toast.error(errorMessage);
  }

  console.error('API Error:', {
    message: error.message,
    status: error.status,
    data: error.data,
  });

  // Handle specific status codes
  if (error.status === 401) {
    // Handle unauthorized
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?session=expired';
    }
  }

  throw error;
}

// Retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 0,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Don't retry for 4xx errors except 429 (Too Many Requests)
    if (error.status >= 400 && error.status < 500 && error.status !== 429 && error.status !== 408) {
      throw error;
    }

    if (retries <= 0) {
      throw error;
    }

    // Exponential backoff
    const delayTime = delay * 2 ** (3 - retries);
    await new Promise((resolve) => setTimeout(resolve, delayTime));
    return withRetry(fn, retries - 1, delay);
  }
}

/**
 * Make an API request with interceptors and retry logic
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    auth = true,
    handleError: shouldHandleError = true,
    retry = 2,
    retryDelay = 1000,
    params,
    ...fetchOptions
  } = options;

  // Construct URL with query parameters; ensure absolute base
  const base = resolveBaseUrl();
  const url = new URL(joinUrl(base, endpoint));
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const executeRequest = async (): Promise<T> => {
    try {
      const requestOptions = await requestInterceptor({
        ...fetchOptions,
        auth,
      });

      const response = await fetch(url.toString(), requestOptions);
      return await responseInterceptor<T>(response, options);
    } catch (error: any) {
      if (shouldHandleError) {
        handleApiError(error, options);
      }
      throw error;
    }
  };

  return withRetry(executeRequest, retry, retryDelay);
}

// HTTP method helpers
export async function get<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T = any>(
  endpoint: string,
  data: any = {},
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body,
  });
}

export async function put<T = any>(
  endpoint: string,
  data: any = {},
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body,
  });
}

export async function patch<T = any>(
  endpoint: string,
  data: any = {},
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body,
  });
}

export async function del<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

// Note: Avoid overriding global fetch in the browser/Next.js runtime.
// Use apiRequest/get/post helpers above so we can control behavior per-call.
