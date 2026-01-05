/**
 * Authentication Types
 * Based on docs/01_AUTHENTICATION_FRONTEND.md
 */

export type UserRole = 'USER' | 'ADMIN';

/**
 * User entity
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isVerified?: boolean;
  createdAt?: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
