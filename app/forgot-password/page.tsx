"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import apiClient from "@/lib/api-client";
import { getEmailError } from "@/lib/validators";
import type { ForgotPasswordRequest } from "@/lib/types/auth.types";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError("");
    setSuccessMessage("");
  };

  const validateForm = (): boolean => {
    const error = getEmailError(email);
    setEmailError(error || "");
    return !error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const requestData: ForgotPasswordRequest = { email };
      
      await apiClient.post("/auth/forgot-password", requestData);
      
      // Always show success message for security
      setSuccessMessage(
        "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox."
      );
      
      // Clear form
      setEmail("");
    } catch {
      // For security reasons, always show success message even if there's an error
      // This prevents email enumeration attacks
      setSuccessMessage(
        "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox."
      );
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
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          {successMessage && (
            <div className="bg-primary/10 border border-primary text-primary rounded-lg p-4">
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field data-invalid={!!emailError} className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="text-center text-sm space-y-2">
            <div>
              <Link
                href="/login"
                className="text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
            <div>
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <Link
                href="/register"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
