"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/empty-state";
import { ErrorMessage } from "@/components/error-message";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import apiClient from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { PaginatedResponse } from "@/lib/types/api.types";
import type { QuizListItem } from "@/lib/types/quiz.types";

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<PaginatedResponse<QuizListItem>>(
        `/quizzes?page=${page}&size=10`
      );

      setQuizzes(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      setError(error.response?.data?.message || "Failed to load quizzes");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleQuizClick = (quiz: QuizListItem) => {
    if (quiz.isSubmitted) {
      router.push(`/quizzes/${quiz.id}/results`);
    } else {
      router.push(`/quizzes/${quiz.id}/take`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-primary text-primary-foreground";
      case "medium":
        return "bg-accent text-accent-foreground";
      case "hard":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <PageHeader
          title="Quizzes"
          description="View and manage your quiz attempts"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((key) => (
            <Card key={key} className="border-border">
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-6xl py-8">
        <PageHeader
          title="Quizzes"
          description="View and manage your quiz attempts"
        />
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <PageHeader
        title="Quizzes"
        description="View and manage your quiz attempts"
      />

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          description="Generate a quiz from a summary to get started."
          action={
            <Link href="/summaries">
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                View Summaries
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Quiz Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {quizzes.map((quiz) => {
              const scorePercentage = quiz.isSubmitted && quiz.correctAnswers
                ? Math.round((quiz.correctAnswers / quiz.numberOfQuestions) * 100)
                : null;

              return (
                <Card
                  key={quiz.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => handleQuizClick(quiz)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate mb-1">
                            {quiz.originalFilename}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.numberOfQuestions} questions
                          </p>
                        </div>
                        <Badge
                          className={getDifficultyColor(quiz.difficulty)}
                        >
                          {quiz.difficulty.charAt(0).toUpperCase() +
                            quiz.difficulty.slice(1)}
                        </Badge>
                      </div>

                      {/* Status and Score */}
                      <div className="flex items-center gap-2">
                        {quiz.isSubmitted ? (
                          <>
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </Badge>
                            {scorePercentage !== null && (
                              <Badge
                                className={
                                  scorePercentage >= 70
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-destructive text-destructive-foreground"
                                }
                              >
                                {quiz.correctAnswers}/{quiz.numberOfQuestions} ({scorePercentage}%)
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </Badge>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                        <span>Created: {formatDate(quiz.createdAt)}</span>
                        {quiz.submittedAt && (
                          <span>Submitted: {formatDate(quiz.submittedAt)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 0) setPage(page - 1);
                    }}
                    aria-disabled={page === 0}
                    className={page === 0 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(i);
                        }}
                        isActive={page === i}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages - 1) setPage(page + 1);
                    }}
                    aria-disabled={page === totalPages - 1}
                    className={page === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* Stats */}
          <div className="text-center text-sm text-muted-foreground mt-6">
            Showing {quizzes.length} of {totalElements} quiz{totalElements === 1 ? "" : "es"}
          </div>
        </>
      )}
    </div>
  );
}
