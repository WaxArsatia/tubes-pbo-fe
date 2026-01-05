"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import apiClient from "@/lib/api-client";
import type { QuizDetail } from "@/lib/types/quiz.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, FileText } from "lucide-react";
import Link from "next/link";

export default function QuizResultsPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizResults = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<QuizDetail>>(
        `/quizzes/${quizId}`
      );

      const quizData = response.data.data;

      // Check if quiz is not submitted yet
      if (!quizData.isSubmitted) {
        // Redirect to take page
        router.replace(`/quizzes/${quizId}/take`);
        return;
      }

      setQuiz(quizData);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 404) {
        setError("Quiz not found");
      } else if (error.response?.status === 403) {
        setError("Access denied");
      } else {
        setError(error.response?.data?.message || "Failed to load quiz results");
      }
    } finally {
      setIsLoading(false);
    }
  }, [quizId, router]);

  useEffect(() => {
    fetchQuizResults();
  }, [fetchQuizResults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <ErrorMessage message={error} />
        <div className="mt-4">
          <Link href="/quizzes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Quizzes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz || !quiz.results || quiz.results.length === 0 || quiz.correctAnswers === undefined) {
    return (
      <div className="container max-w-4xl py-8">
        <ErrorMessage message="No results available" />
      </div>
    );
  }

  const scorePercentage = (quiz.correctAnswers / quiz.numberOfQuestions) * 100;
  const isPassed = scorePercentage >= 70;

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/quizzes">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Quizzes
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quiz Results</h1>
          <Badge variant="secondary">
            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Score Summary Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            {/* Score Display */}
            <div>
              <div className="mb-2 text-6xl font-bold">
                {Math.round(scorePercentage)}%
              </div>
              <div className="text-xl text-muted-foreground">
                {quiz.correctAnswers} out of {quiz.numberOfQuestions} correct
              </div>
            </div>

            {/* Pass/Fail Badge */}
            <div>
              {isPassed ? (
                <Badge className="px-4 py-2 text-lg bg-primary text-primary-foreground">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Passed
                </Badge>
              ) : (
                <Badge className="px-4 py-2 text-lg bg-destructive text-destructive-foreground">
                  <XCircle className="w-5 h-5 mr-2" />
                  Failed
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Link href={`/summaries/${quiz.summaryId}`}>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Return to Summary
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => router.push(`/summaries/${quiz.summaryId}`)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Generate New Quiz
              </Button>
              <Link href="/quizzes">
                <Button variant="outline">View Quiz History</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <div className="space-y-4">
        <h2 className="mb-4 text-2xl font-semibold">Question Review</h2>

        {quiz.results.map((result, index) => (
          <Card
            key={result.questionId}
            className={`border-2 ${
              result.isCorrect
                ? "border-primary/30 bg-primary/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <h3 className="flex-1 text-lg font-medium">
                  <span className="mr-2 text-muted-foreground">
                    {index + 1}.
                  </span>
                  {result.question}
                </h3>
                {result.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* User Answer */}
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold">Your Answer:</span>
                <span
                  className={`font-medium ${
                    result.isCorrect ? "text-primary" : "text-destructive"
                  }`}
                >
                  {result.userAnswer}
                </span>
              </div>

              {/* Correct Answer (if wrong) */}
              {!result.isCorrect && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold">Correct Answer:</span>
                  <span className="font-medium text-primary">
                    {result.correctAnswer}
                  </span>
                </div>
              )}

              {/* Explanation */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Explanation:
                  </span>{" "}
                  {result.explanation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
