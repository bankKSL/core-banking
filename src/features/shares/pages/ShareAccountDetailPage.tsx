import { type FC, useMemo, useCallback, useState } from "react";
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
        header: "Date",
        accessorFn: (row) => formatDate(row.transactionDate),
      },
      {
        key: "totalShares",
        header: "Shares",
        accessorFn: (row) => row.totalShares?.toLocaleString() ?? "\u2014",
      },
      {
        key: "unitPrice",
        header: "Unit Price",
        accessorFn: (row) => formatAmount(row.unitPrice),
      },
      {
        key: "amount",
        header: "Amount",
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "type",
        header: "Type",
        accessorFn: (row) => <StatusBadge status={row.type?.value?.toLowerCase() ?? "unknown"} />,
      },
      {
        key: "status",
        header: "Status",
        accessorFn: (row) => <StatusBadge status={row.status?.value?.toLowerCase() ?? "unknown"} />,
      },
    ],
    [],
  );

  const chargesColumns: ColumnDef<NonNullable<ShareAccount["charges"]>[number]>[] = useMemo(
    () => [
      { key: "name", header: "Name" },
      {
        key: "amount",
        header: "Amount",
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "amountPaid",
        header: "Paid",
        accessorFn: (row) => formatAmount(row.amountPaid),
      },
      {
        key: "amountOutstanding",
        header: "Outstanding",
        accessorFn: (row) => formatAmount(row.amountOutstanding),
      },
    ],
    [],
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
          title="Share Account"
          description="View share account details"
          actions={
            <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          }
        />
        <ErrorState message="Failed to load share account." onRetry={refetch} />
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
        title={`Share Account #${account.accountNo}`}
        description={`${account.clientName} \u2014 ${account.productName}`}
        actions={
          <>
            <StatusBadge status={statusCode} />
            <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {isPending && (
              <>
                <Button onClick={() => setConfirmAction("approve")}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => setConfirmAction("reject")}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                </Button>
              </>
            )}

            {isApproved && (
              <>
                <Button onClick={() => setConfirmAction("activate")}>
                  <Play className="mr-2 h-4 w-4" /> Activate
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction("undoApproval")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Undo Approval
                </Button>
              </>
            )}

            {isActive && (
              <>
                <Button onClick={() => { setActionDialog("additionalShares"); reset(); }}>
                  <Plus className="mr-2 h-4 w-4" /> Apply Additional Shares
                </Button>
                <Button variant="outline" onClick={() => { setActionDialog("redeemShares"); reset(); }}>
                  <XCircle className="mr-2 h-4 w-4" /> Redeem Shares
                </Button>
                <Button variant="destructive" onClick={() => setActionDialog("close")}>
                  <XCircle className="mr-2 h-4 w-4" /> Close
                </Button>
              </>
            )}
          </>
        }
      />

      {commandMutation.isError && (
        <ErrorState
          title={`Failed to ${actionDialog === "additionalShares" ? "apply shares" : actionDialog === "redeemShares" ? "redeem shares" : "perform action"}`}
          message={
            commandMutation.error instanceof Error ? commandMutation.error.message : "An unexpected error occurred."
          }
          onRetry={() => commandMutation.reset()}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Client" value={account.clientName ?? "\u2014"} />
            <DetailRow label="Product" value={account.productName ?? "\u2014"} />
            <DetailRow label="External ID" value={account.externalId ?? "\u2014"} />
            <DetailRow
              label="Savings Account"
              value={account.savingsAccountId ? `#${account.savingsAccountId}` : "\u2014"}
            />
            <DetailRow
              label="Total Shares"
              value={account.summary?.totalShares?.toLocaleString() ?? "0"}
            />
            <DetailRow label="Currency" value={account.currency?.displaySymbol ?? account.currency?.code ?? "\u2014"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Approved Shares"
              value={account.summary?.totalApprovedShares?.toLocaleString() ?? "0"}
            />
            <DetailRow
              label="Pending Shares"
              value={account.summary?.totalPendingShares?.toLocaleString() ?? "0"}
            />
            <DetailRow
              label="Current Market Price"
              value={formatAmount(account.currentMarketPrice)}
            />
            {account.lockinPeriod != null && (
              <DetailRow
                label="Lock-in Period"
                value={`${account.lockinPeriod} ${account.lockPeriodTypeEnum?.value ?? ""}`}
              />
            )}
            {account.minimumActivePeriod != null && (
              <DetailRow
                label="Min Active Period"
                value={`${account.minimumActivePeriod} days`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Submitted On" value={formatDate(account.timeline?.submittedOnDate)} />
          <DetailRow label="Approved On" value={formatDate(account.timeline?.approvedDate)} />
          <DetailRow label="Activated On" value={formatDate(account.timeline?.activatedDate)} />
          <DetailRow label="Closed On" value={formatDate(account.timeline?.closedDate)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchased Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={purchasedSharesColumns}
            data={account.purchasedShares ?? []}
            emptyState={{ message: "No purchased shares." }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={chargesColumns}
            data={account.charges ?? []}
            emptyState={{ message: "No charges applied." }}
          />
        </CardContent>
      </Card>

      {dividends && dividends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dividends</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "id", header: "ID" },
                {
                  key: "amount",
                  header: "Amount",
                  accessorFn: (row) => formatAmount(row.amount),
                },
                {
                  key: "dividendPeriodStartDate",
                  header: "Period Start",
                  accessorFn: (row) => formatDate(row.dividendPeriodStartDate),
                },
                {
                  key: "dividendPeriodEndDate",
                  header: "Period End",
                  accessorFn: (row) => formatDate(row.dividendPeriodEndDate),
                },
                {
                  key: "status",
                  header: "Status",
                  accessorFn: (row) => <StatusBadge status={row.status?.code?.toLowerCase() ?? "unknown"} />,
                },
              ]}
              data={dividends}
              emptyState={{ message: "No dividends." }}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Approve Share Account"
        description="Are you sure you want to approve this share account?"
        confirmLabel="Approve"
        onConfirm={() => handleCommand("approve")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Reject Share Account"
        description="Are you sure you want to reject this share account?"
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={() => handleCommand("reject")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "activate"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Activate Share Account"
        description="Are you sure you want to activate this share account?"
        confirmLabel="Activate"
        onConfirm={() => handleCommand("activate")}
        loading={commandMutation.isPending}
      />

      <ConfirmDialog
        open={confirmAction === "undoApproval"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Undo Approval"
        description="Are you sure you want to undo the approval of this share account?"
        confirmLabel="Undo Approval"
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
            <DialogTitle>Apply Additional Shares</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitDialog)}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Requested Date</label>
                <Input type="date" {...register("requestedDate")} error={errors.requestedDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Requested Shares</label>
                <Input type="number" {...register("requestedShares", { valueAsNumber: true })} error={errors.requestedShares?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setActionDialog(null); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={commandMutation.isPending}>
                Submit
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
            <DialogTitle>Redeem Shares</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitDialog)}>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Requested Date</label>
                <Input type="date" {...register("requestedDate")} error={errors.requestedDate?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Requested Shares</label>
                <Input type="number" {...register("requestedShares", { valueAsNumber: true })} error={errors.requestedShares?.message} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setActionDialog(null); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={commandMutation.isPending}>
                Redeem
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={actionDialog === "close"}
        onOpenChange={(open) => { if (!open) setActionDialog(null); }}
        title="Close Share Account"
        description="Are you sure you want to close this share account?"
        confirmLabel="Close"
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
