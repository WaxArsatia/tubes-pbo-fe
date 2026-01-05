/**
 * Error Message Component
 * Display error messages consistently
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

const ErrorMessageComponent = ({
  title = 'Error',
  message,
  retry,
  className,
}: Readonly<ErrorMessageProps>) => {
  return (
    <div
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
      role="alert"
    >
      <h4 className="text-sm font-semibold text-destructive mb-1">{title}</h4>
      <p className="text-sm text-destructive/90">{message}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-3 text-sm font-medium text-destructive hover:text-destructive/80 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
};

export const ErrorMessage = memo(ErrorMessageComponent);
