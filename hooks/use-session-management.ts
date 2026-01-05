/**
 * Session Management Hook
 * Handles token expiry checks and warnings
 * Based on Phase 7.4 requirements
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getAuthToken, getTokenTimeRemaining, isTokenExpiringSoon } from '@/lib/auth';
import { useAuth } from './use-auth';

const CHECK_INTERVAL = 60 * 1000; // Check every minute
const WARNING_SHOWN_KEY = 'sessionWarningShown';

export function useSessionManagement() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [warningShown, setWarningShown] = useState(false);

  /**
   * Check if session is expiring soon and show warning
   */
  const checkSessionExpiry = useCallback(() => {
    if (!isAuthenticated) return;

    const token = getAuthToken();
    
    // Token expired, redirect to login
    if (!token) {
      toast.error('Your session has expired. Please login again.');
      logout();
      router.push('/login');
      return;
    }

    // Check if token is expiring soon (within 5 minutes)
    if (isTokenExpiringSoon() && !warningShown) {
      const timeRemaining = getTokenTimeRemaining();
      if (timeRemaining !== null) {
        const minutesRemaining = Math.floor(timeRemaining / (60 * 1000));
        toast.warning(
          `Your session will expire in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'}. Please save your work.`,
          {
            duration: 10000,
            id: 'session-warning',
          }
        );
        setWarningShown(true);
        sessionStorage.setItem(WARNING_SHOWN_KEY, 'true');
      }
    }
  }, [isAuthenticated, logout, router, warningShown]);

  /**
   * Periodic token validation (every minute)
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Set up periodic checks
    const intervalId = setInterval(() => {
      checkSessionExpiry();
    }, CHECK_INTERVAL);

    // Initial check after a short delay to avoid sync setState
    const timeoutId = setTimeout(() => {
      checkSessionExpiry();
    }, 100);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, checkSessionExpiry]);

  /**
   * Check token validity on route change
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAuthToken();
    if (!token) {
      toast.error('Your session has expired. Please login again.');
      logout();
      router.push('/login');
    }
  }, [isAuthenticated, logout, router]);

  /**
   * Initialize warning state from session storage
   */
  useEffect(() => {
    const initWarningState = () => {
      const warningStatus = sessionStorage.getItem(WARNING_SHOWN_KEY);
      if (warningStatus === 'true') {
        setWarningShown(true);
      }
    };

    // Delay initialization to avoid sync setState
    const timeoutId = setTimeout(initWarningState, 0);

    return () => {
      clearTimeout(timeoutId);
      // Clear warning flag on unmount (e.g., logout)
      if (!isAuthenticated) {
        sessionStorage.removeItem(WARNING_SHOWN_KEY);
      }
    };
  }, [isAuthenticated]);

  return {
    checkSessionExpiry,
  };
}
