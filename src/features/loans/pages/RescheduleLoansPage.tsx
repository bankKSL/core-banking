import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRescheduleRequests, useRescheduleRequestCommand } from "../hooks/useRescheduleLoans";
import { RESCHEDULE_STATUS_CONFIG, RESCHEDULE_STATUS_ID_MAP } from "../constants/transactions";
import type { LoanRescheduleRequest } from "../types/loan";
import { formatFineractDate } from "../utils/format";

const today = () => new Date().toISOString().split("T")[0];

const resolveStatus = (req: LoanRescheduleRequest): string => {
  if (req.status?.value) return req.status.value;
  if (req.status?.code) return req.status.code;
  if (req.status?.id != null) return RESCHEDULE_STATUS_ID_MAP[req.status.id] ?? "Unknown";
  return "Unknown";
};

const RescheduleLoansPage: FC = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading, isError, error, refetch } = useRescheduleRequests();
  const commandMutation = useRescheduleRequestCommand();

  const [action, setAction] = useState<{ req: LoanRescheduleRequest; command: "approve" | "reject" } | null>(null);
  const [dateInput, setDateInput] = useState(today());

  const openAction = (req: LoanRescheduleRequest, command: "approve" | "reject") => {
    setAction({ req, command });
    setDateInput(today());
  };

  const handleAction = async () => {
    if (!action) return;
    await commandMutation.mutateAsync({
      scheduleId: action.req.id,
      command: action.command,
      payload: action.command === "approve" ? { approvedOnDate: dateInput } : { rejectedOnDate: dateInput },
    });
    setAction(null);
  };

  const columns: ColumnDef<LoanRescheduleRequest>[] = [
    {
      key: "loan",
      header: "Loan",
      cell: (r) => (
        <button
          className="text-sm font-medium text-[#D32F2F] hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/loans/view/${r.loanId}`);
          }}
        >
          {r.loanAccountNo ?? `Loan #${r.loanId}`}
        </button>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (r) => <span className="text-sm">{r.clientName ?? "—"}</span>,
    },
    {
      key: "reason",
      header: "Reason",
      cell: (r) => <span className="text-sm">{r.rescheduleReasonName ?? r.rescheduleReasonCodeValue?.name ?? "—"}</span>,
    },
    {
      key: "fromDate",
      header: "Reschedule From",
      cell: (r) => <span className="text-sm">{formatFineractDate(r.rescheduleFromDate)}</span>,
    },
    {
      key: "submitted",
      header: "Submitted On",
      cell: (r) => <span className="text-sm">{formatFineractDate(r.submittedOnDate)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const status = resolveStatus(r);
        const cfg = RESCHEDULE_STATUS_CONFIG[status];
        return <StatusBadge status={cfg?.variant ?? "default"} label={cfg?.label ?? status} size="sm" />;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => {
        const isPending = r.status?.id === 100 || /pending/i.test(resolveStatus(r));
        if (!isPending) return null;
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600"
              onClick={(e) => {
                e.stopPropagation();
                openAction(r, "approve");
              }}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                openAction(r, "reject");
              }}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reschedule Requests" description="Loan rescheduling requests" />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Failed to load reschedule requests. {error?.message ?? "Please try again."}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reschedule Requests"
        description="Review and manage loan rescheduling requests"
        actions={
          <Button onClick={() => navigate("/loans/rescheduling/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={requests} emptyState={{ message: "No reschedule requests found." }} />
          )}
        </CardContent>
      </Card>

      {/* Approve / reject dialog */}
      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.command === "approve" ? "Approve Reschedule" : "Reject Reschedule"}</DialogTitle>
            <DialogDescription>
              {action?.command === "approve"
                ? `Approving will recalculate the repayment schedule of loan ${action?.req.loanAccountNo ?? `#${action?.req.loanId}`}.`
                : `Reject the reschedule request for loan ${action?.req.loanAccountNo ?? `#${action?.req.loanId}`}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="actionDate">{action?.command === "approve" ? "Approved On" : "Rejected On"}</Label>
              <Input id="actionDate" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAction(null)} disabled={commandMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant={action?.command === "reject" ? "destructive" : "default"}
                onClick={handleAction}
                disabled={commandMutation.isPending}
              >
                {commandMutation.isPending ? "Processing..." : action?.command === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescheduleLoansPage;
