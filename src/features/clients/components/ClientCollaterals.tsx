import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Gem, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useClientCollaterals,
  useClientCollateralTemplate,
  useCreateClientCollateral,
  useUpdateClientCollateral,
  useDeleteClientCollateral,
} from "../hooks/useClientCollaterals";
import type { ClientCollateral } from "../api/collaterals";

const collateralSchema = z.object({
  collateralId: z.number({ message: "Collateral type is required" }),
  quantity: z.number({ message: "Quantity is required" }).positive("Quantity must be positive"),
});
type CollateralFormValues = z.infer<typeof collateralSchema>;

interface ClientCollateralsProps {
  clientId: number;
}

const ClientCollaterals: FC<ClientCollateralsProps> = ({ clientId }) => {
  const { t } = useTranslation();
  const { data: collaterals, isLoading } = useClientCollaterals(clientId);
  const { data: template } = useClientCollateralTemplate(clientId);
  const createMutation = useCreateClientCollateral();
  const updateMutation = useUpdateClientCollateral();
  const deleteMutation = useDeleteClientCollateral();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CollateralFormValues>({
    resolver: zodResolver(collateralSchema),
  });

  const openCreate = useCallback(() => {
    setEditingId(null);
    reset({ collateralId: undefined as any, quantity: undefined as any });
    setDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (c: ClientCollateral) => {
      setEditingId(c.id);
      reset({ collateralId: c.collateralId, quantity: c.quantity });
      setDialogOpen(true);
    },
    [reset],
  );

  const onSubmit = useCallback(
    async (values: CollateralFormValues) => {
      if (editingId) {
        await updateMutation.mutateAsync({
          clientId,
          collateralId: editingId,
          payload: { quantity: Number(values.quantity), locale: "en" },
        });
      } else {
        await createMutation.mutateAsync({
          clientId,
          payload: { collateralId: Number(values.collateralId), quantity: Number(values.quantity), locale: "en" },
        });
      }
      setDialogOpen(false);
    },
    [clientId, editingId, createMutation, updateMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ clientId, collateralId: deleteId });
    setDeleteId(null);
  }, [clientId, deleteId, deleteMutation]);

  const columns: ColumnDef<ClientCollateral>[] = [
    {
      key: "name",
      header: t("clients.collaterals.type"),
      accessorFn: (row) => <span className="text-sm font-medium">{row.name ?? `#${row.collateralId}`}</span>,
    },
    {
      key: "quantity",
      header: t("clients.collaterals.quantity"),
      accessorFn: (row) => <span className="text-sm font-mono">{row.quantity}</span>,
    },
    {
      key: "total",
      header: t("clients.collaterals.totalValue"),
      accessorFn: (row) => (
        <span className="text-sm font-mono">
          {row.total != null
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.total)
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("clients.collaterals.actions"),
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Gem className="h-5 w-5" />
          {t("clients.collaterals.title")}
        </h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t("clients.collaterals.addCollateral")}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={collaterals ?? []}
            loading={isLoading}
            minWidth={600}
            emptyState={{ icon: <Gem className="h-8 w-8 text-gray-300" />, message: t("clients.collaterals.noCollaterals") }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("clients.collaterals.editCollateral") : t("clients.collaterals.addCollateral")}</DialogTitle>
            <DialogDescription>
              {editingId
                ? t("clients.collaterals.updateDescription")
                : t("clients.collaterals.selectDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-sm font-medium">{t("clients.collaterals.collateralType")} {editingId ? "" : "*"}</label>
              <Select
                defaultValue={
                  editingId
                    ? String(
                        (template?.collateralOptions ?? []).find(
                          (c) => c.id === (collaterals ?? []).find((cl) => cl.id === editingId)?.collateralId,
                        )?.id ?? "",
                      )
                    : ""
                }
                onValueChange={(v) => setValue("collateralId", Number(v), { shouldValidate: true })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("clients.collaterals.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {template?.collateralOptions?.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.collateralId && <p className="text-xs text-red-500">{errors.collateralId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("clients.collaterals.quantity")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("quantity", { valueAsNumber: true })}
                error={errors.quantity?.message}
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingId ? t("clients.collaterals.update") : t("clients.collaterals.create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t("clients.collaterals.deleteCollateral")}
        description={t("clients.collaterals.deleteConfirmation")}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={t("clients.collaterals.delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClientCollaterals;
