/**
 * Quiz Types
 * Based on docs/03_QUIZ_FRONTEND.md
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionCount = 5 | 10 | 15;

/**
 * Quiz question (without correct answer)
 */
export interface Question {
  id: string;
  question: string;
  options: string[];
}

/**
 * Quiz entity (not submitted)
 */
export interface Quiz {
  id: number;
  summaryId: number;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  isSubmitted: boolean;
  createdAt: string;
  questions: Question[];
}

/**
 * Quiz submission answer
 */
export interface QuizAnswer {
  questionId: string;
  answer: string;
}

/**
 * Quiz submission request
 */
export interface QuizSubmission {
  answers: QuizAnswer[];
}

/**
 * Quiz result question detail
 */
export interface QuizResultQuestion {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

/**
 * Quiz result (submitted)
 */
export interface QuizResult {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  results: QuizResultQuestion[];
}

/**
 * Quiz detail (can be submitted or not)
 */
export interface QuizDetail {
  id: number;
  summaryId: number;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  isSubmitted: boolean;
  createdAt: string;
  correctAnswers?: number;
  submittedAt?: string;
  questions?: Question[];
  results?: QuizResultQuestion[];
}

/**
 * Quiz list item
 */
export interface QuizListItem {
  id: number;
  summaryId: number;
  originalFilename: string;
  difficulty: QuizDifficulty;
  numberOfQuestions: number;
  isSubmitted: boolean;
  correctAnswers?: number;
  createdAt: string;
  submittedAt?: string;
}

/**
 * Quiz generation request
 */
export interface QuizGenerationRequest {
  summaryId: number;
  difficulty: QuizDifficulty;
  numberOfQuestions: QuestionCount;
}
