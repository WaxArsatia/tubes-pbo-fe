import apiClient from './api-client';

/**
 * Download Utility
 * Based on docs/05_HISTORY_FRONTEND.md
 * 
 * Handles file downloads with proper filename extraction and error handling
 */

/**
 * Download a file from the given endpoint
 * @param endpoint - API endpoint to download from (e.g., '/history/1/download')
 * @param fallbackFilename - Optional fallback filename if header extraction fails
 * @throws Error with message for 404, 403, or other errors
 */
export async function downloadFile(
  endpoint: string,
  fallbackFilename: string = 'download.pdf'
): Promise<void> {
  try {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = fallbackFilename;

    if (contentDisposition) {
      // Parse filename from header: attachment; filename="document.pdf"
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }
    }

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    link.remove();
    globalThis.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    // Handle specific error cases
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    if (axiosError.response?.status === 404) {
      throw new Error('File not found. It may have been deleted.');
    } else if (axiosError.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to download this file.');
    } else {
      throw new Error(axiosError.response?.data?.message || 'Failed to download file. Please try again.');
    }
  }
}
