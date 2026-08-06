import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkStore } from "@/store/network";

/**
 * Global handler for explicit network / timeout errors (doc §20).
 * Shows a distinguishable banner with a Retry action so users can recover
 * without a full reload. HTTP error responses are handled elsewhere.
 */
export function NetworkErrorBanner() {
  const error = useNetworkStore((s) => s.error);
  const clear = useNetworkStore((s) => s.clearNetworkError);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => clear(error.id), 8000);
    return () => clearTimeout(t);
  }, [error, clear]);

  if (!error) return null;

  const handleRetry = () => {
    clear(error.id);
    queryClient.refetchQueries({ type: "active" });
  };

  return (
    <div className="fixed inset-x-0 top-0 z-90 flex justify-center px-4 pt-3">
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm shadow-lg dark:border-amber-800 dark:bg-gray-900">
        <WifiOff className="h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="font-medium text-amber-700 dark:text-amber-300">
            {error.kind === "timeout" ? "Request timed out" : "Connection problem"}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{error.message}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
        <Button size="sm" variant="ghost" onClick={() => clear(error.id)} aria-label="Dismiss">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default NetworkErrorBanner;
