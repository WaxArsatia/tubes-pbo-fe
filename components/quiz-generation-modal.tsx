"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import apiClient from "@/lib/api-client";
import type { ApiResponse } from "@/lib/types/api.types";
import type { QuizDifficulty, QuestionCount, QuizGenerationRequest, Quiz } from "@/lib/types/quiz.types";

interface QuizGenerationModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly summaryId: number;
}

export function QuizGenerationModal({
  open,
  onOpenChange,
  summaryId,
}: Readonly<QuizGenerationModalProps>) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [numberOfQuestions, setNumberOfQuestions] = useState<QuestionCount>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const requestData: QuizGenerationRequest = {
        summaryId,
        difficulty,
        numberOfQuestions,
      };

      const response = await apiClient.post<ApiResponse<Quiz>>(
        "/quizzes",
        requestData
      );

      const quiz = response.data.data;
      toast.success("Quiz generated successfully!");
      
      // Close modal and navigate to quiz taking page
      onOpenChange(false);
      router.push(`/quizzes/${quiz.id}/take`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      
      if (error.response?.status === 404) {
        toast.error("Summary not found");
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Invalid quiz parameters");
      } else if (error.response?.status === 500) {
        toast.error("AI generation failed. Please try again.");
      } else {
        toast.error("Failed to generate quiz");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Quiz</DialogTitle>
          <DialogDescription>
            Create a quiz from this summary. Select the difficulty level and
            number of questions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Difficulty Select */}
          <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as QuizDifficulty)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Questions */}
          <div className="grid gap-2">
            <Label>Number of Questions</Label>
            <div className="flex gap-3">
              {[5, 10, 15].map((count) => (
                <label
                  key={count}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="questionCount"
                    value={count}
                    checked={numberOfQuestions === count}
                    onChange={() => setNumberOfQuestions(count as QuestionCount)}
                    className="w-4 h-4 cursor-pointer text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm">{count} questions</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              "Generate Quiz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
