import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { signIn, signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react');
const mockSignIn = signIn as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockGetSession = getSession as jest.Mock;

// Mock the API
jest.mock('@/lib/api');
import { get } from '@/lib/api';
const mockGet = get as jest.Mock;

// Test component that uses the auth context
const TestComponent = () => {
  const {
    user,
    loading,
    error,
    signIn: login,
    signOut: logout,
    hasRole,
    isAuthenticated,
    refreshSession,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not loading'}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'Yes' : 'No'}</div>
      <div data-testid="isAdmin">
        {hasRole(UserRole.ADMIN) ? 'Admin' : 'Not Admin'}
      </div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Sign In
      </button>
      <button onClick={() => logout()}>Sign Out</button>
      <button onClick={() => refreshSession()}>Refresh Session</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock session
    mockGetSession.mockResolvedValue({
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [UserRole.ATTENDEE],
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      },
      expires: '2024-01-01T00:00:00.000Z',
    });
    
    // Default mock API response
    mockGet.mockResolvedValue({
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: [UserRole.ATTENDEE],
    });
  });

  it('renders with initial state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('No');

    // Wait for initial session check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
  });

  it('handles successful sign in', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: true });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    // Click sign in button
    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      signInButton.click();
    });

    // Check that signIn was called with correct credentials
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password',
      redirect: false,
    });

    // Should be authenticated after successful sign in
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Yes');
    });
  });

  it('handles sign out', async () => {
    mockSignOut.mockResolvedValueOnce({});
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    // Click sign out button
    const signOutButton = screen.getByText('Sign Out');
    await act(async () => {
      signOutButton.click();
    });

    // Check that signOut was called
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });

    // Should not be authenticated after sign out
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('No');
    });
  });

  it('checks user roles correctly', async () => {
    // Set up a user with ADMIN role
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: [UserRole.ADMIN],
      },
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('Yes');
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('Admin');
    });
  });

  it('handles session refresh', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    // Click refresh session button
    const refreshButton = screen.getByText('Refresh Session');
    await act(async () => {
      refreshButton.click();
    });

    // Check that getSession was called
    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it('handles sign in error', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    // Click sign in button
    const signInButton = screen.getByText('Sign In');
    await act(async () => {
      signInButton.click();
    });

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });
});
