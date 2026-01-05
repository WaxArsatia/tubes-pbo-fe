"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import apiClient from "@/lib/api-client";
import type { QuizDetail, QuizAnswer } from "@/lib/types/quiz.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { toast } from "sonner";

export default function TakeQuizPage() {
	const params = useParams();
	const router = useRouter();
	const quizId = params.id as string;

	const [quiz, setQuiz] = useState<QuizDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchQuizDetail = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await apiClient.get<ApiResponse<QuizDetail>>(
				`/quizzes/${quizId}`,
			);

			const quizData = response.data.data;

			// Check if quiz is already submitted
			if (quizData.isSubmitted) {
				// Redirect to results page
				router.replace(`/quizzes/${quizId}/results`);
				return;
			}

			setQuiz(quizData);
		} catch (err) {
			const error = err as {
				response?: { data?: { message?: string }; status?: number };
			};
			if (error.response?.status === 404) {
				setError("Quiz not found");
			} else if (error.response?.status === 403) {
				setError("Access denied");
			} else {
				setError(error.response?.data?.message || "Failed to load quiz");
			}
		} finally {
			setIsLoading(false);
		}
	}, [quizId, router]);

	useEffect(() => {
		fetchQuizDetail();
	}, [fetchQuizDetail]);

	const handleAnswerChange = (questionId: string, answer: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: answer,
		}));
	};

	const handleNext = () => {
		if (quiz && currentQuestionIndex < quiz.numberOfQuestions - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	};

	const handleSubmitAttempt = () => {
		if (!quiz || !quiz.questions) return;

		// Check if all questions are answered
		const unansweredCount = quiz.questions.filter((q) => !answers[q.id]).length;

		if (unansweredCount > 0) {
			toast.error(
				`Please answer all questions. ${unansweredCount} question(s) remaining.`,
			);
			return;
		}

		setShowSubmitDialog(true);
	};

	const handleSubmit = async () => {
		if (!quiz) return;

		try {
			setIsSubmitting(true);

			const submissionData: { answers: QuizAnswer[] } = {
				answers: Object.entries(answers).map(([questionId, answer]) => ({
					questionId,
					answer,
				})),
			};

			await apiClient.post(`/quizzes/${quizId}/submit`, submissionData);

			toast.success("Quiz submitted successfully!");
			setShowSubmitDialog(false);

			// Navigate to results page
			router.push(`/quizzes/${quizId}/results`);
		} catch (err) {
			const error = err as {
				response?: { data?: { message?: string }; status?: number };
			};
			toast.error(error.response?.data?.message || "Failed to submit quiz");
			setShowSubmitDialog(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner className="h-8 w-8" />
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

	if (!quiz || !quiz.questions || quiz.questions.length === 0) {
		return (
			<div className="container max-w-4xl py-8">
				<ErrorMessage message="No questions available" />
			</div>
		);
	}

	const currentQuestion = quiz.questions[currentQuestionIndex];
	const progress = ((currentQuestionIndex + 1) / quiz.numberOfQuestions) * 100;
	const answeredCount = Object.keys(answers).length;

	return (
		<div className="container max-w-4xl py-8">
			{/* Header */}
			<div className="mb-6">
				<Link href={`/summaries/${quiz.summaryId}`}>
					<Button variant="ghost" className="gap-2 mb-4">
						<ArrowLeft className="w-4 h-4" />
						Back to Summary
					</Button>
				</Link>
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Quiz</h1>
					<Badge variant="secondary">
						{quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
					</Badge>
				</div>
			</div>

			{/* Progress Bar */}
			<Card className="mb-6">
				<CardContent className="pt-6">
					<div className="space-y-2">
						<div className="flex justify-between text-sm text-muted-foreground">
							<span>
								Question {currentQuestionIndex + 1} of {quiz.numberOfQuestions}
							</span>
							<span>
								{answeredCount} / {quiz.numberOfQuestions} answered
							</span>
						</div>
						<Progress value={progress} />
					</div>
				</CardContent>
			</Card>

			{/* Question Card */}
			<Card>
				<CardHeader>
					<h2 className="text-xl font-semibold leading-relaxed">
						{currentQuestion.question}
					</h2>
				</CardHeader>
				<CardContent className="space-y-3">
					{/* Options */}
					{currentQuestion.options.map((option, index) => {
						const optionLabel = String.fromCodePoint(65 + index); // A, B, C, D
						const isSelected = answers[currentQuestion.id] === option;

						return (
							<label
								key={`${currentQuestion.id}-${optionLabel}`}
								aria-label={`Option ${optionLabel}: ${option}`}
								className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
							>
								<input
									type="radio"
									name={`question-${currentQuestion.id}`}
									value={option}
									checked={isSelected}
									onChange={() =>
										handleAnswerChange(currentQuestion.id, option)
									}
									className="mt-1 h-4 w-4 cursor-pointer text-primary focus:ring-2 focus:ring-ring"
								/>
								<div className="flex-1">
									<span className="font-semibold text-primary mr-2">
										{optionLabel}.
									</span>
									<span>{option}</span>
								</div>
							</label>
						);
					})}
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex items-center justify-between mt-6">
				<Button
					variant="outline"
					onClick={handlePrevious}
					disabled={currentQuestionIndex === 0}
					className="gap-2"
				>
					<ArrowLeft className="w-4 h-4" />
					Previous
				</Button>

				<div className="flex gap-2">
					{currentQuestionIndex === quiz.numberOfQuestions - 1 ? (
						<Button onClick={handleSubmitAttempt} className="gap-2">
							<CheckCircle className="w-4 h-4" />
							Submit Quiz
						</Button>
					) : (
						<Button onClick={handleNext} className="gap-2">
							Next
							<ArrowRight className="w-4 h-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Submit Confirmation Dialog */}
			<AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to submit your quiz? You cannot change your
							answers after submission. You have answered {answeredCount} out of{" "}
							{quiz.numberOfQuestions} questions.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{isSubmitting ? "Submitting..." : "Submit"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
