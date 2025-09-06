import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import LoginPage from '@/pages/auth/login';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock useToast
jest.mock('@/components/ui/use-toast');
const mockToast = toast as jest.MockedFunction<typeof toast>;

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockSignIn = jest.fn();
  const mockToastFn = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: {},
    });

    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: null,
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
      requestPasswordReset: jest.fn().mockResolvedValue({}),
    });

    mockToast.mockImplementation(() => ({
      toast: mockToastFn,
      dismiss: jest.fn(),
      toasts: [],
    }));
  });

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Or continue with')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({});

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check if signIn was called with correct data
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: undefined,
      });
    });

    // Check if toast was called with success message
    expect(mockToastFn).toHaveBeenCalledWith({
      title: 'Login successful',
      description: 'You have been successfully logged in.',
    });

    // Check if redirect happened
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check if error toast was shown
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('redirects to callbackUrl if provided', async () => {
    const callbackUrl = '/protected-page';
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: { callbackUrl },
    });

    mockSignIn.mockResolvedValueOnce({});

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check if redirect happened to callbackUrl
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(callbackUrl);
    });
  });

  it('shows loading state when submitting', async () => {
    // Don't resolve the promise immediately
    let resolveSignIn: (value: unknown) => void;
    mockSignIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    render(<LoginPage />);

    // Fill in the form
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check if button is in loading state
    const button = screen.getByRole('button', { name: 'Sign In' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Sign In');

    // Resolve the promise
    await waitFor(() => {
      resolveSignIn!({});
    });
  });

  it('redirects to dashboard if already authenticated', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated: true,
      loading: false,
      user: { id: '1', email: 'test@example.com' },
      error: null,
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
    });

    render(<LoginPage />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state when checking auth status', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated: false,
      loading: true,
      user: null,
      error: null,
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByText('Checking authentication status...')).toBeInTheDocument();
  });

  it('handles password reset flow', async () => {
    render(<LoginPage />);

    // Click on forgot password link
    const forgotPasswordLink = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordLink);

    // Check if password reset form is shown
    expect(screen.getByText('Reset your password')).toBeInTheDocument();

    // Fill in email for password reset
    const emailInput = screen.getByLabelText('Email');
    fireEvent.input(emailInput, {
      target: { value: 'test@example.com' },
    });

    // Submit password reset
    const resetButton = screen.getByRole('button', { name: 'Send reset link' });
    fireEvent.click(resetButton);

    // Check if password reset was requested
    await waitFor(() => {
      expect(mockUseAuth().requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });

    // Check if success message is shown
    expect(mockToastFn).toHaveBeenCalledWith({
      title: 'Reset link sent',
      description: 'Check your email for a link to reset your password.',
    });
  });

  it('handles social login buttons', async () => {
    render(<LoginPage />);

    // Test Google login
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(googleButton);
    expect(mockSignIn).toHaveBeenCalledWith({
      provider: 'google',
      callbackUrl: '/dashboard',
    });

    // Test GitHub login
    const githubButton = screen.getByRole('button', { name: /continue with github/i });
    fireEvent.click(githubButton);
    expect(mockSignIn).toHaveBeenCalledWith({
      provider: 'github',
      callbackUrl: '/dashboard',
    });
  });

  it('shows error when password reset fails', async () => {
    const errorMessage = 'Failed to send reset email';
    mockUseAuth().requestPasswordReset.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    // Go to password reset
    fireEvent.click(screen.getByText('Forgot password?'));

    // Submit form
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    // Check error handling
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith({
        title: 'Failed to send reset link',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('handles remember me functionality', async () => {
    mockSignIn.mockResolvedValueOnce({});

    render(<LoginPage />);

    // Fill in the form with remember me checked
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });

    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByLabelText('Remember me'));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check if signIn was called with rememberMe: true
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });

  it('shows validation errors for invalid email format', async () => {
    render(<LoginPage />);

    // Enter invalid email
    fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: 'invalid-email' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check for validation error
    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('shows validation errors for short password', async () => {
    render(<LoginPage />);

    // Enter short password
    fireEvent.input(screen.getByLabelText('Password'), {
      target: { value: '12345' }, // Less than 6 characters
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    // Check for validation error
    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
  });

  it('navigates to register page when clicking sign up link', () => {
    render(<LoginPage />);

    // Click on sign up link
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    fireEvent.click(signUpLink);

    // Check if navigation occurred
    expect(mockPush).toHaveBeenCalledWith('/auth/register');
  });

  it('shows error when auth check fails', () => {
    const errorMessage = 'Failed to check authentication status';
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: new Error(errorMessage),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
    });

    render(<LoginPage />);

    // Check if error toast was shown
    expect(mockToastFn).toHaveBeenCalledWith({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  });
});
