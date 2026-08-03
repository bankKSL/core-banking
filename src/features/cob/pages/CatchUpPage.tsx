import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOldestCOBClosed, useIsCatchUpRunning, useExecuteCatchUp } from "../hooks/useCob";

const CatchUpPage: FC = () => {
  const navigate = useNavigate();
  const { data: oldestCob, isLoading: oldestLoading, refetch: refetchOldest } = useOldestCOBClosed();
  const { data: catchUpStatus, isLoading: statusLoading, refetch: refetchStatus } = useIsCatchUpRunning();
  const catchUpMutation = useExecuteCatchUp();
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleExecute = async () => {
    const result = await catchUpMutation.mutateAsync();
    if (result === 200) setLastResult("All loans are already caught up.");
    else if (result === 202) setLastResult("Catch-up has been started.");
    else setLastResult("Catch-up is already running or failed.");
    refetchOldest();
    refetchStatus();
  };

  const isRunning = catchUpStatus?.isCatchUpRunning;

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title="COB Catch-Up"
        description="Trigger and monitor end-of-day catch-up processing for loan accounts"
        actions={
          <Button variant="outline" onClick={() => navigate("/cob/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Oldest COB Processed Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oldestLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : oldestCob ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Business Date</p>
                    <p className="text-sm font-medium">{oldestCob.cobBusinessDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Processed Date</p>
                    <p className="text-sm font-medium">{oldestCob.cobProcessedDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Loans Behind</p>
                  <p className="text-sm font-medium">{oldestCob.loanIds.length} loan(s)</p>
                </div>
                {oldestCob.loanIds.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Loan IDs: {oldestCob.loanIds.slice(0, 5).join(", ")}
                    {oldestCob.loanIds.length > 5 && ` +${oldestCob.loanIds.length - 5} more`}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
                All loans are up to date
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => refetchOldest()} className="mt-2">
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              Catch-Up Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isRunning ? "warning" : "success"}>{isRunning ? "Running" : "Idle"}</Badge>
                </div>
                {catchUpStatus?.processingDate && (
                  <div>
                    <p className="text-xs text-gray-500">Processing Date</p>
                    <p className="text-sm font-medium">{catchUpStatus.processingDate}</p>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => refetchStatus()}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execute Catch-Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            This will run COB processing for all loans that are behind, starting from the oldest unprocessed business
            date. The process runs one business date at a time.
          </p>

          {lastResult && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm dark:bg-blue-900/20 dark:text-blue-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {lastResult}
            </div>
          )}

          <Button
            onClick={handleExecute}
            disabled={catchUpMutation.isPending || isRunning}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            {catchUpMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? "Already Running..." : "Start Catch-Up"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CatchUpPage;
