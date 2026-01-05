/**
 * Admin Users List Page
 * User management with table, pagination, search and filters
 * Based on docs/06_ADMIN_FRONTEND.md
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { ErrorMessage } from '@/components/error-message';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateUserModal } from '@/components/admin/create-user-modal';
import { EditUserModal } from '@/components/admin/edit-user-modal';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { UserListItem } from '@/lib/types/admin.types';
import type { PaginatedResponse } from '@/lib/types/api.types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  
  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteUserEmail, setDeleteUserEmail] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUserData, setEditUserData] = useState<UserListItem | null>(null);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '10',
      });
      
      const response = await apiClient.get<PaginatedResponse<UserListItem>>(
        `/admin/users?${params.toString()}`
      );
      
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      void fetchUsers();
    }
  }, [isAuthenticated, user, fetchUsers]);

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    try {
      await apiClient.delete(`/admin/users/${deleteUserId}`);
      toast.success('User deleted successfully');
      setDeleteUserId(null);
      setDeleteUserEmail('');
      void fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // Filter users client-side
  const filteredUsers = users.filter((usr) => {
    const matchesSearch =
      searchQuery === '' ||
      usr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || usr.role === roleFilter;
    const matchesVerified =
      verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && usr.isVerified) ||
      (verifiedFilter === 'unverified' && !usr.isVerified);
    
    return matchesSearch && matchesRole && matchesVerified;
  });

  // Render loading state with skeletons
  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="User Management"
            description="Manage user accounts and permissions"
          />
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="w-40 h-10" />
          <Skeleton className="w-40 h-10" />
        </div>
        <div className="border rounded-md border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map(() => (
                <TableRow key={crypto.randomUUID()}>
                  <TableCell><Skeleton className="w-12 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-48 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-16 h-6" /></TableCell>
                  <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-24 h-4" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="w-8 h-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <ErrorMessage message={error} />
        <Button onClick={() => void fetchUsers()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <PageHeader 
          title="User Management" 
          description={`${totalElements} total users`}
        />
        <Button onClick={() => setShowCreateModal(true)}>
          Create User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <Input
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value || 'all')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={verifiedFilter} onValueChange={(value) => setVerifiedFilter(value || 'all')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          {/* Responsive table wrapper */}
          <div className="overflow-hidden border rounded-md border-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-16">ID</TableHead>
                    <TableHead className="min-w-52">Email</TableHead>
                    <TableHead className="min-w-36">Name</TableHead>
                    <TableHead className="min-w-24">Role</TableHead>
                    <TableHead className="min-w-28">Verified</TableHead>
                    <TableHead className="min-w-30">Created</TableHead>
                    <TableHead className="text-right min-w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredUsers.map((usr) => (
                  <TableRow key={usr.id}>
                    <TableCell className="font-medium">{usr.id}</TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>{usr.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={usr.role === 'ADMIN' ? 'destructive' : 'default'}
                      >
                        {usr.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usr.isVerified ? (
                        <Badge variant="default" className="bg-green-600">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(usr.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${usr.id}`)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditUserId(usr.id);
                              setEditUserData(usr);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setDeleteUserId(usr.id);
                              setDeleteUserEmail(usr.email);
                            }}
                            disabled={usr.id === user.id}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteUserId && (
        <AlertDialog
          open={!!deleteUserId}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteUserId(null);
              setDeleteUserEmail('');
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete user &ldquo;{deleteUserEmail}&rdquo;? 
                This will permanently delete all their data including summaries, 
                quizzes, and sessions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteUserId(null);
                  setDeleteUserEmail('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleDeleteUser()}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => void fetchUsers()}
      />

      {/* Edit User Modal */}
      {editUserId && editUserData && (
        <EditUserModal
          open={!!editUserId}
          onOpenChange={(open) => {
            if (!open) {
              setEditUserId(null);
              setEditUserData(null);
            }
          }}
          onSuccess={() => void fetchUsers()}
          userId={editUserId}
          initialData={{
            email: editUserData.email,
            name: editUserData.name,
            role: editUserData.role,
            isVerified: editUserData.isVerified,
          }}
        />
      )}
    </div>
  );
}
