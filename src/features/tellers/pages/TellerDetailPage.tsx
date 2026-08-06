import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Pencil, Trash2, Plus, DollarSign, Landmark, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Separator } from "@/components/ui/separator";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useTeller,
  useCashiers,
  useCashierTemplate,
  useCreateCashier,
  useDeleteCashier,
  useAllocateCash,
  useSettleCash,
  useCashierTransactions,
} from "../index";
import type { Cashier } from "../types/teller";

const STATUS_LABELS: Record<number, string> = { 100: "Pending", 300: "Active", 400: "Inactive", 600: "Closed" };

const cashierSchema = z.object({
  selectedStaffId: z.string().min(1, "Staff is required"),
  cashierStartDate: z.string().min(1, "Start date is required"),
  cashierEndDate: z.string().min(1, "End date is required"),
  isFullDay: z.boolean(),
  cashierDescription: z.string().optional(),
});
type CashierFormValues = z.input<typeof cashierSchema>;

const cashTxnSchema = z.object({
  txnAmount: z.coerce.number({ message: "Amount is required" }).positive("Must be positive"),
  txnDate: z.string().min(1, "Date is required"),
  txnNote: z.string().min(1, "Note is required"),
});
type CashTxnFormValues = z.input<typeof cashTxnSchema>;

const TellerDetailPage: FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: teller, isLoading } = useTeller(id);
  const { data: cashiers = [], isLoading: cashiersLoading } = useCashiers(id);
  const { data: template } = useCashierTemplate(id!);
  const createCashierMutation = useCreateCashier();
  const deleteCashierMutation = useDeleteCashier();
  const allocateMutation = useAllocateCash();
  const settleMutation = useSettleCash();

  const [cashierDialogOpen, setCashierDialogOpen] = useState(false);
  const [deleteCashierId, setDeleteCashierId] = useState<number | null>(null);
  const [cashTxnDialog, setCashTxnDialog] = useState<{ cashierId: number; type: "allocate" | "settle" } | null>(null);
  const [selectedCashierTxns, setSelectedCashierTxns] = useState<number | null>(null);

  const { data: cashierTxns } = useCashierTransactions(
    id,
    selectedCashierTxns != null ? String(selectedCashierTxns) : undefined,
  );

  const {
    register: registerCashier,
    handleSubmit: handleSubmitCashier,
    control: controlCashier,
    reset: resetCashier,
    formState: { errors: cashierErrors },
  } = useForm<CashierFormValues>({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      selectedStaffId: "",
      cashierStartDate: new Date().toISOString().split("T")[0],
      cashierEndDate: new Date().toISOString().split("T")[0],
      isFullDay: true,
      cashierDescription: "",
    },
  });

  const {
    register: registerTxn,
    handleSubmit: handleSubmitTxn,
    reset: resetTxn,
    formState: { errors: txnErrors },
  } = useForm<CashTxnFormValues>({
    resolver: zodResolver(cashTxnSchema),
    defaultValues: {
      txnAmount: 0,
      txnDate: new Date().toISOString().split("T")[0],
      txnNote: "",
    },
  });

  const onSubmitCashier = useCallback(
    async (values: CashierFormValues) => {
      if (!id) return;
      await createCashierMutation.mutateAsync({
        tellerId: id,
        payload: {
          staffId: Number(values.selectedStaffId),
          startDate: values.cashierStartDate,
          endDate: values.cashierEndDate,
          isFullDay: values.isFullDay,
          description: values.cashierDescription || undefined,
          locale: "en",
          dateFormat: "yyyy-MM-dd",
        },
      });
      setCashierDialogOpen(false);
      resetCashier();
    },
    [id, createCashierMutation, resetCashier],
  );

  const onSubmitCashTxn = useCallback(
    async (values: CashTxnFormValues) => {
      if (!id || !cashTxnDialog) return;
      const payload = {
        txnDate: values.txnDate,
        txnAmount: Number(values.txnAmount),
        currencyCode: "USD",
        txnNote: values.txnNote,
        locale: "en",
        dateFormat: "yyyy-MM-dd",
      };
      if (cashTxnDialog.type === "allocate") {
        await allocateMutation.mutateAsync({ tellerId: id, cashierId: cashTxnDialog.cashierId, payload });
      } else {
        await settleMutation.mutateAsync({ tellerId: id, cashierId: cashTxnDialog.cashierId, payload });
      }
      setCashTxnDialog(null);
      resetTxn();
    },
    [id, cashTxnDialog, allocateMutation, settleMutation, resetTxn],
  );

  const cashierColumns: ColumnDef<Cashier>[] = [
    {
      key: "staffName",
      header: t("Staff"),
      cell: (r) => <span className="font-medium">{r.staffName ?? `#${r.staffId}`}</span>,
    },
    {
      key: "isFullDay",
      header: t("Schedule"),
      cell: (r) =>
        r.isFullDay
          ? t("Full Day")
          : `${r.hourStartTime ?? "?"}:${r.minStartTime ?? "00"} - ${r.hourEndTime ?? "?"}:${r.minEndTime ?? "00"}`,
    },
    { key: "startDate", header: t("From"), cell: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: "endDate", header: t("To"), cell: (r) => new Date(r.endDate).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCashTxnDialog({ cashierId: r.id, type: "allocate" })}
            title={t("Allocate Cash")}
          >
            <DollarSign className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCashTxnDialog({ cashierId: r.id, type: "settle" })}
            title={t("Settle Cash")}
          >
            <Landmark className="h-4 w-4 text-amber-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCashierTxns(r.id)} title={t("View Transactions")}>
            {t("Txns")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteCashierId(r.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="p-6 max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  if (!teller)
    return (
      <div className="p-6">
        <p className="text-red-600">{t("Teller not found.")}</p>
      </div>
    );

  const cashTxnError = allocateMutation.error ?? settleMutation.error;

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={teller.name}
        description={teller.officeName ?? `Office #${teller.officeId}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={teller.status === 300 ? "success" : teller.status === 600 ? "default" : "info"}>
              {STATUS_LABELS[teller.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/tellers/edit/${teller.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              {t("Edit")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/tellers")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("Back")}
            </Button>
          </div>
        }
      />

      {createCashierMutation.isError && (
        <ErrorState
          title={t("Failed to assign cashier")}
          message={
            createCashierMutation.error instanceof Error
              ? createCashierMutation.error.message
              : t("An unexpected error occurred.")
          }
          onRetry={() => createCashierMutation.reset()}
        />
      )}

      {(allocateMutation.isError || settleMutation.isError) && (
        <ErrorState
          title={t(`Failed to ${cashTxnDialog?.type === "allocate" ? "allocate" : "settle"} cash`)}
          message={cashTxnError instanceof Error ? cashTxnError.message : t("An unexpected error occurred.")}
          onRetry={() => {
            allocateMutation.reset();
            settleMutation.reset();
          }}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("Cashiers")}</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setCashierDialogOpen(true);
              resetCashier();
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("Assign Cashier")}
          </Button>
        </CardHeader>
        <CardContent>
          {cashiersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={cashierColumns}
              data={cashiers ?? []}
              emptyState={{ message: t("No cashiers assigned.") }}
              minWidth={700}
            />
          )}
        </CardContent>
      </Card>

      {selectedCashierTxns && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("Cashier Transactions")}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSelectedCashierTxns(null)}>
              {t("Close")}
            </Button>
          </CardHeader>
          <CardContent>
            {cashierTxns && cashierTxns.length > 0 ? (
              <div className="space-y-2">
                {cashierTxns.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">
                      {txn.txnType === 101
                        ? t("Allocate")
                        : txn.txnType === 102
                          ? t("Settle")
                          : txn.txnType === 103
                            ? t("Cash In")
                            : txn.txnType === 104
                              ? t("Cash Out")
                              : `Type ${txn.txnType}`}
                    </span>
                    <span className="font-mono">${Number(txn.txnAmount).toFixed(2)}</span>
                    <span className="text-gray-500">
                      {txn.txnDate ? new Date(txn.txnDate).toLocaleDateString() : "\u2014"}
                    </span>
                    <span className="text-gray-400 text-xs">{txn.txnNote ?? "\u2014"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("No transactions for this cashier.")}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={cashierDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCashierDialogOpen(false);
            resetCashier();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Assign Cashier")}</DialogTitle>
            <DialogDescription>{t("Assign a staff member as cashier to this teller.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCashier(onSubmitCashier)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Staff *")}</label>
              <Controller
                control={controlCashier}
                name="selectedStaffId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select staff")} />
                    </SelectTrigger>
                    <SelectContent>
                      {template?.staffOptions?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {cashierErrors.selectedStaffId && (
                <p className="text-xs text-red-500">{cashierErrors.selectedStaffId.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium">{t("Start Date")}</label>
                <Input type="date" {...registerCashier("cashierStartDate")} />
                {cashierErrors.cashierStartDate && (
                  <p className="text-xs text-red-500">{cashierErrors.cashierStartDate.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium">{t("End Date")}</label>
                <Input type="date" {...registerCashier("cashierEndDate")} />
                {cashierErrors.cashierEndDate && (
                  <p className="text-xs text-red-500">{cashierErrors.cashierEndDate.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Controller
                control={controlCashier}
                name="isFullDay"
                render={({ field }) => <Switch id="isFullDay" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="isFullDay">{t("Full Day")}</Label>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Description")}</label>
              <Input {...registerCashier("cashierDescription")} placeholder={t("Optional")} />
            </div>
            <Button type="submit" disabled={createCashierMutation.isPending}>
              {createCashierMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("Assign Cashier")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cashTxnDialog}
        onOpenChange={() => {
          setCashTxnDialog(null);
          resetTxn();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cashTxnDialog?.type === "allocate" ? t("Allocate Cash") : t("Settle Cash")}</DialogTitle>
            <DialogDescription>
              {cashTxnDialog?.type === "allocate" ? t("Assign cash to the cashier.") : t("Settle cash from the cashier.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTxn(onSubmitCashTxn)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Amount *")}</label>
              <Input type="number" step="0.01" {...registerTxn("txnAmount", { valueAsNumber: true })} />
              {txnErrors.txnAmount && <p className="text-xs text-red-500">{txnErrors.txnAmount.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Date")}</label>
              <Input type="date" {...registerTxn("txnDate")} />
              {txnErrors.txnDate && <p className="text-xs text-red-500">{txnErrors.txnDate.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Note *")}</label>
              <Input {...registerTxn("txnNote")} placeholder={t("e.g. Starting cash")} />
              {txnErrors.txnNote && <p className="text-xs text-red-500">{txnErrors.txnNote.message}</p>}
            </div>
            <Button type="submit" disabled={allocateMutation.isPending || settleMutation.isPending}>
              {(allocateMutation.isPending || settleMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {cashTxnDialog?.type === "allocate" ? t("Allocate") : t("Settle")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCashierId}
        onOpenChange={() => setDeleteCashierId(null)}
        onConfirm={async () => {
          if (deleteCashierId && id) {
            await deleteCashierMutation.mutateAsync({ tellerId: id, cashierId: deleteCashierId });
            setDeleteCashierId(null);
          }
        }}
        title={t("Remove Cashier")}
        description={t("Remove this cashier from the teller?")}
        variant="destructive"
        confirmLabel={t("Remove")}
      />
    </div>
  );
};

export default TellerDetailPage;
