'use client';

/**
 * Route Guards / Higher-Order Components (HOCs)
 * Protect routes based on authentication and role
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * withAuth HOC
 * Redirect to login if not authenticated
 * Usage: export default withAuth(MyComponent);
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * withAdmin HOC
 * Redirect to dashboard if not admin (403)
 * Usage: export default withAdmin(AdminComponent);
 */
export function withAdmin<P extends object>(Component: React.ComponentType<P>) {
  return function AdminComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push('/login');
        } else if (user?.role !== 'ADMIN') {
          router.push('/dashboard'); // Redirect non-admin to user dashboard
        }
      }
    }, [user, isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated || user?.role !== 'ADMIN') {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * withPublicRoute HOC
 * Redirect authenticated users to dashboard
 * Usage: export default withPublicRoute(LoginPage);
 */
export function withPublicRoute<P extends object>(Component: React.ComponentType<P>) {
  return function PublicComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        // Redirect based on user role
        if (user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    }, [user, isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    if (isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
