import { type FC } from "react";
import { ArrowLeftRight, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import type { SavingsTransaction } from "../api/deposit";
import type { ColumnDef } from "@/components/shared/DataTable";

const formatCurrency = (currency?: string, n?: number) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(n) : "—";

interface SavingsTransactionsProps {
  transactions: SavingsTransaction[];
  onUndo?: (transactionId: number) => void;
}

const SavingsTransactions: FC<SavingsTransactionsProps> = ({ transactions, onUndo }) => {
  const columns: ColumnDef<SavingsTransaction>[] = [
    { key: "id", header: "ID", accessorFn: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "date",
      header: "Date",
      accessorFn: (row) => <span className="text-sm">{row.date ?? row.transactionDate ?? "—"}</span>,
    },
    {
      key: "type",
      header: "Type",
      accessorFn: (row: SavingsTransaction) => (
        <Badge variant={row.transactionType.transactionTypeEnum === "WITHDRAWAL" ? "error" : "info"} size="sm">
          {row.transactionType.value ?? "—"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      accessorFn: (row) => (
        <span className={`text-sm font-mono ${row.entryType === "DEBIT" ? "text-red-500" : "text-green-600"}`}>
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
      header: "",
      cell: (row: SavingsTransaction) =>
        !row.reversed && onUndo ? (
          <Button variant="ghost" size="sm" onClick={() => onUndo(row.id)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : null,
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
            minWidth={700}
            emptyState={{ icon: <ArrowLeftRight className="h-8 w-8 text-gray-300" />, message: "No transactions." }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsTransactions;
