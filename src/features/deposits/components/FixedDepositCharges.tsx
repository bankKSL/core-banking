import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Ban, Trash2, Receipt, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ColumnDef } from "@/components/shared/DataTable";
import type { FixedDepositCharge } from "../api/deposit";
import {
  fetchFixedDepositCharges,
  fetchFixedDepositChargesTemplate,
  createFixedDepositCharge,
  waiveFixedDepositCharge,
  deleteFixedDepositCharge,
} from "../api/deposit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fdChargeKeys = {
  all: (accountId: number | string) => ["fixedDepositCharges", accountId] as const,
};

const chargeSchema = z.object({
  chargeId: z.number({ message: "Charge is required" }),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be positive"),
  dueDate: z.string().optional(),
});
type ChargeFormValues = z.infer<typeof chargeSchema>;

const formatCurrency = (n?: number, currency = "USD") =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(n) : "—";

interface FixedDepositChargesProps {
  accountId: number;
}

const FixedDepositCharges: FC<FixedDepositChargesProps> = ({ accountId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: chargesData, isLoading } = useQuery({
    queryKey: fdChargeKeys.all(accountId),
    queryFn: () => fetchFixedDepositCharges(accountId),
  });

  const { data: chargesTemplate } = useQuery({
    queryKey: [...fdChargeKeys.all(accountId), "template"],
    queryFn: () => fetchFixedDepositChargesTemplate(accountId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { chargeId: number; amount: number; dueDate?: string }) =>
      createFixedDepositCharge(accountId, {
        chargeId: payload.chargeId,
        amount: payload.amount,
        dueDate: payload.dueDate,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fdChargeKeys.all(accountId) });
    },
  });

  const waiveMutation = useMutation({
    mutationFn: (chargeId: number) => waiveFixedDepositCharge(accountId, chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fdChargeKeys.all(accountId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (chargeId: number) => deleteFixedDepositCharge(accountId, chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fdChargeKeys.all(accountId) });
    },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [waiveId, setWaiveId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const charges = chargesData ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
  });

  const openCreate = useCallback(() => {
    reset({ chargeId: undefined as any, amount: undefined as any, dueDate: "" });
    setDialogOpen(true);
  }, [reset]);

  const onSubmit = useCallback(
    async (values: ChargeFormValues) => {
      await createMutation.mutateAsync({
        chargeId: Number(values.chargeId),
        amount: Number(values.amount),
        dueDate: values.dueDate || undefined,
      });
      setDialogOpen(false);
    },
    [createMutation],
  );

  const handleWaive = useCallback(async () => {
    if (!waiveId) return;
    await waiveMutation.mutateAsync(waiveId);
    setWaiveId(null);
  }, [waiveId, waiveMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  }, [deleteId, deleteMutation]);

  const columns: ColumnDef<FixedDepositCharge>[] = [
    {
      key: "name",
      header: t("Charge"),
      accessorFn: (row) => <span className="text-sm font-medium">{row.name ?? `#${row.chargeId}`}</span>,
    },
    {
      key: "amount",
      header: t("Amount"),
      accessorFn: (row) => <span className="text-sm font-mono">{formatCurrency(row.amount, row.currency?.code)}</span>,
    },
    {
      key: "amountOutstanding",
      header: t("Outstanding"),
      accessorFn: (row) => (
        <span className="text-sm font-mono">{formatCurrency(row.amountOutstanding, row.currency?.code)}</span>
      ),
    },
    {
      key: "dueDate",
      header: t("Due Date"),
      accessorFn: (row) => <span className="text-sm">{row.dueDate ?? "—"}</span>,
    },
    {
      key: "isPaid",
      header: t("Status"),
      accessorFn: (row) =>
        row.isPaid ? (
          <Badge variant="success" size="sm">
            {t("Paid")}
          </Badge>
        ) : row.isWaived ? (
          <Badge variant="default" size="sm">
            {t("Waived")}
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            {t("Pending")}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: t("Actions"),
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          {!row.isPaid && !row.isWaived && row.waiverable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setWaiveId(row.savingsAccountChargeId ?? row.id);
              }}
              title={t("Waive")}
            >
              <Ban className="h-4 w-4 text-amber-500" />
            </Button>
          )}
          {!row.isPaid && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(row.savingsAccountChargeId ?? row.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t("FD Charges")}
        </h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t("Apply Charge")}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={charges}
            loading={isLoading}
            minWidth={700}
            emptyState={{ icon: <Receipt className="h-8 w-8 text-gray-300" />, message: t("No charges applied.") }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Apply Charge")}</DialogTitle>
            <DialogDescription>{t("Select a charge type and enter amount.")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("Charge")} *</label>
              <Select onValueChange={(v) => setValue("chargeId", Number(v), { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select charge")} />
                </SelectTrigger>
                <SelectContent>
                  {chargesTemplate?.chargeOptions?.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name} ({formatCurrency(o.amount, o.currency?.code)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.chargeId && <p className="text-xs text-red-500">{errors.chargeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                error={errors.amount?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Due Date")}</label>
              <Input type="date" {...register("dueDate")} />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("Apply")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!waiveId}
        onOpenChange={() => setWaiveId(null)}
        title={t("Waive Charge")}
        description={t("Waive this charge? Amount will be forgiven.")}
        onConfirm={handleWaive}
        variant="default"
        confirmLabel={t("Waive")}
        loading={waiveMutation.isPending}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t("Delete Charge")}
        description={t("Are you sure?")}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={t("Delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default FixedDepositCharges;
