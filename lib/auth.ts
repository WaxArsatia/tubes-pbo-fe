/**
 * Authentication Utilities
 * Token and user data management per docs/01_AUTHENTICATION_FRONTEND.md
 */

import type { User } from './types/auth.types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

// Token expiry: 24 hours in milliseconds
const TOKEN_EXPIRY_DURATION = 24 * 60 * 60 * 1000;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return globalThis.window !== undefined && typeof localStorage !== 'undefined';
}

/**
 * Store authentication token with 24h expiry
 */
export function setAuthToken(token: string): void {
  if (!isBrowser()) return;
  const expiryTime = new Date(Date.now() + TOKEN_EXPIRY_DURATION);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
}

/**
 * Get authentication token if valid (not expired)
 * Returns null if expired or not present
 */
export function getAuthToken(): string | null {
  if (!isBrowser()) return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return token; // If no expiry set, return token anyway

  const expiryTime = new Date(expiry).getTime();
  const currentTime = Date.now();

  // Check if token is expired
  if (currentTime >= expiryTime) {
    clearAuth();
    return null;
  }

  return token;
}

/**
 * Check if token is expiring soon (within 5 minutes)
 * Used to show warning before session expires
 */
export function isTokenExpiringSoon(): boolean {
  if (!isBrowser()) return false;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return false;

  const expiryTime = new Date(expiry).getTime();
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return expiryTime - currentTime <= fiveMinutes && expiryTime > currentTime;
}

/**
 * Get time remaining until token expiry in milliseconds
 */
export function getTokenTimeRemaining(): number | null {
  if (!isBrowser()) return null;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return null;

  const expiryTime = new Date(expiry).getTime();
  const currentTime = Date.now();
  const remaining = expiryTime - currentTime;

  return Math.max(0, remaining);
}

/**
 * Store user data in localStorage
 */
export function setUserData(user: User): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user data from localStorage
 * Returns null if not present
 */
export function getUserData(): User | null {
  if (!isBrowser()) return null;
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

/**
 * Update user data in localStorage
 * Merges with existing data
 */
export function updateUserData(updates: Partial<User>): void {
  if (!isBrowser()) return;
  const currentUser = getUserData();
  if (!currentUser) return;

  const updatedUser = { ...currentUser, ...updates };
  setUserData(updatedUser);
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Check if current user is admin
 */
export function isAdmin(): boolean {
  const user = getUserData();
  return user?.role === 'ADMIN';
}

/**
 * Check if current user has USER role
 */
export function isUser(): boolean {
  const user = getUserData();
  return user?.role === 'USER';
}

/**
 * Get current user role
 */
export function getUserRole(): 'USER' | 'ADMIN' | null {
  const user = getUserData();
  return user?.role ?? null;
}
