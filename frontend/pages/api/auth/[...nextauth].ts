import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { User } from '@/types/user';

// API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: User;
    accessToken: string;
    refreshToken: string;
  }
}

// Extend the JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    user: User;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch(`${API_URL}/users/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'checkbox' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/users/auth/login/`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          const user = await res.json();

          if (res.ok && user) {
            // Normalize shape from backend { user, access, refresh }
            const core = (user && user.user) ? user.user : user;
            return {
              ...core,
              accessToken: user.access || core.accessToken,
              refreshToken: user.refresh || core.refreshToken,
              expiresIn: user.expires_in || core.expiresIn || 3600,
            } as any;
          }

          // Return null if user data could not be retrieved
          return null;
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const u: any = user as any;
        const core = (u && u.user) ? u.user : u;
        return {
          ...token,
          user: core,
          accessToken: u.accessToken ?? u.access ?? token.accessToken,
          refreshToken: u.refreshToken ?? u.refresh ?? token.refreshToken,
          accessTokenExpires: Date.now() + ((u.expiresIn ?? 3600) * 1000),
        } as any;
      }

      // Return previous token if the access token has not expired
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token as JWT);
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as User;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
