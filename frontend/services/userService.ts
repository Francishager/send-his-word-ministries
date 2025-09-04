import { AuthUser, RegisterData, PasswordResetData } from '@/types/user';
import { get, post, put, del } from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const userService = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return post<AuthResponse>('/auth/login/', credentials);
  },

  register: async (userData: RegisterData): Promise<AuthUser> => {
    return post<AuthUser>('/auth/register/', userData);
  },

  verifyEmail: async (key: string): Promise<{ detail: string }> => {
    return post<{ detail: string }>('/auth/verify-email/', { key });
  },

  requestVerificationEmail: async (email: string): Promise<{ detail: string }> => {
    return post<{ detail: string }>('/auth/verification/resend/', { email });
  },

  forgotPassword: async (email: string): Promise<{ detail: string }> => {
    return post<{ detail: string }>('/auth/password/reset/', { email });
  },

  resetPassword: async (data: PasswordResetData): Promise<{ detail: string }> => {
    return post<{ detail: string }>('/auth/password/reset/confirm/', data);
  },

  // User Profile
  getCurrentUser: async (): Promise<AuthUser> => {
    return get<AuthUser>('/auth/me/');
  },

  updateProfile: async (userData: Partial<AuthUser>): Promise<AuthUser> => {
    return put<AuthUser>('/auth/me/', userData);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ detail: string }> => {
    return post<{ detail: string }>('/auth/password/change/', data);
  },

  // Admin Only
  getAllUsers: async (): Promise<AuthUser[]> => {
    return get<AuthUser[]>('/auth/users/');
  },

  getUserById: async (userId: string): Promise<AuthUser> => {
    return get<AuthUser>(`/auth/users/${userId}/`);
  },

  updateUser: async (userId: string, userData: Partial<AuthUser>): Promise<AuthUser> => {
    return put<AuthUser>(`/auth/users/${userId}/`, userData);
  },

  deleteUser: async (userId: string): Promise<{ detail: string }> => {
    return del<{ detail: string }>(`/auth/users/${userId}/`);
  },

  // User Roles
  updateUserRoles: async (userId: string, roles: string[]): Promise<AuthUser> => {
    return post<AuthUser>(`/auth/users/${userId}/roles/`, { roles });
  },
};
