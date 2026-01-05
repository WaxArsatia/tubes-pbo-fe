"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorMessage } from "@/components/error-message";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import apiClient from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import type { SummaryListItem } from "@/lib/types/summary.types";
import type { PaginatedResponse } from "@/lib/types/api.types";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { FileText, MoreVertical, Eye, Download, Trash2 } from "lucide-react";

/**
 * History Page Component
 * Based on docs/05_HISTORY_FRONTEND.md
 * 
 * Displays paginated list of summaries with actions:
 * - View Details (navigate to summary detail)
 * - Download Summary PDF
 * - Download Original PDF
 * - Delete (with confirmation)
 */

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SummaryListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<{
    id: number;
    filename: string;
  } | null>(null);

  // Download loading state (track by summaryId)
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  /**
   * Fetch history items from API
   */
  const fetchHistory = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<PaginatedResponse<SummaryListItem>>(
        `/history?page=${page}&size=${PAGE_SIZE}`
      );

      setSummaries(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, fetchHistory]);

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    globalThis.window?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle download (summary or original PDF)
   */
  const handleDownload = async (summaryId: number, type: "summary" | "original") => {
    try {
      setDownloadingIds((prev) => new Set(prev).add(summaryId));

      const endpoint =
        type === "summary"
          ? `/history/${summaryId}/download`
          : `/history/${summaryId}/download-original`;

      await downloadFile(endpoint);
      toast.success(
        type === "summary" ? "Summary downloaded successfully" : "Original PDF downloaded successfully"
      );
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(summaryId);
        return next;
      });
    }
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (summaryId: number, filename: string) => {
    setSelectedSummary({ id: summaryId, filename });
    setDeleteDialogOpen(true);
  };

  /**
   * Handle successful deletion
   */
  const handleDeleteSuccess = () => {
    // Refresh the current page
    fetchHistory(currentPage);
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="History"
          description="View and manage your past summaries and files"
        />
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="View and manage your past summaries and files"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div key={key} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && summaries.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No history yet"
          description="Upload a PDF to get started and view your summaries here."
          action={
            <Link href="/summaries">
              <Button>Go to Summaries</Button>
            </Link>
          }
        />
      ) : null}

      {!isLoading && summaries.length > 0 ? (
        <>
          {/* Responsive table wrapper with horizontal scroll on mobile */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-50">Filename</TableHead>
                    <TableHead className="min-w-30">AI Provider</TableHead>
                    <TableHead className="min-w-30">Created</TableHead>
                    <TableHead className="text-right min-w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {summaries.map((summary) => (
                  <TableRow key={summary.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {summary.originalFilename}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{summary.aiProvider}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(summary.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={downloadingIds.has(summary.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => globalThis.window?.location.assign(`/summaries/${summary.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDownload(summary.id, "summary")}
                            disabled={downloadingIds.has(summary.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Summary PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(summary.id, "original")}
                            disabled={downloadingIds.has(summary.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Original PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteClick(summary.id, summary.originalFilename)
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * PAGE_SIZE + 1} to{" "}
                {Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} of{" "}
                {totalElements} items
              </p>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-disabled={currentPage === 0}
                      className={
                        currentPage === 0
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 0 ||
                      page === totalPages - 1 ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <span className="px-4">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-disabled={currentPage === totalPages - 1}
                      className={
                        currentPage === totalPages - 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : null}

      {/* Delete Confirmation Dialog */}
      {selectedSummary && (
        <DeleteConfirmationDialog
          summaryId={selectedSummary.id}
          summaryFilename={selectedSummary.filename}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
