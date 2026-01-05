"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { LoadingSpinner } from "@/components/loading-spinner";
import apiClient from "@/lib/api-client";
import { clearAuth } from "@/lib/auth";
import { getPasswordError, getPasswordMatchError } from "@/lib/validators";
import type { ResetPasswordRequest } from "@/lib/types/auth.types";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (resetToken) {
      setToken(resetToken);
    } else {
      setApiError("Reset token is missing. Please check your email link.");
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateForm = (): boolean => {
    const newErrors = {
      newPassword: getPasswordError(formData.newPassword) || "",
      confirmPassword: getPasswordMatchError(formData.newPassword, formData.confirmPassword) || "",
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!token) {
      setApiError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const requestData: ResetPasswordRequest = {
        token,
        newPassword: formData.newPassword,
      };

      const response = await apiClient.post("/auth/reset-password", requestData);
      
      setSuccessMessage(
        response.data.message || "Password reset successful! Logging you out..."
      );

      // Clear any existing auth data (invalidates sessions)
      clearAuth();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        
        if (axiosError.response?.status === 400) {
          setApiError(
            axiosError.response?.data?.message || 
            "Invalid or expired reset token. Please request a new password reset."
          );
        } else if (axiosError.response?.data?.message) {
          setApiError(axiosError.response.data.message);
        } else {
          setApiError("Password reset failed. Please try again.");
        }
      } else {
        setApiError("Password reset failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {successMessage && (
            <div className="bg-primary/10 border border-primary text-primary rounded-lg p-4">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {apiError && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
              <p className="text-sm">{apiError}</p>
            </div>
          )}

{!token && !apiError && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {token && !successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field data-invalid={!!errors.newPassword} className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </Field>

              <Field data-invalid={!!errors.confirmPassword} className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </Field>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Resetting password..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link
              href="/login"
              className="text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
