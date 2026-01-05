/**
 * Generic API Response Types
 * Based on docs/00_GENERAL_FRONTEND_API.md
 */

/**
 * Standard API response wrapper for single resources
 */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * API Error response
 */
export interface ApiError {
  status: number;
  error: string;
  message: string;
}
