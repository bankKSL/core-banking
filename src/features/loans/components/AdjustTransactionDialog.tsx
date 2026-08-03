import { type FC, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Undo2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { undoTransaction, modifyTransaction } from "../api/transactionAdjustment";
import { formatFineractDate, formatMoney } from "../utils/format";

interface AdjustmentTransaction {
  id: number;
  type: { value: string };
  amount: number;
  date: string | number[];
}

interface AdjustTransactionDialogProps {
  loanId: number;
  transaction: AdjustmentTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Mode = "idle" | "undo" | "modify";

const AdjustTransactionDialog: FC<AdjustTransactionDialogProps> = ({
  loanId,
  transaction,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [mode, setMode] = useState<Mode>("idle");
  const [modifyDate, setModifyDate] = useState("");
  const [modifyAmount, setModifyAmount] = useState(0);

  const undoMutation = useMutation({
    mutationFn: () => undoTransaction(loanId, transaction!.id),
    onSuccess: () => {
      setMode("idle");
      onOpenChange(false);
      onSuccess();
    },
  });

  const modifyMutation = useMutation({
    mutationFn: () =>
      modifyTransaction(loanId, transaction!.id, {
        transactionDate: modifyDate || undefined,
        transactionAmount: modifyAmount || undefined,
      }),
    onSuccess: () => {
      setMode("idle");
      onOpenChange(false);
      onSuccess();
    },
  });

  const isMutating = undoMutation.isPending || modifyMutation.isPending;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMode("idle");
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Transaction</DialogTitle>
            <DialogDescription>
              {transaction
                ? `${transaction.type?.value ?? "Transaction"} — ${formatMoney(transaction.amount)} on ${formatFineractDate(transaction.date)}`
                : "Select an adjustment option."}
            </DialogDescription>
          </DialogHeader>

          {mode === "idle" && (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="justify-start gap-3 h-12"
                onClick={() => setMode("undo")}
                disabled={isMutating}
              >
                <Undo2 className="h-5 w-5 text-amber-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Undo Transaction</p>
                  <p className="text-xs text-gray-500">Reverse this transaction completely.</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-12"
                onClick={() => {
                  if (transaction) {
                    const d = transaction.date;
                    setModifyDate(
                      Array.isArray(d) && d.length >= 3
                        ? `${d[0]}-${String(d[1]).padStart(2, "0")}-${String(d[2]).padStart(2, "0")}`
                        : String(d ?? ""),
                    );
                    setModifyAmount(transaction.amount);
                  }
                  setMode("modify");
                }}
                disabled={isMutating}
              >
                <Pencil className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">Modify Transaction</p>
                  <p className="text-xs text-gray-500">Change the date or amount of this transaction.</p>
                </div>
              </Button>
            </div>
          )}

          {mode === "modify" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium" htmlFor="modifyDate">
                  Transaction Date
                </label>
                <Input
                  id="modifyDate"
                  type="date"
                  value={modifyDate}
                  onChange={(e) => setModifyDate(e.target.value)}
                  disabled={isMutating}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="block text-sm font-medium" htmlFor="modifyAmount">
                  Transaction Amount
                </label>
                <Input
                  id="modifyAmount"
                  type="number"
                  step="0.01"
                  value={modifyAmount}
                  onChange={(e) => setModifyAmount(Number(e.target.value))}
                  disabled={isMutating}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMode("idle")} disabled={isMutating}>
                  Back
                </Button>
                <Button onClick={() => modifyMutation.mutate()} disabled={isMutating}>
                  {modifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Undo confirmation */}
      <ConfirmDialog
        open={mode === "undo"}
        onOpenChange={(open) => !open && setMode("idle")}
        title="Undo Transaction"
        description={`Reverse the ${transaction?.type?.value ?? "transaction"} of ${formatMoney(transaction?.amount ?? 0)}? This action cannot be undone.`}
        confirmLabel="Undo"
        variant="destructive"
        loading={undoMutation.isPending}
        onConfirm={() => undoMutation.mutate()}
      />
    </>
  );
};

export { AdjustTransactionDialog };
export type { AdjustTransactionDialogProps, AdjustmentTransaction };
