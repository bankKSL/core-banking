import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, CalendarClock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRescheduleRequest, useReschedulePreview, useRescheduleRequestCommand } from "../hooks/useRescheduleLoans";
import { RESCHEDULE_STATUS_CONFIG, RESCHEDULE_STATUS_ID_MAP } from "../constants/transactions";
import { formatDate } from "../utils/format";
import LoanScheduleTable from "../components/LoanScheduleTable";
import type { LoanRescheduleRequest } from "../types/loan";

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

const RescheduleRequestDetailPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const scheduleId = id ? Number(id) : undefined;

  const detailQuery = useRescheduleRequest(scheduleId);
  const previewQuery = useReschedulePreview(scheduleId);
  const commandMutation = useRescheduleRequestCommand();

  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { register, handleSubmit, reset } = useForm<ActionFormValues>({
    defaultValues: { actionDate: today() },
  });

  const req = detailQuery.data;
  const isPending = req?.status?.id === 100;

  const openAction = (command: "approve" | "reject") => {
    setAction(command);
    reset({ actionDate: today() });
  };

  const handleAction = handleSubmit(async (values) => {
    if (!action || !scheduleId) return;
    await commandMutation.mutateAsync({
      scheduleId,
      command: action,
      payload: action === "approve" ? { approvedOnDate: values.actionDate } : { rejectedOnDate: values.actionDate },
    });
    setAction(null);
    detailQuery.refetch();
  });

  if (detailQuery.isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (detailQuery.isError || !req) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <PageHeader title={t("Reschedule Request")} description={t("Request detail")} />
        <ErrorState
          title={t("Failed to load request")}
          message={detailQuery.error?.message ?? t("Reschedule request not found.")}
          onRetry={() => detailQuery.refetch()}
        />
      </div>
    );
  }

  const status = resolveStatus(req);
  const cfg = RESCHEDULE_STATUS_CONFIG[status];

  const timeline = req.timeline;

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={`${t("Reschedule Request")} #${req.id}`}
        description={`Loan ${req.loanAccountNo ?? `#${req.loanId}`} — ${req.clientName ?? t("Unknown client")}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/rescheduling")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("Back to List")}
            </Button>
            {isPending && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t("Preview Schedule")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openAction("approve")}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("Approve")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openAction("reject")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("Reject")}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Request Attributes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            {t("Request Details")}
            <StatusBadge status={cfg?.variant ?? "default"} label={cfg?.label ?? status} size="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs text-gray-500">{t("Client")}</span>
              <p className="text-sm font-medium">{req.clientName ?? "—"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t("Loan Account")}</span>
              <p className="text-sm font-medium">{req.loanAccountNo ?? `#${req.loanId}`}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t("Reschedule From Date")}</span>
              <p className="text-sm font-medium">{formatDate(req.rescheduleFromDate)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t("Reschedule From Installment")}</span>
              <p className="text-sm font-medium">{req.rescheduleFromInstallment ?? "—"}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t("Reason")}</span>
              <p className="text-sm font-medium">
                {req.rescheduleReasonName ?? req.rescheduleReasonCodeValue?.name ?? "—"}
              </p>
            </div>
            {req.rescheduleReasonComment && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-500">{t("Comment")}</span>
                <p className="text-sm font-medium">{req.rescheduleReasonComment}</p>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500">{t("Recalculate Interest")}</span>
              <p className="text-sm font-medium">{req.recalculateInterest ? t("Yes") : t("No")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.submittedOnDate && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("Submitted on")} {formatDate(timeline.submittedOnDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("by")} {timeline.submittedByFirstname} {timeline.submittedByLastname} (
                      {timeline.submittedByUsername})
                    </p>
                  </div>
                </div>
              )}
              {timeline.approvedOnDate && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("Approved on")} {formatDate(timeline.approvedOnDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("by")} {timeline.approvedByFirstname} {timeline.approvedByLastname} (
                      {timeline.approvedByUsername})
                    </p>
                  </div>
                </div>
              )}
              {timeline.rejectedOnDate && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("Rejected on")} {formatDate(timeline.rejectedOnDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("by")} {timeline.rejectedByFirstname} {timeline.rejectedByLastname} (
                      {timeline.rejectedByUsername})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Term Variations */}
      {req.loanTermVariationsData && req.loanTermVariationsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Requested Changes (Term Variations)")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Applicable From")}</TableHead>
                  <TableHead>{t("Value")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {req.loanTermVariationsData.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm font-medium">
                      {v.termType?.value ?? v.termType?.code ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(v.termVariationApplicableFrom)}</TableCell>
                    <TableCell className="text-sm">
                      {v.dateValue ? formatDate(v.dateValue) : (v.decimalValue ?? "—")}
                    </TableCell>
                    <TableCell className="text-sm">
                      <StatusBadge
                        status={v.isProcessed ? "success" : "default"}
                        label={v.isProcessed ? t("Processed") : t("Pending")}
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "approve" ? t("Approve Reschedule") : t("Reject Reschedule")}</DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? `${t("Approving will regenerate the repayment schedule for loan")} ${req.loanAccountNo ?? `#${req.loanId}`}.`
                : `${t("Reject the reschedule request for loan")} ${req.loanAccountNo ?? `#${req.loanId}`}? ${t("The schedule will remain unchanged.")}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                {action === "approve" ? t("Approved On") : t("Rejected On")}
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
                variant={action === "reject" ? "destructive" : "default"}
                disabled={commandMutation.isPending}
              >
                {commandMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("Processing...")}
                  </span>
                ) : action === "approve" ? (
                  t("Approve")
                ) : (
                  t("Reject")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Schedule Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Preview Rescheduled Schedule")}</DialogTitle>
            <DialogDescription>
              {t("This is the prospective repayment schedule if this request is approved.")}
            </DialogDescription>
          </DialogHeader>
          {previewQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : previewQuery.isError ? (
            <ErrorState
              title={t("Failed to load preview")}
              message={previewQuery.error?.message ?? t("Could not load schedule preview.")}
              onRetry={() => previewQuery.refetch()}
            />
          ) : previewQuery.data ? (
            <LoanScheduleTable
              periods={previewQuery.data.periods ?? []}
              currencyCode={previewQuery.data.currency?.code}
            />
          ) : (
            <p className="text-sm text-gray-500">{t("No schedule data available.")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescheduleRequestDetailPage;
