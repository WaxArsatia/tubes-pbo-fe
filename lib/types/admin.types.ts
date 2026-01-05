/**
 * Admin Types
 * Based on docs/06_ADMIN_FRONTEND.md
 */

import type { UserRole } from './auth.types';

/**
 * Activity log item
 */
export interface ActivityLogItem {
  userId: number;
  userName: string;
  userEmail?: string;
  originalFilename?: string;
  aiProvider?: string;
  action?: string;
  timestamp?: string;
  createdAt?: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalUsers: number;
  totalSummaries: number;
  totalActiveUsers: number;
  summariesToday: number;
  summariesThisWeek: number;
  summariesThisMonth: number;
  usersByRole: Record<UserRole, number>;
  aiProviderUsage: Record<string, number>;
  recentActivity: ActivityLogItem[];
}

/**
 * Admin user entity (with stats)
 */
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  totalSummaries?: number;
}

/**
 * User list item (for admin user management)
 */
export interface UserListItem {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

/**
 * Create user request (admin only)
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Update user request (admin only)
 */
export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
  isVerified?: boolean;
}
