import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRescheduleRequests, useRescheduleRequestCommand } from "../hooks/useRescheduleLoans";
import { RESCHEDULE_STATUS_CONFIG, RESCHEDULE_STATUS_ID_MAP } from "../constants/transactions";
import type { LoanRescheduleRequest } from "../types/loan";
import { formatDate } from "../utils/format";

const today = () => new Date().toISOString().split("T")[0];

const resolveStatus = (req: LoanRescheduleRequest): string => {
  if (req.status?.value) return req.status.value;
  if (req.status?.code) return req.status.code;
  if (req.status?.id != null) return RESCHEDULE_STATUS_ID_MAP[req.status.id] ?? "Unknown";
  return "Unknown";
};

interface ActionFormValues {
  actionDate: string;
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

const RescheduleLoansPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Backend whitelists `{all, approve, pending, reject}` — map the UI
  // "approved" filter to `approve` and omit the param for all/rejected.
  const apiCommand =
    statusFilter === "approved" ? "approve" : statusFilter === "pending" ? "pending" : undefined;
  const {
    data: requests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useRescheduleRequests(apiCommand ? { command: apiCommand } : undefined);

  const filteredRequests = useMemo(() => {
    if (statusFilter !== "rejected") return requests;
    return requests.filter((r) => r.status?.id === 500);
  }, [requests, statusFilter]);

  const commandMutation = useRescheduleRequestCommand();

  const [action, setAction] = useState<{ req: LoanRescheduleRequest; command: "approve" | "reject" } | null>(null);

  const { register, handleSubmit, reset } = useForm<ActionFormValues>({
    defaultValues: { actionDate: today() },
  });

  const openAction = (req: LoanRescheduleRequest, command: "approve" | "reject") => {
    setAction({ req, command });
    reset({ actionDate: today() });
  };

  const handleAction = handleSubmit(async (values) => {
    if (!action) return;
    await commandMutation.mutateAsync({
      scheduleId: action.req.id,
      command: action.command,
      payload:
        action.command === "approve" ? { approvedOnDate: values.actionDate } : { rejectedOnDate: values.actionDate },
    });
    setAction(null);
  });

  const columns: ColumnDef<LoanRescheduleRequest>[] = [
    {
      key: "id",
      header: t("ID"),
      cell: (r) => (
        <button
          className="text-sm font-medium text-[#D32F2F] hover:underline"
          onClick={() => navigate(`/rescheduling/${r.id}`)}
        >
          #{r.id}
        </button>
      ),
    },
    {
      key: "loan",
      header: t("Loan"),
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
      header: t("Client"),
      cell: (r) => <span className="text-sm">{r.clientName ?? "—"}</span>,
    },
    {
      key: "reason",
      header: t("Reason"),
      cell: (r) => (
        <span className="text-sm">{r.rescheduleReasonName ?? r.rescheduleReasonCodeValue?.name ?? "—"}</span>
      ),
    },
    {
      key: "fromDate",
      header: t("Reschedule From"),
      cell: (r) => <span className="text-sm">{formatDate(r.rescheduleFromDate)}</span>,
    },
    {
      key: "submitted",
      header: t("Submitted On"),
      cell: (r) => <span className="text-sm">{formatDate(r.submittedOnDate)}</span>,
    },
    {
      key: "status",
      header: t("Status"),
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
              {t("Approve")}
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
              {t("Reject")}
            </Button>
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("Reschedule Requests")} description={t("Loan rescheduling requests")} />
        <ErrorState
          title={t("Failed to load requests")}
          message={error?.message ?? t("Failed to load reschedule requests. Please try again.")}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Reschedule Requests")}
        description={t("Review and manage loan rescheduling requests")}
        actions={
          <Button onClick={() => navigate("/rescheduling/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("New Request")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              {t("Requests")} ({filteredRequests.length})
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder={t("Filter by status")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              emptyState={{ message: t("No reschedule requests found.") }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action?.command === "approve" ? t("Approve Reschedule") : t("Reject Reschedule")}
            </DialogTitle>
            <DialogDescription>
              {action?.command === "approve"
                ? `${t("Approving will recalculate the repayment schedule of loan")} ${action?.req.loanAccountNo ?? `#${action?.req.loanId}`}.`
                : `${t("Reject the reschedule request for loan")} ${action?.req.loanAccountNo ?? `#${action?.req.loanId}`}?`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                {action?.command === "approve" ? t("Approved On") : t("Rejected On")}
              </label>
              <Input type="date" {...register("actionDate")} />
            </div>

            {commandMutation.isError && (
              <ErrorState
                title={t("Failed to process request")}
                message={
                  commandMutation.error instanceof Error
                    ? commandMutation.error.message
                    : t("An unexpected error occurred.")
                }
                onRetry={() => commandMutation.reset()}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setAction(null)}
                disabled={commandMutation.isPending}
              >
                {t("Cancel")}
              </Button>
              <Button
                type="submit"
                variant={action?.command === "reject" ? "destructive" : "default"}
                disabled={commandMutation.isPending}
              >
                {commandMutation.isPending
                  ? t("Processing...")
                  : action?.command === "approve"
                    ? t("Approve")
                    : t("Reject")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescheduleLoansPage;
