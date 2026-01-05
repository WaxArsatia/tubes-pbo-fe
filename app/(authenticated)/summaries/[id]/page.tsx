"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import { QuizGenerationModal } from "@/components/quiz-generation-modal";
import apiClient from "@/lib/api-client";
import type { SummaryResponse } from "@/lib/types/summary.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Download, Trash2, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SummaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const summaryId = params.id as string;

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const fetchSummaryDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<SummaryResponse>>(
        `/summaries/${summaryId}`
      );

      setSummary(response.data.data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 404) {
        setError("Summary not found");
      } else if (error.response?.status === 403) {
        setError("Access denied");
      } else {
        setError(error.response?.data?.message || "Failed to load summary");
      }
    } finally {
      setIsLoading(false);
    }
  }, [summaryId]);

  useEffect(() => {
    fetchSummaryDetail();
  }, [fetchSummaryDetail]);

  const handleDownloadSummary = async () => {
    try {
      const response = await apiClient.get(`/history/${summaryId}/download`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replaceAll('"', "")
        : `${summary?.originalFilename}_summary.pdf`;

      const url = globalThis.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      toast.success("Summary downloaded successfully");
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        toast.error("File not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
      } else {
        toast.error("Failed to download summary");
      }
    }
  };

  const handleDownloadOriginal = async () => {
    try {
      const response = await apiClient.get(
        `/history/${summaryId}/download-original`,
        {
          responseType: "blob",
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replaceAll('"', "")
        : summary?.originalFilename || "document.pdf";

      const url = globalThis.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      toast.success("Original PDF downloaded successfully");
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        toast.error("File not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
      } else {
        toast.error("Failed to download original PDF");
      }
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/history/${summaryId}`);
      
      toast.success("Summary deleted successfully");
      router.push("/summaries");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 404) {
        toast.error("Summary not found");
      } else if (error.response?.status === 403) {
        toast.error("Access denied");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete summary");
      }
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div>
        <Link href="/summaries">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Summaries
          </Button>
        </Link>
        <ErrorMessage message={error || "Summary not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link href="/summaries">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Summaries
          </Button>
        </Link>
      </div>

      {/* Summary Card */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-primary shrink-0" />
                <h1 className="text-2xl font-bold text-foreground">
                  {summary.originalFilename}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  {summary.aiProvider}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {summary.aiModel}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(summary.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Text */}
          <div className="prose-sm prose max-w-none dark:prose-invert">
            <div className="leading-relaxed whitespace-pre-wrap text-foreground">
              {summary.summaryText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <Button onClick={() => setShowQuizModal(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Quiz
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadSummary}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Summary
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadOriginal}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Original
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Generation Modal */}
      {summary && (
        <QuizGenerationModal
          open={showQuizModal}
          onOpenChange={setShowQuizModal}
          summaryId={summary.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Summary?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{summary.originalFilename}&quot;? 
              This will permanently delete the summary and the original PDF file. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
