import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AuthUser, UserRole } from '@/types/user';
import { getSession, signIn, signOut as nextAuthSignOut, SignInResponse } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<SignInResponse | undefined>;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  refreshToken: () => Promise<{ accessToken: string; refreshToken: string } | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user has the required role(s)
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return requiredRoles.some(role => user.roles.includes(role));
  }, [user]);

  // Refresh the access token using the refresh token
  const refreshToken = useCallback(async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
    try {
      const session = await getSession();
      if (!session?.refreshToken) return null;

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || session.refreshToken,
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      await handleSignOut();
      return null;
    }
  }, []);

  // Handle sign in
  const handleSignIn = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Get the updated session
      const session = await getSession();
      if (session?.user) {
        const userData = await apiRequest<AuthUser>('/auth/me', { auth: true });
        setUser(userData);
        toast.success('Successfully signed in!');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      setUser(null);
      toast.success('Successfully signed out');
      router.push('/auth/login');
    } catch (err) {
      const errorMessage = 'Failed to sign out. Please try again.';
      console.error(errorMessage, err);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Refresh the current session
  const refreshSession = useCallback(async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        try {
          const userData = await apiRequest<AuthUser>('/auth/me', { auth: true });
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        await refreshSession();
      } catch (err) {
        console.error('Session check failed:', err);
        setUser(null);
      }
    };

    checkSession();
  }, [refreshSession]);

  // Handle token refresh on interval
  useEffect(() => {
    if (!user) return;

    const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes
    const interval = setInterval(() => {
      refreshToken();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // Handle session changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'nextauth.message') {
        refreshSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshSession]);

  const value = {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasRole,
    isAuthenticated: !!user,
    refreshSession,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher Order Component for protecting routes
export function withAuth(Component: React.ComponentType<any>, allowedRoles?: UserRole[]) {
  return function WithAuth(props: any) {
    const { user, isAuthenticated, loading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        // Redirect to login if not authenticated
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      } else if (!loading && isAuthenticated && allowedRoles && !hasRole(allowedRoles)) {
        // Redirect to unauthorized if user doesn't have required role
        router.push('/unauthorized');
      }
    }, [isAuthenticated, loading, router, hasRole]);

    if (loading || !isAuthenticated || (allowedRoles && !hasRole(allowedRoles))) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook to check if a user has a specific role
export function useRole(requiredRole: UserRole | UserRole[]) {
  const { hasRole } = useAuth();
  return hasRole(requiredRole);
}
