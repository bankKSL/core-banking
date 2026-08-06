import { type FC, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ThumbsUp, ThumbsDown, Play, RotateCcw, XCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useShareAccount, useShareAccountCommand, useDividends } from "../hooks/useShares";
import type { ShareAccount } from "../api/shares";

function formatAmount(amount?: number | null): string {
  if (amount == null) return "\u2014";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const shareActionSchema = z.object({
  requestedDate: z.string().min(1, "Date is required"),
  requestedShares: z.coerce.number({ message: "Must be a number" }).positive("Must be positive"),
});
type ShareActionFormValues = z.input<typeof shareActionSchema>;

const DetailRow: FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
  </div>
);

type ActionDialog = "additionalShares" | "redeemShares" | "close" | null;

const ShareAccountDetailPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const accountId = id ? Number(id) : undefined;

  const { data: account, isLoading, isError, refetch } = useShareAccount(accountId);
  const commandMutation = useShareAccountCommand();

  const [actionDialog, setActionDialog] = useState<ActionDialog>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShareActionFormValues>({
    resolver: zodResolver(shareActionSchema),
    defaultValues: { requestedDate: "", requestedShares: 0 },
  });

  const productId = account?.productId;
  const { data: dividends } = useDividends(productId);

  const handleCommand = useCallback(
    async (command: string, payload?: Record<string, unknown>) => {
      if (!accountId) return;
      try {
        await commandMutation.mutateAsync({ accountId, command, payload });
        refetch();
      } catch {
        // handled by mutation
      }
      setConfirmAction(null);
    },
    [accountId, commandMutation, refetch],
  );

  const onSubmitDialog = useCallback(
    async (values: ShareActionFormValues) => {
      if (!accountId || !actionDialog) return;
      const command = actionDialog === "additionalShares" ? "applyAdditionalShares" : "redeemShares";
      await commandMutation.mutateAsync({
        accountId,
        command,
        payload: {
          requestedDate: values.requestedDate,
          requestedShares: values.requestedShares,
          dateFormat: "dd MMMM yyyy",
          locale: "en",
        },
      });
      refetch();
      setActionDialog(null);
    },
    [accountId, actionDialog, commandMutation, refetch],
  );

  const purchasedSharesColumns: ColumnDef<NonNullable<ShareAccount["purchasedShares"]>[number]>[] = useMemo(
    () => [
      {
        key: "transactionDate",
        header: t("Date"),
        accessorFn: (row) => formatDate(row.transactionDate),
      },
      {
        key: "totalShares",
        header: t("Shares"),
        accessorFn: (row) => row.totalShares?.toLocaleString() ?? "\u2014",
      },
      {
        key: "unitPrice",
        header: t("Unit Price"),
        accessorFn: (row) => formatAmount(row.unitPrice),
      },
      {
        key: "amount",
        header: t("Amount"),
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "type",
        header: t("Type"),
        accessorFn: (row) => <StatusBadge status={row.type?.value?.toLowerCase() ?? "unknown"} />,
      },
      {
        key: "status",
        header: t("Status"),
        accessorFn: (row) => <StatusBadge status={row.status?.value?.toLowerCase() ?? "unknown"} />,
      },
    ],
    [t],
  );

  const chargesColumns: ColumnDef<NonNullable<ShareAccount["charges"]>[number]>[] = useMemo(
    () => [
      { key: "name", header: t("Name") },
      {
        key: "amount",
        header: t("Amount"),
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "amountPaid",
        header: t("Paid"),
        accessorFn: (row) => formatAmount(row.amountPaid),
      },
      {
        key: "amountOutstanding",
        header: t("Outstanding"),
        accessorFn: (row) => formatAmount(row.amountOutstanding),
      },
    ],
    [t],
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 py-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-6 max-w-5xl m-auto">
        <PageHeader
          title={t("Share Account")}
          description={t("View share account details")}
          actions={
            <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load share account.")} onRetry={refetch} />
      </div>
    );
  }

  const status = account.status;
  const isPending = status?.submittedAndPendingApproval;
  const isApproved = status?.approved && !status?.active;
  const isActive = status?.active;
  const isRejected = status?.rejected;

  const statusCode = status?.code?.toLowerCase() ?? "unknown";

  return (
    <div className="max-w-5xl m-auto space-y-6">
      <PageHeader
        title={`${t("Share Account")} #${account.accountNo}`}
        description={`${account.clientName} \u2014 ${account.productName}`}
        actions={
          <>
            <StatusBadge status={statusCode} />
            <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>

            {isPending && (
              <>
                <Button onClick={() => setConfirmAction("approve")}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> {t("Approve")}
                </Button>
                <Button variant="destructive" onClick={() => setConfirmAction("reject")}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> {t("Reject")}
                </Button>
              </>
            )}

            {isApproved && (
              <>
                <Button onClick={() => setConfirmAction("activate")}>
                  <Play className="mr-2 h-4 w-4" /> {t("Activate")}
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction("undoApproval")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> {t("Undo Approval")}
                </Button>
              </>
            )}

            {isActive && (
              <>
                <Button onClick={() => { setActionDialog("additionalShares"); reset(); }}>
                  <Plus className="mr-2 h-4 w-4" /> {t("Apply Additional Shares")}
                </Button>
                <Button variant="outline" onClick={() => { setActionDialog("redeemShares"); reset(); }}>
                  <XCircle className="mr-2 h-4 w-4" /> {t("Redeem Shares")}
                </Button>
                <Button variant="destructive" onClick={() => setActionDialog("close")}>
                  <XCircle className="mr-2 h-4 w-4" /> {t("Close")}
                </Button>
              </>
            )}
          </>
        }
      />

      {commandMutation.isError && (
        <ErrorState
          title={t(`Failed to ${actionDialog === "additionalShares" ? "apply shares" : actionDialog === "redeemShares" ? "redeem shares" : "perform action"}`)}
          message={
            commandMutation.error instanceof Error ? commandMutation.error.message : t("An unexpected error occurred.")
          }
          onRetry={() => commandMutation.reset()}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Account Information")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label={t("Client")} value={account.clientName ?? "\u2014"} />
            <DetailRow label={t("Product")} value={account.productName ?? "\u2014"} />
            <DetailRow label={t("External ID")} value={account.externalId ?? "\u2014"} />
            <DetailRow
              label={t("Savings Account")}
              value={account.savingsAccountId ? `#${account.savingsAccountId}` : "\u2014"}
            />
            <DetailRow
              label={t("Total Shares")}
              value={account.summary?.totalShares?.toLocaleString() ?? "0"}
            />
            <DetailRow label={t("Currency")} value={account.currency?.displaySymbol ?? account.currency?.code ?? "\u2014"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Summary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label={t("Approved Shares")}
              value={account.summary?.totalApprovedShares?.toLocaleString() ?? "0"}
            />
            <DetailRow
              label={t("Pending Shares")}
              value={account.summary?.totalPendingShares?.toLocaleString() ?? "0"}
            />
            <DetailRow
              label={t("Current Market Price")}
              value={formatAmount(account.currentMarketPrice)}
            />
            {account.lockinPeriod != null && (
              <DetailRow
                label={t("Lock-in Period")}
                value={`${account.lockinPeriod} ${account.lockPeriodTypeEnum?.value ?? ""}`}
              />
            )}
            {account.minimumActivePeriod != null && (
              <DetailRow
                label={t("Min Active Period")}
                value={`${account.minimumActivePeriod} days`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("Timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label={t("Submitted On")} value={formatDate(account.timeline?.submittedOnDate)} />
          <DetailRow label={t("Approved On")} value={formatDate(account.timeline?.approvedDate)} />
          <DetailRow label={t("Activated On")} value={formatDate(account.timeline?.activatedDate)} />
          <DetailRow label={t("Closed On")} value={formatDate(account.timeline?.closedDate)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Purchased Shares")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={purchasedSharesColumns}
            data={account.purchasedShares ?? []}
            emptyState={{ message: t("No purchased shares.") }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("Charges")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={chargesColumns}
            data={account.charges ?? []}
            emptyState={{ message: t("No charges applied.") }}
          />
        </CardContent>
      </Card>

      {dividends && dividends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("Dividends")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "id", header: t("ID") },
                {
                  key: "amount",
                  header: t("Amount"),
                  accessorFn: (row) => formatAmount(row.amount),
                },
                {
                  key: "dividendPeriodStartDate",
                  header: t("Period Start"),
                  accessorFn: (row) => formatDate(row.dividendPeriodStartDate),
                },
                {
                  key: "dividendPeriodEndDate",
                  header: t("Period End"),
                  accessorFn: (row) => formatDate(row.dividendPeriodEndDate),
                },
                {
                  key: "status",
                  header: t("Status"),
                  accessorFn: (row) => <StatusBadge status={row.status?.code?.toLowerCase() ?? "unknown"} />,
                },
              ]}
              data={dividends}
              emptyState={{ message: t("No dividends.") }}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={t("Approve Share Account")}
        description={t("Are you sure you want to approve this share account?")}
        confirmLabel={t("Approve")}
        onConfirm={() => handleCommand("approve")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={t("Reject Share Account")}
        description={t("Are you sure you want to reject this share account?")}
        confirmLabel={t("Reject")}
        variant="destructive"
        onConfirm={() => handleCommand("reject")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "activate"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={t("Activate Share Account")}
        description={t("Are you sure you want to activate this share account?")}
        confirmLabel={t("Activate")}
        onConfirm={() => handleCommand("activate")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "undoApproval"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={t("Undo Approval")}
        description={t("Are you sure you want to undo the approval of this share account?")}
        confirmLabel={t("Undo Approval")}
        variant="destructive"
        onConfirm={() => handleCommand("undoApproval")}
        loading={commandMutation.isPending}
      />

      <Dialog
        open={actionDialog === "additionalShares"}
        onOpenChange={(open) => { if (!open) { setActionDialog(null); reset(); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Apply Additional Shares")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitDialog)}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Requested Date")}</label>
                <Input type="date" {...register("requestedDate")} error={errors.requestedDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Requested Shares")}</label>
                <Input type="number" {...register("requestedShares", { valueAsNumber: true })} error={errors.requestedShares?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setActionDialog(null); reset(); }}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={commandMutation.isPending}>
                {t("Submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actionDialog === "redeemShares"}
        onOpenChange={(open) => { if (!open) { setActionDialog(null); reset(); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Redeem Shares")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitDialog)}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Requested Date")}</label>
                <Input type="date" {...register("requestedDate")} error={errors.requestedDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Requested Shares")}</label>
                <Input type="number" {...register("requestedShares", { valueAsNumber: true })} error={errors.requestedShares?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setActionDialog(null); reset(); }}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={commandMutation.isPending}>
                {t("Redeem")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={actionDialog === "close"}
        onOpenChange={(open) => { if (!open) setActionDialog(null); }}
        title={t("Close Share Account")}
        description={t("Are you sure you want to close this share account?")}
        confirmLabel={t("Close")}
        variant="destructive"
        onConfirm={() => {
          handleCommand("close");
          setActionDialog(null);
        }}
        loading={commandMutation.isPending}
      />
    </div>
  );
};

export default ShareAccountDetailPage;
