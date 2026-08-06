import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Receipt, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { LoanCharge } from "../types/loan";
import { createLoanChargeSchema, type CreateLoanChargeFormValues } from "../schemas/loan.schema";
import {
  useLoanCharges,
  useLoanChargeTemplate,
  useAddLoanCharge,
  useUpdateLoanCharge,
  useDeleteLoanCharge,
  useLoanChargeCommand,
} from "../hooks/useLoanCharges";
import { formatFineractDate, formatMoney } from "../utils/format";

interface LoanChargesCardProps {
  loanId: number;
  currencyCode?: string;
  charges?: LoanCharge[];
}

const LoanChargesCard: FC<LoanChargesCardProps> = ({ loanId, currencyCode = "USD", charges: initialCharges }) => {
  const { t } = useTranslation();
  const chargesQuery = useLoanCharges(initialCharges ? undefined : loanId);
  const charges = initialCharges ?? chargesQuery.data ?? [];

  const templateQuery = useLoanChargeTemplate(loanId);
  const addMutation = useAddLoanCharge();
  const updateMutation = useUpdateLoanCharge();
  const deleteMutation = useDeleteLoanCharge();
  const commandMutation = useLoanChargeCommand();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LoanCharge | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [payTarget, setPayTarget] = useState<LoanCharge | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [waiveTarget, setWaiveTarget] = useState<LoanCharge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanCharge | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLoanChargeFormValues>({
    resolver: zodResolver(createLoanChargeSchema),
    defaultValues: { chargeId: 0, amount: 0, dueDate: "" },
  });

  const chargeOptions = templateQuery.data?.chargeOptions ?? [];
  const selectedChargeId = watch("chargeId");

  const handleChargeSelect = (id: number) => {
    setValue("chargeId", id, { shouldValidate: true });
    const opt = chargeOptions.find((o) => o.id === id);
    if (opt?.amount != null) setValue("amount", opt.amount);
  };

  const openAdd = () => {
    reset({ chargeId: 0, amount: 0, dueDate: "" });
    setAddOpen(true);
  };

  const onAddSubmit = handleSubmit(async (values) => {
    await addMutation.mutateAsync({
      loanId,
      payload: { chargeId: values.chargeId, amount: values.amount, dueDate: values.dueDate || undefined },
    });
    setAddOpen(false);
  });

  const isMutating = addMutation.isPending || deleteMutation.isPending || commandMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gray-400" />
            {t("Charges")} ({charges.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            {t("Add Charge")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {charges.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No charges applied to this loan.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Due Date")}</TableHead>
                  <TableHead className="text-right">{t("Amount")}</TableHead>
                  <TableHead className="text-right">{t("Paid")}</TableHead>
                  <TableHead className="text-right">{t("Waived")}</TableHead>
                  <TableHead className="text-right">{t("Outstanding")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => {
                  const isPaid = charge.paid || (charge.amountOutstanding ?? 0) <= 0;
                  const isWaived = charge.waived || (charge.amountWaived ?? 0) > 0;
                  return (
                    <TableRow key={charge.id}>
                      <TableCell className="text-sm font-medium">{charge.name}</TableCell>
                      <TableCell>
                        <Badge variant={charge.penalty ? "error" : "info"} size="sm">
                          {charge.penalty ? t("Penalty") : t("Fee")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatFineractDate(charge.dueDate)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMoney(charge.amount, currencyCode)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">
                        {formatMoney(charge.amountPaid ?? 0, currencyCode)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatMoney(charge.amountWaived ?? 0, currencyCode)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        {formatMoney(charge.amountOutstanding ?? 0, currencyCode)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isPaid ? "success" : isWaived ? "warning" : "default"} size="sm">
                          {isPaid ? t("Paid") : isWaived ? t("Waived") : t("Pending")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditTarget(charge);
                            setEditAmount(String(charge.amount ?? 0));
                            setEditDueDate(charge.dueDate ? (Array.isArray(charge.dueDate) ? new Date(charge.dueDate[0], charge.dueDate[1] - 1, charge.dueDate[2]).toISOString().split("T")[0] : charge.dueDate) : "");
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!isPaid && !isWaived && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setPayTarget(charge)}>
                                {t("Pay")}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setWaiveTarget(charge)}>
                                {t("Waive")}
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(charge)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add charge dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Add Charge")}</DialogTitle>
            <DialogDescription>{t("Apply a new fee or penalty to this loan.")}</DialogDescription>
          </DialogHeader>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t("This charge will be added to the loan balance.")}
            </div>
          <form onSubmit={onAddSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Charge")} *</label>
              <Select value={selectedChargeId ? String(selectedChargeId) : ""} onValueChange={(v) => handleChargeSelect(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select charge")} />
                </SelectTrigger>
                <SelectContent>
                  {chargeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
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
                disabled={isMutating}
                error={errors.amount?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Due Date")}</label>
              <Input type="date" {...register("dueDate")} disabled={isMutating} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isMutating}>
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Add Charge")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit charge dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit Charge")}</DialogTitle>
            <DialogDescription>{t("Update amount for")} {editTarget?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amount")}</label>
              <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Due Date")}</label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={updateMutation.isPending}>
                {t("Cancel")}
              </Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={async () => {
                  if (!editTarget) return;
                  await updateMutation.mutateAsync({
                    loanId,
                    chargeId: editTarget.id,
                    payload: { amount: Number(editAmount), dueDate: editDueDate || undefined },
                  });
                  setEditTarget(null);
                }}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay charge dialog */}
      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Pay Charge")}</DialogTitle>
            <DialogDescription>
              Pay {payTarget?.name} — outstanding {formatMoney(payTarget?.amountOutstanding ?? 0, currencyCode)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Transaction Date")}</label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayTarget(null)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button
                disabled={isMutating}
                onClick={async () => {
                  if (!payTarget) return;
                  await commandMutation.mutateAsync({
                    loanId,
                    chargeId: payTarget.id,
                    command: "pay",
                    payload: { transactionDate: payDate },
                  });
                  setPayTarget(null);
                }}
              >
                {commandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Confirm Payment")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waive charge confirm */}
      <ConfirmDialog
        open={!!waiveTarget}
        onOpenChange={(open) => !open && setWaiveTarget(null)}
        title={t("Waive Charge")}
        description={`${t("Waive")} ${waiveTarget?.name} (${formatMoney(waiveTarget?.amountOutstanding ?? 0, currencyCode)} ${t("outstanding")})?`}
        confirmLabel={t("Waive")}
        loading={commandMutation.isPending}
        onConfirm={async () => {
          if (!waiveTarget) return;
          await commandMutation.mutateAsync({ loanId, chargeId: waiveTarget.id, command: "waive" });
          setWaiveTarget(null);
        }}
      />

      {/* Delete charge confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("Delete Charge")}
        description={`${t("Remove charge")} ${deleteTarget?.name} ${t("from this loan? This cannot be undone.")}`}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync({ loanId, chargeId: deleteTarget.id });
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default LoanChargesCard;
export type { LoanChargesCardProps };
