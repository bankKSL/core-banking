import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { DollarSign, RotateCcw, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdjustTransactionDialog } from "./AdjustTransactionDialog";
import { useUndoWaiveCharge } from "../hooks/useLoanCommands";
import { useLoanPermissions } from "../hooks/useLoanPermissions";
import { useToast } from "@/components/ui/toast";
import type { LoanTransaction } from "../types/loan";

interface LoanTransactionsTableProps {
  transactions: LoanTransaction[];
  loading?: boolean;
  loanId?: number;
  onSuccess?: () => void;
}

const formatCurrency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const getTransactionStatus = (tx: LoanTransaction): string => {
  if (tx.manuallyReversed) return "reversed";
  return "completed";
};

/** Format date from service (can be array [y,m,d] or string) */
const formatTxDate = (tx: LoanTransaction): string => {
  const raw = tx.date ?? tx.submittedOnDate;
  if (!raw) return "—";
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof raw === "string") return new Date(raw).toLocaleDateString();
  return "—";
};

const LoanTransactionsTable: FC<LoanTransactionsTableProps> = ({ transactions, loading, loanId, onSuccess }) => {
  const { t } = useTranslation();
  const [adjustTarget, setAdjustTarget] = useState<LoanTransaction | null>(null);
  const [undoWaiveTarget, setUndoWaiveTarget] = useState<LoanTransaction | null>(null);
  const { hasPermission } = useLoanPermissions();
  const { success: toastSuccess } = useToast();
  const undoWaiveMut = useUndoWaiveCharge();
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            {t("Transactions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            {t("Transactions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">{t("No transactions found.")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          {t("Transactions")} ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Date")}</TableHead>
              <TableHead>{t("Type")}</TableHead>
              <TableHead className="text-right">{t("Amount")}</TableHead>
              <TableHead className="text-right">{t("Principal")}</TableHead>
              <TableHead className="text-right">{t("Interest")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              {loanId && <TableHead className="text-right">{t("Actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs">{formatTxDate(tx)}</TableCell>
                <TableCell className="text-sm">{tx.type?.value ?? "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(tx.amount ?? 0, tx.currency.code)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-emerald-600">
                  {formatCurrency(tx.principalPortion ?? 0, tx.currency.code)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-amber-600">
                  {formatCurrency(tx.interestPortion ?? 0, tx.currency.code)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={getTransactionStatus(tx)}
                    label={tx.manuallyReversed ? t("Reversed") : t("Completed")}
                    size="sm"
                  />
                </TableCell>
                {loanId && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!tx.manuallyReversed && (
                        <Button variant="ghost" size="sm" onClick={() => setAdjustTarget(tx)}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {tx.type?.code === "waiveCharges" &&
                        !tx.manuallyReversed &&
                        loanId &&
                        hasPermission("UNDO_WAIVE_CHARGE") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUndoWaiveTarget(tx)}
                            title={t("Undo Waive")}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {loanId && (
        <AdjustTransactionDialog
          loanId={loanId}
          transaction={adjustTarget}
          open={!!adjustTarget}
          onOpenChange={(open) => {
            if (!open) setAdjustTarget(null);
          }}
          onSuccess={() => {
            setAdjustTarget(null);
            onSuccess?.();
          }}
        />
      )}

      <ConfirmDialog
        open={!!undoWaiveTarget}
        onOpenChange={(open) => !open && setUndoWaiveTarget(null)}
        title={t("Undo Waive Charge")}
        description={`${t("This will restore the waived charge of")} ${undoWaiveTarget ? new Intl.NumberFormat("en-US", { style: "currency", currency: undoWaiveTarget.currency?.code ?? "USD", maximumFractionDigits: 2 }).format(undoWaiveTarget.amount) : ""}. ${t("The client will owe this amount again.")}`}
        confirmLabel={t("Undo Waive")}
        variant="destructive"
        loading={undoWaiveMut.isPending}
        onConfirm={async () => {
          if (!undoWaiveTarget || !loanId) return;
          await undoWaiveMut.mutateAsync({ loanId, transactionId: undoWaiveTarget.id });
          toastSuccess(t("Waive charge undone successfully"));
          setUndoWaiveTarget(null);
          onSuccess?.();
        }}
      />
    </Card>
  );
};

export default LoanTransactionsTable;
export type { LoanTransactionsTableProps };
