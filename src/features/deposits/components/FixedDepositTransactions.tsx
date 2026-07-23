import { type FC, useState, useCallback } from "react";
import { Undo2, ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { useFixedDepositTransactions, useUndoFixedDepositTransaction } from "../hooks/useFixedDepositTransactions";
import type { FixedDepositTransaction } from "../api/deposit";
import type { ColumnDef } from "@/components/shared/DataTable";

const formatCurrency = (currency?: string, n?: number) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(n) : "—";

interface FixedDepositTransactionsProps {
  accountId: number;
}

const FixedDepositTransactions: FC<FixedDepositTransactionsProps> = ({ accountId }) => {
  const { data: txnsData, isLoading } = useFixedDepositTransactions(accountId);
  const undoMutation = useUndoFixedDepositTransaction();
  const [undoingId, setUndoingId] = useState<number | null>(null);

  const transactions = txnsData?.pageItems ?? [];

  const handleUndo = useCallback(
    async (transactionId: number) => {
      setUndoingId(transactionId);
      try {
        if (window.confirm("Undo this transaction? It will be reversed.")) {
          await undoMutation.mutateAsync({ accountId, transactionId });
        }
      } finally {
        setUndoingId(null);
      }
    },
    [accountId, undoMutation],
  );

  const columns: ColumnDef<FixedDepositTransaction>[] = [
    { key: "id", header: "ID", accessorFn: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "date",
      header: "Date",
      accessorFn: (row) => <span className="text-sm">{row.date ?? row.transactionDate ?? "—"}</span>,
    },
    {
      key: "type",
      header: "Type",
      accessorFn: (row) => (
        <Badge variant="info" size="sm">
          {row.type?.value ?? row.type?.code ?? "—"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessorFn: (row) => (
        <span className={`text-sm font-mono ${row.amount < 0 ? "text-red-500" : "text-green-600"}`}>
          {formatCurrency(row.currency?.code, Math.abs(row.amount))}
        </span>
      ),
    },
    {
      key: "reversed",
      header: "Status",
      accessorFn: (row) =>
        row.reversed ? (
          <Badge variant="error" size="sm">
            Reversed
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            Active
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          {!row.reversed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUndo(row.id);
              }}
              disabled={undoingId === row.id}
              title="Undo"
            >
              {undoingId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5" />
        Transactions
      </h3>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            loading={isLoading}
            minWidth={700}
            emptyState={{ icon: <ArrowLeftRight className="h-8 w-8 text-gray-300" />, message: "No transactions." }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedDepositTransactions;
