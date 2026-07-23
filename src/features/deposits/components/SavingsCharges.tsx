import { type FC, useState, useCallback } from "react";
import { Plus, Ban, Trash2, Receipt, Loader2 } from "lucide-react";
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
import {
  useSavingsCharges,
  useSavingsChargesTemplate,
  useCreateSavingsCharge,
  useWaiveSavingsCharge,
  useDeleteSavingsCharge,
} from "../hooks/useSavingsCharges";
import type { SavingsCharge } from "../api/deposit";

const chargeSchema = z.object({
  chargeId: z.number({ message: "Charge is required" }),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be positive"),
  dueDate: z.string().optional(),
});
type ChargeFormValues = z.infer<typeof chargeSchema>;

const formatCurrency = (n?: number) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

interface SavingsChargesProps {
  accountId: number;
}

const SavingsCharges: FC<SavingsChargesProps> = ({ accountId }) => {
  const { data: chargesData, isLoading } = useSavingsCharges(accountId);
  const { data: template } = useSavingsChargesTemplate(accountId);
  const createMutation = useCreateSavingsCharge();
  const waiveMutation = useWaiveSavingsCharge();
  const deleteMutation = useDeleteSavingsCharge();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [waiveId, setWaiveId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const charges = chargesData?.pageItems ?? [];

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
        accountId,
        payload: {
          chargeId: Number(values.chargeId),
          amount: Number(values.amount),
          dueDate: values.dueDate || undefined,
          dateFormat: "yyyy-MM-dd",
          locale: "en",
        },
      });
      setDialogOpen(false);
    },
    [accountId, createMutation],
  );

  const handleWaive = useCallback(async () => {
    if (!waiveId) return;
    await waiveMutation.mutateAsync({ accountId, chargeId: waiveId });
    setWaiveId(null);
  }, [accountId, waiveId, waiveMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync({ accountId, chargeId: deleteId });
    setDeleteId(null);
  }, [accountId, deleteId, deleteMutation]);

  const columns: ColumnDef<SavingsCharge>[] = [
    {
      key: "name",
      header: "Charge",
      accessorFn: (row) => <span className="text-sm font-medium">{row.name ?? `#${row.chargeId}`}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      accessorFn: (row) => <span className="text-sm font-mono">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "amountOutstanding",
      header: "Outstanding",
      accessorFn: (row) => <span className="text-sm font-mono">{formatCurrency(row.amountOutstanding)}</span>,
    },
    { key: "dueDate", header: "Due Date", accessorFn: (row) => <span className="text-sm">{row.dueDate ?? "—"}</span> },
    {
      key: "isPaid",
      header: "Status",
      accessorFn: (row) =>
        row.isPaid ? (
          <Badge variant="success" size="sm">
            Paid
          </Badge>
        ) : row.isWaived ? (
          <Badge variant="default" size="sm">
            Waived
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Pending
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          {!row.isPaid && !row.isWaived && row.waiverable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setWaiveId(row.id);
              }}
              title="Waive"
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
                setDeleteId(row.id);
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
          Charges
        </h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Apply Charge
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={charges}
            loading={isLoading}
            minWidth={700}
            emptyState={{ icon: <Receipt className="h-8 w-8 text-gray-300" />, message: "No charges applied." }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Charge</DialogTitle>
            <DialogDescription>Select charge and enter amount.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Charge *</Label>
              <Select onValueChange={(v) => setValue("chargeId", Number(v), { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select charge" />
                </SelectTrigger>
                <SelectContent>
                  {template?.chargeOptions?.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.name} ({formatCurrency(o.amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.chargeId && <p className="text-xs text-red-500">{errors.chargeId.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!waiveId}
        onOpenChange={() => setWaiveId(null)}
        title="Waive Charge"
        description="Waive this charge? Amount will be forgiven."
        onConfirm={handleWaive}
        variant="default"
        confirmLabel="Waive"
        loading={waiveMutation.isPending}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Charge"
        description="Are you sure?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default SavingsCharges;
