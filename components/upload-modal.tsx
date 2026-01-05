"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { Progress } from "@/components/ui/progress";
import { createUploadClient } from "@/lib/api-client";
import type { SummaryResponse } from "@/lib/types/summary.types";
import type { ApiResponse } from "@/lib/types/api.types";
import { validateFileSize, validateFileType } from "@/lib/validators";
import { AlertCircle, Loader2 } from "lucide-react";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: Readonly<UploadModalProps>) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    // Client-side validation
    if (!validateFileType(selectedFile, ["application/pdf", ".pdf"])) {
      setError("Only PDF files are allowed");
      return;
    }

    if (!validateFileSize(selectedFile, 10)) {
      setError("File size must not exceed 10MB");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadClient = createUploadClient();
      const response = await uploadClient.post<ApiResponse<SummaryResponse>>(
        "/summaries",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(percentCompleted);
          },
        }
      );

      // Upload complete, now processing
      setIsUploading(false);
      setIsProcessing(true);

      // Navigate to the summary detail page
      const summaryId = response.data.data.id;
      router.push(`/summaries/${summaryId}`);
      onOpenChange(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      setIsUploading(false);
      setIsProcessing(false);
      
      if (error.response?.status === 400) {
        setError(error.response.data?.message || "Invalid file type or size");
      } else if (error.response?.status === 413) {
        setError("File too large. Maximum size is 10MB");
      } else if (error.response?.status === 500) {
        setError("AI generation failed. Please try again");
      } else {
        setError("Upload failed. Please try again");
      }
    }
  };

  const handleClose = () => {
    if (!isUploading && !isProcessing) {
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Upload PDF for Summarization</DialogTitle>
          <DialogDescription>
            Select a PDF file to generate an AI-powered summary. Maximum file size is 10MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FileUpload
            onFileSelect={handleFileSelect}
            disabled={isUploading || isProcessing}
          />

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {(isUploading || isProcessing) && (
            <div className="space-y-2">
              <Progress value={isUploading ? uploadProgress : 100} />
              <p className="text-sm text-muted-foreground text-center">
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Processing your PDF with AI..."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isProcessing}
          >
            {(isUploading || isProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading && "Uploading..."}
            {isProcessing && "Processing..."}
            {!isUploading && !isProcessing && "Upload & Summarize"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
