/**
 * Summary/PDF Types
 * Based on docs/02_SUMMARIZATION_FRONTEND.md
 */

export type AiProvider = 'gemini';

/**
 * Summary entity (full detail)
 */
export interface Summary {
  id: number;
  originalFilename: string;
  summaryText: string;
  aiProvider: AiProvider;
  aiModel: string;
  createdAt: string;
}

/**
 * Summary list item (without summary text)
 */
export interface SummaryListItem {
  id: number;
  originalFilename: string;
  aiProvider: AiProvider;
  createdAt: string;
}

/**
 * Summary upload/create response
 */
export interface SummaryResponse {
  id: number;
  originalFilename: string;
  summaryText: string;
  aiProvider: AiProvider;
  aiModel: string;
  createdAt: string;
}
