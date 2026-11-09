export type UserRole = 'Admin' | 'Staff';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}
