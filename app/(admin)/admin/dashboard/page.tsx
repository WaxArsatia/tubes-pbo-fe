/**
 * Admin Dashboard Page
 * Displays statistics, charts, and recent activity
 * Based on docs/06_ADMIN_FRONTEND.md
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { PageHeader } from '@/components/page-header';
import { ErrorMessage } from '@/components/error-message';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { DashboardStats } from '@/lib/types/admin.types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ message: string; data: DashboardStats }>('/admin/dashboard');
      setStats(response.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      void fetchStats();
    }
  }, [isAuthenticated, user, fetchStats]);

  // Prepare chart data
  const usersByRoleData = stats
    ? Object.entries(stats.usersByRole).map(([role, count]) => ({
        name: role,
        value: count,
      }))
    : [];

  const aiProviderData = stats
    ? Object.entries(stats.aiProviderUsage).map(([provider, count]) => ({
        name: provider,
        value: count,
      }))
    : [];

  // Chart colors using CSS variables
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  if (!isAuthenticated || user?.role !== 'ADMIN') {
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
        <Button onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader 
          title="Admin Dashboard" 
          description="System overview and statistics"
        />
        <Button onClick={fetchStats} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Primary Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered users"
        />
        <StatCard
          title="Total Summaries"
          value={stats.totalSummaries}
          description="Documents processed"
        />
        <StatCard
          title="Active Users"
          value={stats.totalActiveUsers}
          description="Users active today"
        />
      </div>

      {/* Time-based Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Today"
          value={stats.summariesToday}
          description="Summaries generated today"
        />
        <StatCard
          title="This Week"
          value={stats.summariesThisWeek}
          description="Summaries this week"
        />
        <StatCard
          title="This Month"
          value={stats.summariesThisMonth}
          description="Summaries this month"
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Users by Role Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Users by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usersByRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {usersByRoleData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Provider Usage Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">AI Provider Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiProviderData}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" name="Summaries" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h3>
        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={`${activity.userId}-${activity.timestamp || activity.createdAt}`}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.action || 'Generated summary'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activity.timestamp || activity.createdAt || '')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        )}
      </Card>
    </div>
  );
}
