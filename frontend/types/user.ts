export enum UserRole {
  ADMIN = 'ADMIN',
  MINISTER = 'MINISTER',
  ATTENDEE = 'ATTENDEE',
  GUEST = 'GUEST',
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  roles: UserRole[];
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends UserProfile {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  children?: NavItem[];
}
