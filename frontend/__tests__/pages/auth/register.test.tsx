import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import RegisterPage from '@/pages/auth/register';
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

describe('RegisterPage', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();
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
      signUp: mockSignUp,
      isAuthenticated: false,
      loading: false,
      user: null,
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
    });

    mockToast.mockImplementation(() => ({
      toast: mockToastFn,
      dismiss: jest.fn(),
      toasts: [],
    }));
  });

  it('renders registration form', () => {
    render(<RegisterPage />);
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Check for validation errors
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(await screen.findByText('Last name is required')).toBeInTheDocument();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
    expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('validates password match', async () => {
    render(<RegisterPage />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    fireEvent.input(passwordInput, { target: { value: 'password123' } });
    fireEvent.input(confirmPasswordInput, { target: { value: 'different' } });
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    mockSignUp.mockResolvedValueOnce({});
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    
    fireEvent.input(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    
    fireEvent.input(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.input(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check if signUp was called with correct data
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Check if success toast was shown
    expect(mockToastFn).toHaveBeenCalledWith({
      title: 'Account created',
      description: 'Your account has been created successfully. Please check your email to verify your account.',
    });

    // Check if redirect happened
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('handles registration error', async () => {
    const errorMessage = 'Email already in use';
    mockSignUp.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    
    fireEvent.input(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    
    fireEvent.input(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.input(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Check if error toast was shown
    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    });
  });

  it('redirects to login page if user clicks sign in link', () => {
    render(<RegisterPage />);
    
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    fireEvent.click(signInLink);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to dashboard if already authenticated', () => {
    mockUseAuth.mockReturnValue({
      signUp: mockSignUp,
      isAuthenticated: true,
      loading: false,
      user: { id: '1', email: 'test@example.com' },
      error: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      hasRole: jest.fn(),
    });
    
    render(<RegisterPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('shows loading state when submitting', async () => {
    // Don't resolve the promise immediately
    let resolveSignUp: (value: unknown) => void;
    mockSignUp.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
    );
    
    render(<RegisterPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    
    fireEvent.input(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    
    fireEvent.input(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.input(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    // Check if button is in loading state
    const button = screen.getByRole('button', { name: /create account/i });
    expect(button).toBeDisabled();
    
    // Resolve the promise
    await waitFor(() => {
      resolveSignUp!({});
    });
  });
});
