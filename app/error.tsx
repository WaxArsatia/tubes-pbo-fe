'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong!
              </h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred
              </p>
            </div>
          </div>
          
          {error.message && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <p className="text-sm text-foreground font-mono wrap-break-word">
                {error.message}
              </p>
            </div>
          )}

          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={reset}
            className="w-full sm:w-auto"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              globalThis.window.location.href = '/dashboard';
            }}
            className="w-full sm:w-auto"
          >
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
