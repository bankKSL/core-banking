import React, { useState } from "react";
import { Play, Loader2, CalendarClock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExecutePeriodicAccrual } from "@/features/accounting";
import { currentDate } from "@/lib/utils";

const PeriodicAccrualPage: React.FC = () => {
  const executeMutation = useExecutePeriodicAccrual();
  const [tillDate, setTillDate] = useState(currentDate());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleExecute = async () => {
    if (!tillDate) {
      setError("Till date is required.");
      return;
    }
    setError("");
    setSuccess(false);
    await executeMutation.mutateAsync({
      tillDate: currentDate(tillDate),
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    });
    setSuccess(true);
  };

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title="Periodic Accrual Accounting"
        description="Accrue loan income up to a specified date for all active loans."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" /> Execute Accrual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Accrue Till Date *</label>
            <Input type="date" value={tillDate} onChange={(e) => setTillDate(e.target.value)} />
            <p className="text-xs text-gray-500">
              Accrual entries will be created for all active loans up to and including this date.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Accrual executed successfully.
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Executing…
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Execute Accrual
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeriodicAccrualPage;
