"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

/**
 * Delete Confirmation Dialog Component
 * Based on docs/05_HISTORY_FRONTEND.md
 * 
 * Props:
 * - summaryId: ID of the summary to delete
 * - summaryFilename: Filename to display in confirmation message
 * - open: Control dialog visibility
 * - onOpenChange: Callback when dialog visibility changes
 * - onSuccess: Callback when deletion is successful
 */

interface DeleteConfirmationDialogProps {
  summaryId: number;
  summaryFilename: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteConfirmationDialog({
  summaryId,
  summaryFilename,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<DeleteConfirmationDialogProps>) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      await apiClient.delete(`/history/${summaryId}`);

      toast.success("Summary deleted successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      
      if (axiosError.response?.status === 404) {
        toast.error("Summary not found. It may have already been deleted.");
      } else if (axiosError.response?.status === 403) {
        toast.error("Access denied. You do not have permission to delete this summary.");
      } else {
        toast.error(axiosError.response?.data?.message || "Failed to delete summary. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Summary
          </AlertDialogTitle>
          <AlertDialogDescription>
            Delete <strong>{summaryFilename}</strong> permanently? This will
            delete the summary and original PDF file. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
