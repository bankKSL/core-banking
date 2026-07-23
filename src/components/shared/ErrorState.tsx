import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          <RotateCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
};

export { ErrorState };
export type { ErrorStateProps };
