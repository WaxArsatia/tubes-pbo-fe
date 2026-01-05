"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import { EmptyState } from "@/components/empty-state";
import apiClient from "@/lib/api-client";
import type { SummaryListItem } from "@/lib/types/summary.types";
import type { PaginatedResponse } from "@/lib/types/api.types";
import { formatDate } from "@/lib/format";
import { FileText, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UploadModal } from "@/components/upload-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentSummaries, setRecentSummaries] = useState<SummaryListItem[]>([]);
  const [totalSummaries, setTotalSummaries] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch recent summaries (first 5)
        const response = await apiClient.get<PaginatedResponse<SummaryListItem>>(
          "/summaries?page=0&size=5"
        );
        
        setRecentSummaries(response.data.content);
        setTotalSummaries(response.data.totalElements);
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s what&apos;s happening with your summaries and quizzes.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Summaries"
          value={totalSummaries}
          icon={<FileText className="h-5 w-5" />}
          description="PDFs processed"
        />
        <StatCard
          title="Recent Activity"
          value={recentSummaries.length}
          icon={<TrendingUp className="h-5 w-5" />}
          description="Last 5 summaries"
        />
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <Button
              onClick={() => setShowUploadModal(true)}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent summaries */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Summaries</CardTitle>
          <Link href="/summaries">
            <Button variant="ghost">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentSummaries.length === 0 ? (
            <EmptyState
              title="No summaries yet"
              description="Upload a PDF to get started with AI-powered summarization."
              action={
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload PDF
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {recentSummaries.map((summary) => (
                <Link
                  key={summary.id}
                  href={`/summaries/${summary.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {summary.originalFilename}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(summary.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {summary.aiProvider}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/history">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View History
            </Button>
          </Link>
          <Link href="/quizzes">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              My Quizzes
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} />
    </div>
  );
}
