/**
 * Admin Activity Log Page
 * Shows all summaries with user info (activity log)
 * Based on docs/06_ADMIN_FRONTEND.md
 * 
 * Note: Backend returns all summaries with user info, not generic action types
 */

'use client';

// Force dynamic rendering to avoid localStorage issues during build
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { ErrorMessage } from '@/components/error-message';
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
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { ActivityLogItem } from '@/lib/types/admin.types';
import type { PaginatedResponse } from '@/lib/types/api.types';

export default function AdminActivityPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Fetch activity log
  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '50', // Larger page size for activity log
      });
      
      const response = await apiClient.get<PaginatedResponse<ActivityLogItem>>(
        `/admin/activity?${params.toString()}`
      );
      
      setActivities(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      void fetchActivity();
    }
  }, [isAuthenticated, user, fetchActivity]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      void fetchActivity();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchActivity]);

  // Filter activities client-side
  const filteredActivities = activities.filter((activity) => {
    if (searchQuery === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      activity.userName?.toLowerCase().includes(query) ||
      activity.userEmail?.toLowerCase().includes(query) ||
      activity.originalFilename?.toLowerCase().includes(query)
    );
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  if (isLoading && activities.length === 0) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Activity Log"
            description="Loading activities..."
          />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-40 h-10" />
            <Skeleton className="w-20 h-10" />
          </div>
        </div>
        <Skeleton className="w-full h-10 mb-4" />
        <div className="border rounded-md border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>AI Provider</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map(() => (
                <TableRow key={crypto.randomUUID()}>
                  <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-48 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-40 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-16 h-6" /></TableCell>
                  <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <ErrorMessage message={error} />
        <Button onClick={() => void fetchActivity()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <PageHeader 
          title="Activity Log" 
          description={`${totalElements} total activities`}
        />
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-border"
            />
            <span>Auto-refresh (30s)</span>
          </label>
          <Button onClick={() => void fetchActivity()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by user name, email, or filename..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Activity Table */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          title="No activity found"
          description="Try adjusting your search or check back later"
        />
      ) : (
        <>
          {/* Responsive table wrapper */}
          <div className="overflow-hidden border rounded-md border-border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-36">User Name</TableHead>
                    <TableHead className="min-w-52">User Email</TableHead>
                    <TableHead className="min-w-44">Filename</TableHead>
                    <TableHead className="min-w-28">AI Provider</TableHead>
                    <TableHead className="min-w-30">Date</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredActivities.map((activity, index) => (
                  <TableRow
                    key={`${activity.userId}-${activity.createdAt || activity.timestamp}-${index}`}
                    className="cursor-pointer hover:bg-muted/50"
                    data-user-id={activity.userId}
                  >
                    <TableCell 
                      className="font-medium"
                      onClick={() => {
                        // Navigate to user detail
                        if (activity.userId) {
                          router.push(`/admin/users/${activity.userId}`);
                        }
                      }}
                    >
                      {activity.userName || 'Unknown'}
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground"
                      onClick={() => {
                        // Navigate to user detail
                        if (activity.userId) {
                          router.push(`/admin/users/${activity.userId}`);
                        }
                      }}
                    >
                      {activity.userEmail || 'N/A'}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        // Navigate to user detail
                        if (activity.userId) {
                          router.push(`/admin/users/${activity.userId}`);
                        }
                      }}
                    >
                      {activity.originalFilename || 'N/A'}
                    </TableCell>
                    <TableCell
                      onClick={() => {
                        // Navigate to user detail
                        if (activity.userId) {
                          router.push(`/admin/users/${activity.userId}`);
                        }
                      }}
                    >
                      {activity.aiProvider ? (
                        <Badge variant="secondary">{activity.aiProvider}</Badge>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell 
                      className="text-muted-foreground"
                      onClick={() => {
                        // Navigate to user detail
                        if (activity.userId) {
                          router.push(`/admin/users/${activity.userId}`);
                        }
                      }}
                    >
                      {formatDate(activity.createdAt || activity.timestamp || '')}
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
    </div>
  );
}
