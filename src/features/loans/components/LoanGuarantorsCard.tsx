import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ClientSearch } from "@/components/shared/ClientSearch";
import type { LoanGuarantor } from "../types/loan";
import { createLoanGuarantorSchema, type CreateLoanGuarantorFormValues } from "../schemas/loan.schema";
import { useLoanGuarantors, useAddLoanGuarantor, useUpdateLoanGuarantor, useDeleteLoanGuarantor } from "../hooks/useLoanGuarantors";
import { formatMoney } from "../utils/format";

interface LoanGuarantorsCardProps {
  loanId: number;
  currencyCode?: string;
  guarantors?: LoanGuarantor[];
}

const LoanGuarantorsCard: FC<LoanGuarantorsCardProps> = ({ loanId, currencyCode = "USD", guarantors: initial }) => {
  const guarantorsQuery = useLoanGuarantors(initial ? undefined : loanId);
  const items = initial ?? guarantorsQuery.data ?? [];

  const addMutation = useAddLoanGuarantor();
  const updateMutation = useUpdateLoanGuarantor();
  const deleteMutation = useDeleteLoanGuarantor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LoanGuarantor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanGuarantor | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLoanGuarantorFormValues>({
    resolver: zodResolver(createLoanGuarantorSchema),
    defaultValues: { clientId: 0, amount: 0 },
  });

  const clientIdValue = watch("clientId");

  const openCreate = () => {
    reset({ clientId: 0, amount: 0 });
    setDialogOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    await addMutation.mutateAsync({ loanId, payload: values });
    setDialogOpen(false);
  });

  const isMutating = addMutation.isPending || deleteMutation.isPending;
  const displayName = (g: LoanGuarantor) =>
    g.clientName ?? [g.firstname, g.lastname].filter(Boolean).join(" ") ?? "—";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            Guarantors ({items.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Add Guarantor
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No guarantors linked to this loan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="text-sm font-medium">{displayName(g)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{g.guarantorType?.value ?? "Existing Client"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatMoney(g.amount, currencyCode)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditTarget(g);
                          setEditAmount(String(g.amount ?? 0));
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(g)}>
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

      {/* Add guarantor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Guarantor</DialogTitle>
            <DialogDescription>Link an existing client as guarantor for this loan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <ClientSearch
              value={clientIdValue}
              onChange={(id) => setValue("clientId", id, { shouldValidate: true })}
              disabled={isMutating}
              error={errors.clientId?.message}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Guaranteed Amount *</label>
              <Input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                disabled={isMutating}
                error={errors.amount?.message}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Guarantor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit guarantor dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guarantor</DialogTitle>
            <DialogDescription>Update guaranteed amount for {editTarget ? displayName(editTarget) : ""}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Guaranteed Amount</label>
              <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button
                disabled={updateMutation.isPending}
                onClick={async () => {
                  if (!editTarget) return;
                  await updateMutation.mutateAsync({
                    loanId,
                    guarantorId: editTarget.id,
                    payload: { amount: Number(editAmount) },
                  });
                  setEditTarget(null);
                }}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove Guarantor"
        description={`Remove ${displayName(deleteTarget ?? { id: 0, amount: 0 })} as guarantor?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync({ loanId, guarantorId: deleteTarget.id });
          setDeleteTarget(null);
        }}
      />
    </>
  );
};

export default LoanGuarantorsCard;
export type { LoanGuarantorsCardProps };
