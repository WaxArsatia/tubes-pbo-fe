/**
 * Admin User Detail Page
 * View user details with edit and delete actions
 * Based on docs/06_ADMIN_FRONTEND.md
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { ErrorMessage } from '@/components/error-message';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditUserModal } from '@/components/admin/edit-user-modal';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { AdminUser } from '@/lib/types/admin.types';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (currentUser?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, currentUser, router]);

  // Fetch user details
  const fetchUser = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ message: string; data: AdminUser }>(
        `/admin/users/${userId}`
      );
      
      setUser(response.data.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        setError('User not found');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load user details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'ADMIN') {
      void fetchUser();
    }
  }, [isAuthenticated, currentUser, fetchUser]);

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (!isAuthenticated || currentUser?.role !== 'ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} />
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader 
          title="User Details" 
          description={`User ID: ${user.id}`}
        />
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
          >
            Back to Users
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
          >
            Edit User
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={user.id === currentUser.id}
          >
            Delete User
          </Button>
        </div>
      </div>

      {/* User Information Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Basic Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm text-foreground">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm text-foreground">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'}>
                  {user.role}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                Verification Status
              </dt>
              <dd>
                {user.isVerified ? (
                  <Badge variant="default" className="bg-green-600">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary">Unverified</Badge>
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Account Information
          </h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                Account Created
              </dt>
              <dd className="text-sm text-foreground">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                Total Summaries
              </dt>
              <dd className="text-sm text-foreground">
                {user.totalSummaries === undefined ? 'N/A' : user.totalSummaries}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user &ldquo;{user.email}&rdquo;? 
              This will permanently delete all their data including {user.totalSummaries || 0} summaries, 
              quizzes, and sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteUser()}
            >
              Delete User
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Modal */}
      {user && (
        <EditUserModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={() => void fetchUser()}
          userId={user.id}
          initialData={{
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
          }}
        />
      )}
    </div>
  );
}
