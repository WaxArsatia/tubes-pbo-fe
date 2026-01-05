/**
 * Validation Utilities
 * Client-side validation functions per API requirements
 */

/**
 * Validate email format (RFC 5322 basic pattern)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password requirements
 * Minimum 8 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validate name field
 * Required, max 255 characters
 */
export function validateName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 255;
}

/**
 * Validate file size
 * @param file - File object to validate
 * @param maxMB - Maximum size in megabytes
 */
export function validateFileSize(file: File, maxMB: number): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Validate file type
 * @param file - File object to validate
 * @param allowedTypes - Array of allowed MIME types
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate PDF file (type and size)
 * Max 10MB as per backend requirements
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!validateFileType(file, ['application/pdf'])) {
    return { valid: false, error: 'Only PDF files are allowed' };
  }

  // Check file size (10MB max)
  if (!validateFileSize(file, 10)) {
    return { valid: false, error: 'File size must not exceed 10MB' };
  }

  return { valid: true };
}

/**
 * Get validation error message for email
 */
export function getEmailError(email: string): string | null {
  if (!email) return 'Email is required';
  if (!validateEmail(email)) return 'Please enter a valid email address';
  return null;
}

/**
 * Get validation error message for password
 */
export function getPasswordError(password: string): string | null {
  if (!password) return 'Password is required';
  if (!validatePassword(password)) return 'Password must be at least 8 characters';
  return null;
}

/**
 * Get validation error message for name
 */
export function getNameError(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.length > 255) return 'Name must not exceed 255 characters';
  return null;
}

/**
 * Check if passwords match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Get password match error message
 */
export function getPasswordMatchError(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return 'Please confirm your password';
  if (!validatePasswordMatch(password, confirmPassword)) return 'Passwords do not match';
  return null;
}
