import apiClient from "@/lib/api-client";
import { clearAuth } from "@/lib/auth";

/**
 * Handles user logout
 * - Calls backend logout endpoint to invalidate session
 * - Clears local authentication data (token, user)
 * - Returns redirect URL for the caller to navigate
 */
export async function handleLogout(): Promise<string> {
  try {
    // Call backend to invalidate session
    await apiClient.post("/auth/logout");
  } catch (error) {
    // Continue with local cleanup even if API call fails
    console.error("Logout API call failed:", error);
  } finally {
    // Always clear local auth data
    clearAuth();
  }

  // Return the login URL for redirection
  return "/login";
}
