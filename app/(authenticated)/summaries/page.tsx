"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { UploadModal } from "@/components/upload-modal";
import apiClient from "@/lib/api-client";
import type { SummaryListItem } from "@/lib/types/summary.types";
import type { PaginatedResponse } from "@/lib/types/api.types";
import { formatDate } from "@/lib/format";
import { FileText, Plus } from "lucide-react";

const PAGE_SIZE = 10;

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchSummaries = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<PaginatedResponse<SummaryListItem>>(
        `/summaries?page=${page}&size=${PAGE_SIZE}`
      );

      setSummaries(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load summaries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries(currentPage);
  }, [currentPage, fetchSummaries]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Summaries"
          description="View and manage your AI-generated PDF summaries"
          action={
            <Button onClick={() => setShowUploadModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload PDF
            </Button>
          }
        />
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Summaries"
        description="View and manage your AI-generated PDF summaries"
        action={
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload PDF
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
            <Card key={key} className="border-border">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {!isLoading && summaries.length === 0 && (
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
      )}
      
      {!isLoading && summaries.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summaries.map((summary) => (
              <Link key={summary.id} href={`/summaries/${summary.id}`}>
                <Card className="h-full border-border hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <h3 className="font-medium text-foreground truncate">
                          {summary.originalFilename}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-accent text-accent-foreground"
                      >
                        {summary.aiProvider}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(summary.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) handlePageChange(currentPage - 1);
                      }}
                      aria-disabled={currentPage === 0}
                      className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages - 1) handlePageChange(currentPage + 1);
                      }}
                      aria-disabled={currentPage === totalPages - 1}
                      className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Showing {summaries.length} of {totalElements} summaries
          </div>
        </>
      )}

      <UploadModal open={showUploadModal} onOpenChange={setShowUploadModal} />
    </div>
  );
}
