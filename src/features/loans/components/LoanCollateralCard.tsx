import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gem, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { LoanCollateral } from "../types/loan";
import { createLoanCollateralSchema, type CreateLoanCollateralFormValues } from "../schemas/loan.schema";
import {
  useLoanCollateral,
  useCollateralTemplate,
  useAddLoanCollateral,
  useUpdateLoanCollateral,
  useDeleteLoanCollateral,
} from "../hooks/useLoanCollateral";
import { formatMoney } from "../utils/format";

interface LoanCollateralCardProps {
  loanId: number;
  currencyCode?: string;
  collateral?: LoanCollateral[];
}

const LoanCollateralCard: FC<LoanCollateralCardProps> = ({ loanId, currencyCode = "USD", collateral: initial }) => {
  const { t } = useTranslation();
  const collateralQuery = useLoanCollateral(initial ? undefined : loanId);
  const items = initial ?? collateralQuery.data ?? [];

  const templateQuery = useCollateralTemplate();
  const addMutation = useAddLoanCollateral();
  const updateMutation = useUpdateLoanCollateral();
  const deleteMutation = useDeleteLoanCollateral();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoanCollateral | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanCollateral | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLoanCollateralFormValues>({
    resolver: zodResolver(createLoanCollateralSchema),
    defaultValues: { collateralTypeId: 0, value: 0, description: "" },
  });

  const typeOptions = templateQuery.data?.loanCollateralOptions ?? [];
  const selectedTypeId = watch("collateralTypeId");

  const openCreate = () => {
    setEditing(null);
    reset({ collateralTypeId: 0, value: 0, description: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: LoanCollateral) => {
    setEditing(item);
    reset({
      collateralTypeId: item.type?.id ?? item.collateralTypeId ?? 0,
      value: item.value,
      description: item.description ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await updateMutation.mutateAsync({ loanId, collateralId: editing.id, payload: values });
    } else {
      await addMutation.mutateAsync({ loanId, payload: values });
    }
    setDialogOpen(false);
  });

  const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const typeName = (item: LoanCollateral) =>
    item.type?.name ?? item.collateralTypeName ?? typeOptions.find((o) => o.id === item.collateralTypeId)?.name ?? "—";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Gem className="h-4 w-4 text-gray-400" />
            {t("Collateral")} ({items.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            {t("Add Collateral")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No collateral linked to this loan.")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead className="text-right">{t("Value")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">{typeName(item)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{item.description || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatMoney(item.value, currencyCode)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("Edit Collateral") : t("Add Collateral")}</DialogTitle>
            <DialogDescription>
              {editing ? t("Update the collateral details.") : t("Link a collateral item to this loan.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Collateral Type")} *</label>
              <Select
                value={selectedTypeId ? String(selectedTypeId) : ""}
                onValueChange={(v) => setValue("collateralTypeId", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select type")} />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.collateralTypeId && <p className="text-xs text-red-500">{errors.collateralTypeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Value")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("value", { valueAsNumber: true })}
                disabled={isMutating}
                error={errors.value?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Description")}</label>
              <Input {...register("description")} disabled={isMutating} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutating}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? t("Save Changes") : t("Add Collateral")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("Delete Collateral")}
        description={`${t("Remove this collateral item")} (${typeName(deleteTarget ?? { id: 0, value: 0 })}) ${t("from the loan?")}`}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync({ loanId, collateralId: deleteTarget.id });
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default LoanCollateralCard;
export type { LoanCollateralCardProps };
